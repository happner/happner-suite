const commons = require('happn-commons');
const utilities = require('./utilities');
const EventEmitter = require('events').EventEmitter;
const semver = require('happner-semver');
module.exports = class ComponentInstance {
  #authorizer;
  #log;
  #name;
  #config;
  #info;
  #mesh;
  #module;
  #callbackIndexes;
  #localEventEmitter;
  #boundComponentInstanceFactory;
  #tools;
  constructor() {
    this.#callbackIndexes = {};
    this.#localEventEmitter = new EventEmitter();
  }
  get Mesh() {
    // local Mesh definition avaliable on $happn
    return require('../mesh');
  }
  get name() {
    return this.#name;
  }
  get config() {
    return this.#config;
  }
  get info() {
    return this.#info;
  }
  get mesh() {
    this.#log.warn('Use of $happn.mesh.* is deprecated. Use $happn.*');
    return this;
  }
  get module() {
    return this.#module;
  }
  get log() {
    return this.#log;
  }
  get localEventEmitter() {
    return this.#localEventEmitter;
  }
  //used by mesh & packager
  get tools() {
    return this.#tools;
  }

  async isAuthorized(username, permissions) {
    return await this.#authorizer.checkAuthorizations(username, permissions);
  }

  #defaults(config) {
    try {
      const defaults = this.#module.instance?.$happner?.config?.component;
      Object.keys(defaults).forEach((key) => {
        // - Defaulting applies only to the 'root' keys nested immediately
        //   under the 'component' config
        // - Does not merge.
        // - Each key in the default is only used if the corresponding key is
        //   not present in the inbound config.
        if (config[key] === undefined) {
          config[key] = commons.fastClone(defaults[key]);
        }
      });
    } catch (e) {
      //do nothing, defaults is null or not object
    }
    return config;
  }

  initialize(name, mesh, module, config, callback) {
    this.#module = module;
    this.#mesh = mesh;
    this.#name = name;
    this.#config = this.#defaults(config);
    this.#tools = mesh.tools;

    this.#info = {
      mesh: {
        name: mesh._mesh.config.name,
        domain: mesh._mesh.config.domain,
      }, // name,
      happn: {
        options: mesh._mesh.config.happn.setOptions,
      }, // address, options
    };

    this.#log = mesh._mesh.log.createLogger(this.name);
    this.#log.trace('create instance');

    this.#authorizer = require('./authorizer').create(
      mesh._mesh.happn.server.services.security,
      mesh._mesh.happn.server.services.session,
      mesh._mesh.data
    );

    Object.defineProperty(this.#info.happn, 'address', {
      enumerable: true,
      get: function () {
        var address = mesh._mesh.happn.server.server.address();
        try {
          address.protocol = mesh._mesh.config.happn.services.transport.config.mode;
        } catch (e) {
          address.protocol = 'http';
        }
        return address;
      },
    });

    if (this.#config.accessLevel === 'mesh' || this.#config.accessLevel === 'root') {
      Object.defineProperty(this, '_mesh', {
        get: function () {
          return mesh._mesh;
        },
        enumerable: true,
      });
    }

    // Each component has it's own exchange
    // to allow happner-cluster to replace components with the proper from elsewhere in the cluster
    // without affecting other components.
    //
    // this.exchange = mesh.exchange;
    // this.event = mesh.event;
    //
    // they are loaded as a last step in mesh.js (See mesh._initializeComponents)
    this.exchange = {};
    this.event = {};
    this.localEvent = {};
    this.asAdmin = this; //in case we use $happn.asAdmin but have not bound to origin
    this.data = require('./component-instance-data').create(mesh._mesh.data, this.name);
    this.#boundComponentInstanceFactory = require('./component-instance-bound-factory').create(
      this,
      mesh._mesh
    );
    this.#attach(config, mesh._mesh, callback);
  }

  #getCallbackIndex(methodSchema) {
    if (this.#callbackIndexes[methodSchema.name] == null) {
      for (var i in methodSchema.parameters) {
        if (methodSchema.parameters[i].type === 'callback') {
          this.#callbackIndexes[methodSchema.name] = i;
          return i;
        }
      }
      this.#callbackIndexes[methodSchema.name] = -1;
    }
    return this.#callbackIndexes[methodSchema.name];
  }

  #getCallbackProxy(methodName, callback, origin) {
    let callbackCalled = false;
    const callbackProxy = function () {
      if (callbackCalled) {
        return this.#log.error(
          'Callback invoked more than once for method %s',
          methodName,
          callback.toString()
        );
      }
      callbackCalled = true;
      callback(null, Array.prototype.slice.apply(arguments));
    }.bind(this);
    callbackProxy.$origin = origin;
    return callbackProxy;
  }

  operate(methodName, parameters, callback, origin, version, originBindingOverride) {
    this.#authorizeOriginMethod(
      methodName,
      origin,
      (e) => {
        if (e) {
          return callback(e);
        }
        const methodSchema = this.description.methods[methodName];
        const methodDefn = this.#module.instance[methodName];

        if (!methodSchema || typeof methodDefn !== 'function') {
          return this.#callBackWithWarningAndError(
            'Missing method',
            `Call to unconfigured method [${this.name}.${methodName}()]`,
            callback
          );
        }
        let callbackIndex = this.#getCallbackIndex(methodSchema);

        if (version != null && !this.#satisfies(this.#module.version, version)) {
          return this.#callBackWithWarningAndError(
            'Component version mismatch',
            `Call to unconfigured method [${
              this.name
            }.${methodName}]: request version [${version}] does not match component version [${
              this.#module.version
            }]`,
            callback
          );
        }

        this.#log.trace('operate( %s', methodName);
        this.#log.trace('parameters ', parameters);
        this.#log.trace('methodSchema ', methodSchema);

        if (methodSchema.type === 'sync-promise') {
          let result;
          try {
            result = methodDefn.apply(
              this.#module.instance,
              this.#inject(methodDefn, parameters, origin)
            );
          } catch (syncPromiseError) {
            return callback(null, [syncPromiseError]);
          }
          return callback(null, [null, result]);
        }
        const callbackProxy = this.#getCallbackProxy(methodName, callback, origin);

        if (callbackIndex === -1) {
          if (!methodSchema.isAsyncMethod) {
            parameters.push(callbackProxy);
          }
        } else {
          parameters.splice(callbackIndex, 1, callbackProxy);
        }

        let returnObject;
        try {
          returnObject = methodDefn.apply(
            this.#module.instance,
            this.#inject(methodDefn, parameters, origin)
          );
        } catch (err) {
          callbackProxy(err);
          return;
        }

        if (utilities.isPromise(returnObject)) {
          if (callbackIndex > -1 && utilities.isPromise(returnObject)) {
            this.#log.warn('method has been configured as a promise with a callback...');
          } else {
            returnObject
              .then(function (result) {
                callbackProxy(null, result);
              })
              .catch(function (err) {
                callbackProxy(err);
              });
          }
        }
      },
      originBindingOverride
    );
  }

  #callBackWithWarningAndError(category, message, callback) {
    const error = new Error(message);
    this.#log.warn(`${category}:${message}`);
    return callback(error);
  }

  #attach(config, mesh, callback) {
    //attach module to the transport layer
    this.#log.trace('_attach()');
    this.emit = (key, data, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      if (options == null) options = {};
      if (options.noStore == null) options.noStore = true;

      options.meta = {
        componentVersion: this.#module.version,
      };

      const eventKey = `/_events/${this.info.mesh.domain}/${this.name}/`;

      if ([1, 3].indexOf(options.consistency) > -1) {
        options.onPublished = (e, results) => {
          if (e) return this.#raiseOnPublishError(e);
          this.#raiseOnPublishOK(results);
        };
      }

      mesh.data.set(eventKey + key, data, options, (e, response) => {
        if (e) return this.#raiseOnEmitError(e);
        this.#raiseOnEmitOK(response);
        if (callback) callback(e, response);
      });
    };

    this.emitLocal = (key, data, callback) => {
      // differs from .emit() in that the publish does not replicate into the cluster
      var eventKey = '/_events/' + this.info.mesh.domain + '/' + this.name + '/';

      mesh.data.set(
        eventKey + key,
        data,
        {
          noStore: true,
          noCluster: true,
          meta: {
            componentVersion: this.#module.version,
          },
        },
        callback
      );
    };

    if (config.web && config.web.routes) {
      try {
        Object.keys(config.web.routes).forEach((route) => {
          var routeTarget = config.web.routes[route];
          var meshRoutePath = '/' + this.info.mesh.name + '/' + this.name + '/' + route;
          var componentRoutePath = '/' + this.name + '/' + route;

          if (Array.isArray(routeTarget)) {
            routeTarget.map((targetMethod) => {
              this.#attachRouteTarget(mesh, meshRoutePath, componentRoutePath, targetMethod, route);
            });
          } else {
            this.#attachRouteTarget(mesh, meshRoutePath, componentRoutePath, routeTarget, route);
          }
        });
      } catch (e) {
        this.#log.error('Failure to attach web methods', e);
        return callback(e);
      }
    }
    const subscribeMask = this.#getSubscribeMask();
    this.#log.trace('data.on( ' + subscribeMask);
    mesh.data.on(
      subscribeMask,
      {
        event_type: 'set',
      },
      (publication, meta) => {
        this.#log.trace('received request at %s', subscribeMask);
        let message = publication;
        let method = meta.path.split('/').pop();
        const args = Array.isArray(message.args) ? message.args.slice(0, message.args.length) : [];
        if (!message.callbackAddress) return this.#discardMessage('No callback address', message);
        this.operate(
          method,
          args,
          (e, responseArguments) => {
            var serializedError;

            if (e) {
              // error objects cant be sent / received  (serialize)
              serializedError = {
                message: e.message,
                name: e.name,
              };

              Object.keys(e).forEach(function (key) {
                serializedError[key] = e[key];
              });

              this.#log.trace('operate( reply( ERROR %s', message.callbackAddress);

              return this.#reply(
                message.callbackAddress,
                message.callbackPeer,
                {
                  status: 'failed',
                  args: [serializedError],
                },
                this.info.happn.options,
                mesh
              );
            }

            var response = {
              status: 'ok',
              args: responseArguments,
            };

            if (responseArguments[0] instanceof Error) {
              response.status = 'error';

              var responseError = responseArguments[0];

              serializedError = {
                message: responseError.message,
                name: responseError.name,
              };

              Object.keys(responseError).forEach(function (key) {
                serializedError[key] = responseError[key];
              });

              responseArguments[0] = serializedError;
            }

            // Populate response to the callback address
            this.#log.trace('operate( reply( RESULT %s', message.callbackAddress);

            var options = this.#createSetOptions(publication.origin.id, this.info.happn.options);
            this.#reply(message.callbackAddress, message.callbackPeer, response, options, mesh);
          },
          meta.eventOrigin || message.origin,
          message.version
        );
      },
      function (e) {
        callback(e);
      }
    );
  }

  #createSetOptions(originId, options) {
    if (this.config.directResponses)
      return commons._.merge(
        {
          targetClients: [originId],
        },
        options
      );
    else return options;
  }

  #getSubscribeMask() {
    return `/_exchange/requests/${this.info.mesh.domain}/${this.name}/*`;
  }

  #satisfies(moduleVersion, version) {
    return semver.coercedSatisfies(moduleVersion, version);
  }

  on(event, handler) {
    try {
      this.#log.trace('component on called', event);
      return this.#localEventEmitter.on(event, handler);
    } catch (e) {
      this.#log.trace('component on error', e);
    }
  }

  offEvent(event, handler) {
    try {
      this.#log.trace('component offEvent called', event);
      return this.#localEventEmitter.offEvent(event, handler);
    } catch (e) {
      this.#log.trace('component offEvent error', e);
    }
  }

  emitEvent(event, data) {
    try {
      this.#log.trace('component emitEvent called', event);
      return this.#localEventEmitter.emit(event, data);
    } catch (e) {
      this.#log.trace('component emitEvent error', e);
    }
  }

  #authorizeOriginMethod(methodName, origin, callback, originBindingOverride) {
    if (
      !this.#boundComponentInstanceFactory.originBindingNecessary(origin, originBindingOverride)
    ) {
      return callback(null, true);
    }
    const subscribeMask = this.#getSubscribeMask();
    const permissionPath = subscribeMask.substring(0, subscribeMask.length - 1) + methodName;
    this.#mesh._mesh.happn.server.services.security.getOnBehalfOfSession(
      {
        user: {
          username: '_ADMIN',
        },
      },
      origin.username,
      origin.type,
      (e, originSession) => {
        if (e) return callback(e);
        this.#mesh._mesh.happn.server.services.security.authorize(
          originSession,
          permissionPath,
          'set',
          (e, authorized, reason) => {
            if (e) return callback(e);
            if (!authorized)
              return callback(
                this.#mesh._mesh.happn.server.services.error.AccessDeniedError(
                  'unauthorized',
                  reason || 'request on behalf of unauthorised user: ' + origin.username
                )
              );
            callback();
          }
        );
      }
    );
  }

  #getMethodDefn(config, methodName) {
    if (!config.schema) return;
    if (!config.schema.methods) return;
    if (!config.schema.methods[methodName]) return;
    return config.schema.methods[methodName];
  }

  #parseWebRoutes() {
    const webMethods = {}; // accum list of webMethods to exclude from exhange methods description
    const routes = this.config.web.routes;
    Object.keys(routes).forEach((routePath) => {
      let route = routes[routePath];

      if (route instanceof Array)
        route.forEach(function (method) {
          webMethods[method] = 1;
          route = method; // last in route array is used to determine type: static || mware
        });
      else webMethods[route] = 1;

      if (routePath === 'static') routePath = '/';
      else if (this.name === 'www' && routePath === 'global') return;
      else if (this.name === 'www' && routePath !== 'global') routePath = '/' + routePath;
      else if (routePath === 'resources' && this.name === 'resources') routePath = '/' + routePath;
      else routePath = '/' + this.name + '/' + routePath;

      this.description.routes[routePath] = {};
      this.description.routes[routePath].type = route === 'static' ? 'static' : 'mware';
    });
    return webMethods;
  }

  as(username, componentName, methodName, sessionType) {
    return this.#boundComponentInstanceFactory.getBoundComponent(
      { username },
      true,
      componentName,
      methodName,
      sessionType
    );
  }

  describe(cached) {
    if (cached !== false && this.description) {
      return this.description;
    }
    Object.defineProperty(this, 'description', {
      value: {
        name: this.name,
        version: this.#module.version,
        methods: {},
        routes: {},
      },
      configurable: true,
    });

    let webMethods = {};
    if (this.config.web && this.config.web.routes) {
      webMethods = this.#parseWebRoutes();
    }

    // build description.events (components events)
    if (this.config.events) this.description.events = utilities.clone(this.config.events);
    else this.description.events = {};

    if (this.config.data) this.description.data = utilities.clone(this.config.data);
    else this.description.data = {};

    //get all methods that are not inherited from Object, Stream, and EventEmitter
    const methodNames = utilities.getAllMethodNames(this.#module.instance, {
      ignoreInheritedNativeMethods: true,
    });

    for (var methodName of methodNames) {
      let method = this.#module.instance[methodName];
      let methodDefined = this.#getMethodDefn(this.config, methodName);
      let isAsyncMethod = method.toString().substring(0, 6) === 'async ';
      if (methodDefined) methodDefined.isAsyncMethod = isAsyncMethod;

      if (method.$happner && method.$happner.ignore && !methodDefined) continue;
      if (methodName.indexOf('_') === 0 && !methodDefined) continue;
      if (!this.config.schema || (this.config.schema && !this.config.schema.exclusive)) {
        // no schema or not exclusive, allow all (except those filtered above and those that are webMethods)
        if (webMethods[methodName]) continue;
        this.description.methods[methodName] = methodDefined = methodDefined || {
          isAsyncMethod,
        };
        if (!methodDefined.parameters) {
          this.#defaultParameters(method, methodDefined);
        }
        continue;
      }

      if (methodDefined) {
        // got schema and exclusive is true (per filter in previous if) and have definition
        this.description.methods[methodName] = methodDefined;
        if (!methodDefined.parameters) {
          this.#defaultParameters(method, methodDefined);
        }
      }
    }
    return this.description;
  }

  #inject(methodDefn, parameters, origin) {
    if (parameters.length < methodDefn.$argumentsLength) {
      // pad undefined values
      parameters = parameters.concat(
        new Array(methodDefn.$argumentsLength - parameters.length).fill(undefined)
      );
    }
    if (methodDefn.$happnSeq != null && methodDefn.$originSeq != null) {
      // these must happen in the order of the smallest sequence first
      if (methodDefn.$happnSeq < methodDefn.$originSeq) {
        parameters.splice(
          methodDefn.$happnSeq,
          0,
          this.#boundComponentInstanceFactory.getBoundComponent(origin)
        );
        parameters.splice(methodDefn.$originSeq, 0, origin);
      } else {
        parameters.splice(methodDefn.$originSeq, 0, origin);
        parameters.splice(
          methodDefn.$happnSeq,
          0,
          this.#boundComponentInstanceFactory.getBoundComponent(origin)
        );
      }
    } else {
      if (methodDefn.$originSeq != null) {
        parameters.splice(methodDefn.$originSeq, 0, origin);
      }
      if (methodDefn.$happnSeq != null) {
        parameters.splice(
          methodDefn.$happnSeq,
          0,
          this.#boundComponentInstanceFactory.getBoundComponent(origin)
        );
      }
    }
    return parameters;
  }

  #defaultParameters(method, methodSchema) {
    if (!methodSchema.parameters) methodSchema.parameters = [];
    utilities
      .getFunctionParameters(method)
      .filter(function (argName) {
        return argName !== '$happn' && argName !== '$origin';
      })
      .map(function (argName) {
        methodSchema.parameters.push({
          name: argName,
        });
      });
  }

  #discardMessage(reason, message) {
    this.#log.warn('message discarded: %s', reason, message);
  }

  #hasNext(methodDefn) {
    var parameters = utilities.getFunctionParameters(methodDefn);
    return parameters.indexOf('next') >= 0;
  }

  #getWebOrigin(mesh, params) {
    var cookieName = null;

    try {
      cookieName = mesh.config.happn.services.connect.config.middleware.security.cookieName;
    } catch (e) {
      // do nothing
    } //do nothing

    return mesh.happn.server.services.security.sessionFromRequest(params[0], {
      cookieName: cookieName,
    });
  }

  #runWithInjection(args, mesh, methodDefn) {
    const parameters = Array.prototype.slice.call(args);
    const origin = this.#getWebOrigin(mesh, parameters);
    methodDefn.apply(this.#module.instance, this.#inject(methodDefn, parameters, origin));
  }

  #attachRouteTarget(mesh, meshRoutePath, componentRoutePath, targetMethod) {
    let serve;
    let connect = mesh.happn.server.connect;
    let methodDefn =
      typeof targetMethod === 'function' ? targetMethod : this.#module.instance[targetMethod];
    let componentRef = componentRoutePath.substring(1);
    let _this = this;

    if (typeof methodDefn !== 'function')
      throw new Error(
        `Middleware target ${_this.name}:${targetMethod} not a function or null, check your happner web routes config`
      );

    if (
      typeof methodDefn.$happnSeq !== 'undefined' ||
      typeof methodDefn.$originSeq !== 'undefined'
    ) {
      if (this.#hasNext(methodDefn)) {
        serve = function () {
          // preserve next in signature for connect
          _this.#runWithInjection(arguments, mesh, methodDefn);
        };
      } else {
        serve = function () {
          _this.#runWithInjection(arguments, mesh, methodDefn);
        };
      }
    } else {
      serve = methodDefn.bind(this.#module.instance);
    }

    connect.use(meshRoutePath, serve);
    connect.use(componentRoutePath, serve);

    this.#log.trace(`attached web route for component ${this.name}: ${meshRoutePath}`);

    // tag for detatch() to be able to remove middleware when removing component
    serve.__tag = this.name;

    if (!mesh.config.web) return;
    if (!mesh.config.web.routes) return;

    // attach this as root middleware if configured
    Object.keys(mesh.config.web.routes).forEach(function (mountRoute) {
      var mountPoint = mesh.config.web.routes[mountRoute];
      if (componentRef !== mountPoint) return;
      connect.use(mountRoute, function (req, res, next) {
        req.rootWebRoute = mountRoute;
        req.componentWebRoute = mountPoint;
        serve(req, res, next);
      });
    });
  }

  #raiseOnEmitError(e) {
    this.emitEvent('on-emit-error', e);
  }

  #raiseOnEmitOK(response) {
    this.emitEvent('on-emit-ok', response);
  }

  #raiseOnPublishError(e) {
    this.emitEvent('on-publish-error', e);
  }

  #raiseOnPublishOK(response) {
    this.emitEvent('on-publish-ok', response);
  }

  #reply(callbackAddress, callbackPeer, response, options, mesh) {
    let client = mesh.data;
    if (callbackPeer) {
      // for cluster the set is performed back at the originating peer
      try {
        client = mesh.happn.server.services.orchestrator.peers[callbackPeer].client;
      } catch (e) {
        // no peer at callback (race conditions on servers stopping and starting) dead end...
        this.#log.warn(`Failure on callback, missing peer: ${callbackPeer}`, e);
        return;
      }
    }
    client.publish(callbackAddress, response, options, (e) => {
      if (e) {
        var logMessage = 'Failure to set callback data on address ' + callbackAddress;
        if (e.message && e.message === 'client is disconnected')
          return this.#log.warn(logMessage + ':client is disconnected');
        this.#log.error(logMessage, e);
      }
    });
  }

  detatch(mesh, callback) {
    this.#log.trace('detatch() removing component from mesh');
    const connect = mesh.happn.server.connect;
    // Remove this component's middleware from the connect stack.
    var toRemove = connect.stack

      .map((mware, i) => {
        if (mware.handle.__tag !== this.name) return -1;
        return i;
      })

      .filter((i) => {
        return i >= 0;
      })

      // splice starting from the back end so that array size change does not offset

      .reverse();

    toRemove.forEach((i) => {
      this.#log.trace('removing mware at %s', connect.stack[i].route);
      connect.stack.splice(i, 1);
    });
    const subscribeMask = this.#getSubscribeMask();
    // Remove this component's request listener from the happn
    this.#log.trace('removing request listener %s', subscribeMask);

    mesh.data.offPath(subscribeMask, (e) => {
      if (e) {
        this.#log.warn(
          `half detatched, failed to remove request listener: ${subscribeMask}, error: ${e.message}`
        );
      }
      callback(e);
    });
  }

  // terminal: inline help $happn.README
  README() {
    /*
     </br>
     ## This is the Component Instance
     It is available in the terminal at **$happn**. From modules, it is optionally
     injected (by argument name) into functions as **$happn**.
     It has access to the **Exchange**, **Event** and **Data** APIs as well as some
     built in utilities and informations.
     ### Examples
     __node> $happn.name
     'terminal'
     __node> $happn.constructor.name
     'ComponentInstance'
     __node> $happn.log.warn('blah blah')
     **[ WARN]** - 13398ms home (terminal) blah blah
     __node> $happn.info
     __node> $happn.config
     __node> $happn.data.README
     __node> $happn.event.README
     __node> $happn.exchange.README
     __node> $happn._mesh.*  // only with 'mesh'||'root' accessLevel
     __node> $happn._root.*  // only with 'root' accessLevel
     */
  }
};
