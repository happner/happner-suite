const Internals = require('./shared/internals');
module.exports = class ComponentInstanceBoundFactory {
  #componentInstance;
  #mesh;
  #componentName;
  #boundExchangeCache;
  #config;

  get cache() {
    return this.#boundExchangeCache;
  }

  constructor(componentInstance, mesh) {
    this.#componentInstance = componentInstance;
    this.#mesh = mesh;
    this.#componentName = componentInstance.name;
    this.#config = componentInstance.config;
    this.#initialize();
  }
  static create(componentInstance, mesh) {
    return new ComponentInstanceBoundFactory(componentInstance, mesh);
  }
  #initialize() {
    this.#boundExchangeCache = this.#mesh.happn.server.services.cache.getOrCreate(
      'happner-bound-exchange-' + this.#componentName,
      {
        type: 'LRU',
        cache: {
          max: this.#mesh.config.boundExchangeCacheSize || 10e3,
        },
      }
    );
    this.#clearBoundComponentCache();
    //ensure if security changes, we discard bound exchanges
    this.#mesh.happn.server.services.security.on(
      'security-data-changed',
      this.#clearBoundComponentCache.bind(this)
    );
  }
  #clearBoundComponentCache() {
    return this.#boundExchangeCache.clear();
  }
  #getCachedBoundComponentKey(origin, componentName = '*', methodName = '*', sessionType) {
    return `${origin.username}:${componentName}:${methodName}:${sessionType}`;
  }
  #getCachedBoundComponent(origin, componentName, methodName, sessionType) {
    return this.#boundExchangeCache.get(
      this.#getCachedBoundComponentKey(origin, componentName, methodName, sessionType),
      {
        clone: false,
      }
    );
  }
  #setCachedBoundComponent(origin, componentName, methodName, sessionType, exchange) {
    this.#boundExchangeCache.set(
      this.#getCachedBoundComponentKey(origin, componentName, methodName, sessionType),
      exchange,
      {
        clone: false,
      }
    );
    return exchange;
  }
  // sometimes we want to stay bound regardless of whether the edge is authorized, this is when we are getting a bound component
  // as opposed to doing the authorization in the component-instance
  originBindingNecessary(origin, override, checkEdgeAuthorized = false) {
    //not a secure mesh:
    if (!this.#mesh.config.happn.secure) {
      return false;
    }
    //null origin is an internal function:
    if (origin == null) {
      return false;
    }
    //don't delegate authority to _ADMIN, no origin is also an internal call:
    if (origin?.username === '_ADMIN') {
      return false;
    }
    // backward compatible edge authorization that allows _ADMIN passthrough on subsequent inter exchange requests
    // when no "as" is specified
    const edgeAuthorized = checkEdgeAuthorized && origin?.edgeAuthorized === true;

    // auth delegation is switched on specifically for this component or mesh-wide
    const authDelegationOn =
      this.#config?.security?.authorityDelegationOn === true ||
      this.#mesh?.config?.authorityDelegationOn === true;

    // auth delegation is off, and we have already authorized at the edge
    if (edgeAuthorized && !authDelegationOn) {
      return false;
    }

    //origin binding for this request specifically, regardless of security settings
    if (typeof override === 'boolean') {
      return override;
    }

    //origin binding for this origin specifically, regardless of security settings
    if (typeof origin?.override === 'boolean') {
      return origin.override;
    }

    //mesh-wide auth delegation is on, but this component specifically is off
    if (authDelegationOn && this.#config?.security?.authorityDelegationOn === false) {
      return false;
    }

    return authDelegationOn;
  }
  getBoundComponent(origin, override, componentName, methodName, sessionType = 1) {
    if (!this.originBindingNecessary(origin, override)) {
      return this.#componentInstance;
    }
    let bound = this.#getCachedBoundComponent(origin, componentName, methodName, sessionType);
    if (bound) return bound;

    bound = Object.assign({}, this.#componentInstance);
    bound.as = this.#componentInstance.as.bind(this.#componentInstance);

    Object.defineProperty(bound, 'info', {
      value: this.#componentInstance.info,
      writable: false,
    });
    Object.defineProperty(bound, 'log', {
      value: this.#componentInstance.log,
      writable: false,
    });
    Object.defineProperty(bound, 'name', {
      value: this.#componentInstance.name,
      writable: false,
    });
    //access level is down to _mesh in actual component
    Object.defineProperty(bound, '_mesh', {
      value: this.#componentInstance._mesh,
      writable: false,
    });
    //backward compatability for deprecation
    Object.defineProperty(bound, 'mesh', {
      get: () => {
        return this.#componentInstance.mesh;
      },
    });
    const boundOrigin = Object.assign({}, origin, { override: true, type: sessionType });
    bound.bound = boundOrigin;

    bound.data = require('./component-instance-data').create(
      this.#mesh.data,
      this.#componentName,
      boundOrigin
    );
    bound.exchange = this.#secureExchangeBoundToOrigin(
      this.#componentInstance.exchange,
      boundOrigin,
      componentName,
      methodName
    );
    bound.event = this.#secureEventBoundToOrigin(
      this.#componentInstance.event,
      boundOrigin,
      componentName
    );
    return this.#setCachedBoundComponent(
      boundOrigin,
      componentName,
      methodName,
      sessionType,
      bound
    );
  }

  #secureExchangeBoundToOriginMethods(component, boundComponent, origin, methodName) {
    Object.keys(component)
      .filter((exchangeMethodName) => {
        return methodName != null ? exchangeMethodName === methodName : true;
      })
      .forEach((methodName) => {
        if (typeof component[methodName] === 'function') {
          boundComponent[methodName] = component[methodName].bind({
            $self: component[methodName],
            $origin: origin,
          });
          return;
        }
        // for nested methods, recursive
        if (typeof component[methodName] === 'object') {
          boundComponent[methodName] = {};
          return this.#secureExchangeBoundToOriginMethods(
            component[methodName],
            boundComponent[methodName],
            origin
          );
        }
        boundComponent[methodName] = component[methodName];
      });
  }
  #secureExchangeBoundToOrigin(exchange, origin, componentName, methodName) {
    const boundExchange = {};
    Object.keys(exchange)
      .filter((exchangeComponentName) => {
        return componentName != null ? exchangeComponentName === componentName : true;
      })
      .forEach((componentName) => {
        if (componentName === '$call') {
          boundExchange.$call = Internals._createDecoupledCall(boundExchange);
          return;
        }
        boundExchange[componentName] = {};
        this.#secureExchangeBoundToOriginMethods(
          exchange[componentName],
          boundExchange[componentName],
          origin,
          methodName
        );
      });
    return boundExchange;
  }
  #secureEventBoundToOrigin(event, origin, componentName) {
    const boundEvent = {};
    Object.keys(event)
      .filter((exchangeComponentName) => {
        return componentName != null ? exchangeComponentName === componentName : true;
      })
      .forEach(function (componentName) {
        //special $call method - not an event api
        if (componentName === '$call') return;
        boundEvent[componentName] = {};
        if (event[componentName].__endpoint) {
          boundEvent[componentName] = Internals._getSubscriber(
            event[componentName].__endpoint,
            event[componentName].__domain,
            componentName,
            origin.username
          );
          return;
        }
        Object.keys(event[componentName]).forEach(function (subComponentName) {
          if (event[componentName][subComponentName].__endpoint)
            boundEvent[componentName][subComponentName] = Internals._getSubscriber(
              event[componentName][subComponentName].__endpoint,
              event[componentName][subComponentName].__domain,
              subComponentName,
              origin.username
            );
        });
      });
    return boundEvent;
  }
};
