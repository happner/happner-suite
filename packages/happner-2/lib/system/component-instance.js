const commons = require('happn-commons');
const utilities = require('./utilities');
module.exports = class ComponentInstance {
  #authorizer;
  #log;
  #name;
  #config;
  #info;
  #mesh;
  #module;
  #callbackIndexes;
  constructor() {
    this.#callbackIndexes = {};
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

  async #isAuthorized(username, permissions) {
    return await this.#authorizer.checkAuthorizations(username, permissions);
  }

  #defaults(config) {
    let clonedConfig = commons.fastClone(config);
    let defaults = module.instance.$happner;
    if (typeof defaults === 'object') {
      Object.keys((defaults = defaults.config.component)).forEach((key) => {
        // - Defaulting applies only to the 'root' keys nested immediately
        //   under the 'component' config
        // - Does not merge.
        // - Each key in the default is only used if the corresponding key is
        //   not present in the inbound config.
        if (typeof clonedConfig[key] === 'undefined') {
          clonedConfig[key] = commons.fastClone(defaults[key]);
        }
      });
    }
    return clonedConfig;
  }

  initialize(name, root, mesh, module, config, callback) {
    this.#mesh = mesh;
    this.#name = name;
    this.#config = this.#defaults(config);

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
    this.#log.$$TRACE('create instance');

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
    this.#module = module;
    this.exchange = {};
    this.event = {};
    this.localEvent = {};
    this.asAdmin = this; //in case we use $happn.asAdmin but have not bound to origin
    this.data = require('./secure-mesh-data').create(mesh._mesh.data, this.name);
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
    const _this = this;
    let callbackCalled = false;
    return function () {
      if (callbackCalled)
        return _this.log.error(
          'Callback invoked more than once for method %s',
          methodName,
          callback.toString()
        );

      callbackCalled = true;
      callback(null, Array.prototype.slice.apply(arguments));
    }.bind({ $origin: origin });
  }

  operate(methodName, parameters, callback, origin, version, originBindingOverride) {
    this.#authorizeOriginMethod(
      methodName,
      origin,
      (e) => {
        if (e) {
          return callback(e);
        }
        let callbackIndex = this.#getCallbackIndex(methodSchema);
        const methodSchema = this.description.methods[methodName];
        const methodDefn = this.module.instance[methodName];

        if (!methodSchema || typeof methodDefn !== 'function') {
          return this.__callBackWithWarningAndError(
            'Missing method',
            `Call to unconfigured method [${this.name}.${methodName}()]`,
            callback
          );
        }

        if (version != null && !this.satisfies(this.#module.version, version)) {
          return this.__callBackWithWarningAndError(
            'Component version mismatch',
            `Call to unconfigured method [${
              this.name
            }.${methodName}]: request version [${version}] does not match component version [${
              this.#module.version
            }]`,
            callback
          );
        }

        this.log.$$TRACE('operate( %s', methodName);
        this.log.$$TRACE('parameters ', parameters);
        this.log.$$TRACE('methodSchema ', methodSchema);

        if (methodSchema.type === 'sync-promise') {
          let result;
          try {
            result = methodDefn.apply(
              this.#module.instance,
              this._inject(methodDefn, parameters, origin)
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

        let returnObject = methodDefn.apply(
          this.#module.instance,
          this._inject(methodDefn, parameters, origin)
        );

        if (utilities.isPromise(returnObject)) {
          if (callbackIndex > -1 && utilities.isPromise(returnObject))
            this.log.warn('method has been configured as a promise with a callback...');
          else {
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

  #attach(config, mesh, callback) {
    //attach module to the transport layer
    this.log.$$TRACE('_attach()');
    this.emit = function (key, data, options, callback) {
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
          if (e) return this.__raiseOnPublishError(e);
          this.__raiseOnPublishOK(results);
        };
      }
      mesh.data.set(eventKey + key, data, options, (e, response) => {
        if (e) return this.__raiseOnEmitError(e);
        this.__raiseOnEmitOK(response);
        if (callback) callback(e, response);
      });
    }.bind(this);

    this.emitLocal = function (key, data, callback) {
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
    }.bind(this);

    if (config.web && config.web.routes) {
      try {
        Object.keys(config.web.routes).forEach((route) => {
          var routeTarget = config.web.routes[route];
          var meshRoutePath = '/' + this.info.mesh.name + '/' + this.name + '/' + route;
          var componentRoutePath = '/' + this.name + '/' + route;

          if (Array.isArray(routeTarget)) {
            routeTarget.map(function (targetMethod) {
              this._attachRouteTarget(mesh, meshRoutePath, componentRoutePath, targetMethod, route);
            });
          } else {
            this._attachRouteTarget(mesh, meshRoutePath, componentRoutePath, routeTarget, route);
          }
        });
      } catch (e) {
        this.log.error('Failure to attach web methods', e);
        return callback(e);
      }
    }
    const subscribeMask = this.#getSubscribeMask();
    this.log.$$TRACE('data.on( ' + subscribeMask);
    mesh.data.on(
      subscribeMask,
      {
        event_type: 'set',
      },
      (publication, meta) => {
        this.log.$$TRACE('received request at %s', subscribeMask);
        var message = publication;
        var method = meta.path.split('/').pop();

        if (this.serializer && typeof this.serializer.__decode === 'function') {
          message.args = this.serializer.__decode(message.args, {
            req: true,
            res: false,
            at: {
              mesh: this.info.mesh.name,
              component: this.name,
            },
            meta: meta,
          });
        }
        const args = Array.isArray(message.args) ? message.args.slice(0, message.args.length) : [];
        if (!message.callbackAddress) return this._discardMessage('No callback address', message);
        this.operate(
          method,
          args,
          function (e, responseArguments) {
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

              this.log.$$TRACE('operate( reply( ERROR %s', message.callbackAddress);

              return this.__reply(
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

            if (this.serializer && typeof this.serializer.__encode === 'function') {
              response.args = this.serializer.__encode(response.args, {
                req: false,
                res: true,
                src: {
                  mesh: this.info.mesh.name,
                  component: this.name,
                },
                meta: meta,
                opts: this.__createSetOptions(publication.origin.id, this.info.happn.options),
              });
            }

            // Populate response to the callback address
            this.log.$$TRACE('operate( reply( RESULT %s', message.callbackAddress);

            var options = this.__createSetOptions(publication.origin.id, this.info.happn.options);
            this.__reply(message.callbackAddress, message.callbackPeer, response, options, mesh);
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

  #getSubscribeMask() {
    return `/_exchange/requests/${this.info.mesh.domain}/${this.info.name}/*`;
  }

  #authorizeOriginMethod() {
    return (methodName, origin, callback, originBindingOverride) => {
      if (!this.originBindingNecessary(this.#mesh._mesh, origin, originBindingOverride)) {
        return callback(null, true);
      }
      const subscribeMask = this.#getSubscribeMask();
      const permissionPath = subscribeMask.substring(0, subscribeMask.length - 1) + methodName;
      this.#mesh.mesh._mesh.happn.server.services.security.__getOnBehalfOfSession(
        {
          user: {
            username: '_ADMIN',
          },
        },
        origin.username,
        function (e, originSession) {
          if (e) return callback(e);
          this.#mesh.mesh._mesh.happn.server.services.security.authorize(
            originSession,
            permissionPath,
            'set',
            function (e, authorized) {
              if (e) return callback(e);
              if (!authorized)
                return callback(
                  this.#mesh.mesh._mesh.happn.server.services.error.AccessDeniedError(
                    'unauthorized',
                    'request on behalf of: ' + origin.username
                  )
                );
              callback();
            }
          );
        }
      );
    };
  }
};
