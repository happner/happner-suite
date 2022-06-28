const Internals = require('./shared/internals');
const commons = require('happn-commons');
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
    if (!this.#boundExchangeCache) return;
    return this.#boundExchangeCache.clear();
  }
  #getCachedBoundComponentKey(origin, componentName = '*', methodName = '*') {
    return `${origin.username}:${componentName}:${methodName}`;
  }
  #getCachedBoundComponent(origin, componentName, methodName) {
    if (!this.#boundExchangeCache) return null;
    return this.#boundExchangeCache.get(
      this.#getCachedBoundComponentKey(origin, componentName, methodName),
      {
        clone: false,
      }
    );
  }
  #setCachedBoundComponent(origin, componentName, methodName, exchange) {
    if (!this.#boundExchangeCache) return exchange;
    this.#boundExchangeCache.set(
      this.#getCachedBoundComponentKey(origin, componentName, methodName),
      exchange,
      {
        clone: false,
      }
    );
    return exchange;
  }
  originBindingNecessary(origin, override) {
    //not a secure mesh:
    if (!this.#mesh.config.happn.secure) {
      return false;
    }
    //origin binding for this request specifically
    if (typeof override === 'boolean') {
      return override;
    }
    //dont delegate authority to _ADMIN, no origin is an internal call:
    if (!origin || origin.username === '_ADMIN') {
      return false;
    }
    //origin binding for this origin specifically
    if (typeof origin.override === 'boolean') {
      return origin.override;
    }
    //authority delegation not set up on component, and not set up on the server
    if (
      this.#config?.security?.authorityDelegationOn !== true &&
      !this.#mesh.config.authorityDelegationOn
    ) {
      return false;
    }
    //authority delegation explicitly set not to happen for this component
    if (this.#config?.security?.authorityDelegationOn === false) {
      return false;
    }
    return true;
  }
  getBoundComponent(origin, override, componentName, methodName) {
    if (!this.originBindingNecessary(origin, override)) {
      return this.#componentInstance;
    }
    let bound = this.#getCachedBoundComponent(origin, componentName, methodName);
    if (bound) return bound;

    bound = Object.assign({}, this.#componentInstance);
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
      get: function () {
        return this.#componentInstance.mesh;
      },
    });
    const boundOrigin = commons._.merge(origin, { override: true });
    Object.defineProperty(bound, 'bound', {
      get: function () {
        return boundOrigin;
      },
    });
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
    return this.#setCachedBoundComponent(boundOrigin, componentName, methodName, bound);
  }

  #secureExchangeBoundToOriginMethods(component, boundComponent, origin, methodName) {
    if (typeof component !== 'object') return;
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
