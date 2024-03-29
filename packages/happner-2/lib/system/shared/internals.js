(function (isBrowser) {
  var Promisify, Messenger, MeshError;
  var Internals = {};

  if (isBrowser) {
    window.Happner = window.Happner || {};
    window.Happner.Internals = Internals;
    // eslint-disable-next-line no-undef
    Promisify = Happner.Promisify;
    // eslint-disable-next-line no-undef
    Messenger = Happner.Messenger;
    // eslint-disable-next-line no-undef
    MeshError = Happner.MeshError;
  } else {
    module.exports = Internals;
    Promisify = require('./promisify');
    Messenger = require('./messenger');
    MeshError = require('./mesh-error');
  }

  Internals._initializeLocal = function (_this, description, config, isServer, callback) {
    _this.log.$$TRACE('_initializeLocal()');

    if (!_this.post)
      Object.defineProperty(_this, 'post', {
        value: function (address) {
          _this.log.$$TRACE('post( %s', address);
          if (address.substring(0, 1) !== '/') address = '/' + address;

          if (address.split('/').length === 3) address = '/' + _this._mesh.config.name + address;

          if (!_this._mesh.exchange[address]) throw new MeshError('missing address ' + address);

          var messenger = _this._mesh.exchange[address];
          messenger.deliver.apply({ $self: messenger, $origin: this.$origin }, arguments);
        },
      });

    _this._mesh = _this._mesh || {};
    _this._mesh.endpoints = _this._mesh.endpoints || {};

    if (config.name) {
      _this._mesh.endpoints[config.name] = {
        description: description,
        local: isServer,
        name: config.name,
        data: isBrowser ? _this.data : _this.data || _this._mesh.data,
      };
    }

    // Externals
    var exchangeAPI = (_this.exchange = _this.exchange || {});
    var eventAPI = (_this.event = _this.event || {});

    // Internals
    _this._mesh = _this._mesh || {};
    _this._mesh.exchange = _this._mesh.exchange || {};

    Internals.instance = _this;
    Internals._updateEndpoint(_this, config.name, exchangeAPI, eventAPI, callback);
  };

  Internals._updateEndpoint = function (_this, endpointName, exchangeAPI, eventAPI, callback) {
    _this.log.$$TRACE('_updateEndpoint( %s', endpointName);
    Internals._updateExchangeAPILayer(_this, endpointName, exchangeAPI, function (e) {
      if (e) return callback(e);
      Internals._updateEventAPILayer(_this, endpointName, eventAPI, callback);
    });
  };

  Internals._disconnectEndpoint = function (_this, endpointName, exchangeAPI, eventAPI, callback) {
    _this.log.$$TRACE('_disconnectEndpoint( %s', endpointName);

    Internals._disconnectExchangeAPILayer(_this, endpointName, exchangeAPI)

      .then(function () {
        return Internals._disconnectEventAPILayer(_this, endpointName, eventAPI);
      })

      .then(function (result) {
        callback(null, result);
      })

      .catch(function (error) {
        callback(error);
      });
  };

  Internals._updateExchangeAPILayer = Promisify(function (
    _this,
    endpointName,
    exchangeAPI,
    callback
  ) {
    _this.log.$$TRACE('_updateExchangeAPILayer( %s', endpointName);

    exchangeAPI[endpointName] = exchangeAPI[endpointName] || {};

    var endpoint = _this._mesh.endpoints[endpointName];
    var components = endpoint.description.components;
    var messenger = endpoint.messenger;

    if (endpoint.local && !components) {
      // - InitializeLocal on server occurs before components are created.
      //
      // - So on the first call this endpoint's component descriptions are empty.
      //
      // - Subsequent calls are made here with each component creation
      //   assembling it's APIs component by component (to allow runtime
      //   insertion of new components to initialize along the same code path)
      //
      // - The loop uses the messenger.initialized list to determine which
      //   are new components to configure into the messenger.
      return callback();
    }

    if (!messenger) {
      messenger = endpoint.messenger = new Messenger(endpoint, _this._mesh);
    }

    var runningComponents = Object.keys(messenger.initialized);
    var intendedComponents = Object.keys(components);
    var createComponents;
    var destroyComponents;

    // Initialize components into this endpoint's messenger

    createComponents = intendedComponents

      // Filter out components that are already initialized in the messenger.

      .filter(function (componentName) {
        return typeof messenger.initialized[componentName] === 'undefined';
      })

      .map(function (componentName) {
        // New Component
        var componentExchange = (exchangeAPI[endpointName][componentName] = {});
        var componentDescription = components[componentName];

        if (endpointName === _this._mesh.config.name) {
          exchangeAPI[componentName] = exchangeAPI[componentName] || {};
          exchangeAPI[componentName].__version = componentDescription.version;
        }

        // Create exchangeAPI 'Requestors' for each method

        Object.keys(componentDescription.methods).forEach(function (methodName) {
          var remoteRequestor, localRequestor;
          var requestPath = '/' + endpointName + '/' + componentName + '/' + methodName;

          var description = componentDescription.methods[methodName];
          var alias = description.alias;

          remoteRequestor = Promisify(
            function () {
              _this.post.apply(this, arguments);
            },
            {
              unshift: requestPath,
            }
          );

          if (endpoint.local) {
            localRequestor = Promisify(function () {
              var args = Array.prototype.slice.call(arguments);
              var callback = args.pop();
              if (!_this._mesh.exchange[requestPath])
                return callback(new Error(`invalid request path: ${requestPath}`));
              var origin = this.$origin || _this._mesh.exchange[requestPath].session;
              // Maintain similarity with message passing approach by using setImmediate on call and callback
              setImmediate(function () {
                _this._mesh.elements[componentName].component.instance.operate(
                  methodName,
                  args,
                  function (meshError, results) {
                    if (meshError) return callback(meshError); // unlikely since bypassing most of exchange
                    callback.apply(this, results); // results = [error, results...]
                  },
                  origin
                );
              });
            });
          }

          componentExchange[methodName] = remoteRequestor;
          if (alias) componentExchange[alias] = remoteRequestor;

          if (endpointName === _this._mesh.config.name) {
            exchangeAPI[componentName] = exchangeAPI[componentName] || {};
            exchangeAPI[componentName][methodName] = localRequestor || remoteRequestor;
            if (alias) {
              exchangeAPI[componentName][alias] = localRequestor || remoteRequestor;
            }
          }
        });

        // Return componentName for the .map to create the
        // array of newComponents.
        return componentName;
      });

    destroyComponents = runningComponents

      // Filter for components no longer inteded

      .filter(function (componentName) {
        return intendedComponents.indexOf(componentName) === -1;
      })

      .map(function (componentName) {
        // TODO: consider leaving a stub that callsback with a ComponentDeletedError
        // var componentDescription = endpoint.previousDescription;

        delete exchangeAPI[endpointName][componentName];
        delete _this.event[endpointName][componentName];

        if (endpointName === _this._mesh.config.name) {
          delete exchangeAPI[componentName];
          delete _this.event[componentName];
        }

        return componentName;
      });
    Internals.__decoupleExchangeAPILayer(exchangeAPI);
    messenger.updateRequestors(createComponents, destroyComponents, callback);
  });

  Internals._getSubscriber = function (endpoint, domain, componentName, origin) {
    var eventKey = '/_events/' + domain + '/' + componentName + '/';

    return {
      //for bindToOrigin in component instance
      __endpoint: endpoint,
      __domain: domain,
      __componentName: componentName,

      once: function (key, handler, callback) {
        return this.on(key, { event_type: 'set', count: 1 }, handler, callback);
      },

      on: function (key, parameters, handler, callback) {
        if (typeof parameters === 'function') {
          callback = handler;
          handler = parameters;
          parameters = null;
        }

        if (!parameters) parameters = {};
        parameters.event_type = 'set';
        if (key === '*') key = '**';
        if (origin) parameters.onBehalfOf = origin;

        if (!callback)
          return new Promise(function (resolve, reject) {
            endpoint.data.on(eventKey + key, parameters, handler, function (e, handle) {
              if (e) return reject(e);
              resolve(handle);
            });
          });
        return endpoint.data.on(eventKey + key, parameters, handler, callback);
      },

      off: function (key, callback) {
        if (typeof key !== 'number') {
          const message = 'off using a path or string is not possible, use offPath, path:' + key;
          Internals.instance.log.warn(message);
          if (callback) return callback(new Error(message));
        }
        if (typeof callback === 'function') return endpoint.data.off(key, callback);
        return new Promise((resolve, reject) => {
          endpoint.data.off(key, (e) => {
            if (e) {
              Internals.instance.log.warn("unsubscribe from '%s' failed", key, e);
              return reject(e);
            }
            resolve();
          });
        });
      },

      offPath: function (path, callback) {
        if (typeof callback === 'function') return endpoint.data.offPath(eventKey + path, callback);
        return new Promise((resolve, reject) => {
          endpoint.data.offPath(eventKey + path, (e) => {
            if (e) {
              Internals.instance.log.warn("unsubscribe from '%s' failed", path, e);
              return reject(e);
            }
            resolve();
          });
        });
      },
    };
  };

  Internals.getEndpoint = function (parameters, api, callback) {
    try {
      if (parameters.mesh) {
        if (typeof api[parameters.mesh] !== 'object')
          throw new Error(
            `invalid endpoint options: [${parameters.mesh}] mesh does not exist on the api`
          );
        if (typeof api[parameters.mesh][parameters.component] !== 'object')
          throw new Error(
            `invalid endpoint options: [${parameters.mesh}.${parameters.component}] component does not exist on the api`
          );
      } else {
        if (typeof api[parameters.component] !== 'object')
          throw new Error(
            `invalid endpoint options: [${parameters.component}] component does not exist on the api`
          );
      }
    } catch (e) {
      if (callback) {
        callback(e);
        return false;
      }
      throw e;
    }
    return parameters.mesh ? api[parameters.mesh][parameters.component] : api[parameters.component];
  };

  Internals._decoupleEventAPILayer = function (eventAPI) {
    eventAPI.$on = (parameters, handler, callback) => {
      let endpoint = Internals.getEndpoint(parameters, eventAPI, callback);
      if (endpoint === false) return;
      return endpoint.on(parameters.path, parameters.options, handler, callback);
    };
    eventAPI.$once = (parameters, handler, callback) => {
      let endpoint = Internals.getEndpoint(parameters, eventAPI, callback);
      if (endpoint === false) return;
      return Internals.getEndpoint(parameters, eventAPI).once(parameters.path, handler, callback);
    };
    eventAPI.$off = (parameters, callback) => {
      let endpoint = Internals.getEndpoint(parameters, eventAPI, callback);
      if (endpoint === false) return;
      return Internals.getEndpoint(parameters, eventAPI).off(parameters.id, callback);
    };
    eventAPI.$offPath = (parameters, callback) => {
      let endpoint = Internals.getEndpoint(parameters, eventAPI, callback);
      if (endpoint === false) return;
      return Internals.getEndpoint(parameters, eventAPI).offPath(parameters.path, callback);
    };
    return eventAPI;
  };

  Internals._createDecoupledCall = function (exchangeAPI) {
    return function (parameters, callback) {
      const endpoint = Internals.getEndpoint(parameters, exchangeAPI, callback);
      if (endpoint === false) return;
      if (typeof endpoint[parameters.method] !== 'function') {
        const methodNotExistError = new Error(
          `invalid endpoint options: [${parameters.component}.${parameters.method}] method does not exist on the api`
        );
        if (typeof callback !== 'function') throw methodNotExistError;
        return callback(new Error(methodNotExistError));
      }
      const args = Array.isArray(parameters.arguments) ? parameters.arguments : [];
      if (typeof callback === 'function') args.push(callback);
      let boundEndpoint = endpoint;
      if (parameters.as) {
        boundEndpoint = Object.assign(
          {},
          { $origin: { username: parameters.as, override: true } },
          endpoint
        );
      }
      return endpoint[parameters.method].apply(boundEndpoint, args);
    };
  };

  Internals.__decoupleExchangeAPILayer = function (exchangeAPI) {
    exchangeAPI.$call = Internals._createDecoupledCall(exchangeAPI);
  };

  Internals._updateEventAPILayer = Promisify(function (_this, endpointName, eventAPI, callback) {
    _this.log.$$TRACE('_updateEventAPILayer( %s', endpointName);

    eventAPI[endpointName] = eventAPI[endpointName] || {};

    var endpoint = _this._mesh.endpoints[endpointName];
    var components = endpoint.description.components;

    if (endpoint.local && !components) {
      Internals._decoupleEventAPILayer(eventAPI);
      return callback();
    }

    Object.keys(components)

      .filter(function (componentName) {
        return typeof eventAPI[endpointName][componentName] === 'undefined';
      })

      .forEach(function (componentName) {
        var domain = endpointName;
        var componentDescription = components[componentName];
        try {
          if (endpoint.local) {
            // Events now use the domain name in their path.
            //
            // But only if local, because remote nodes are "fooled" into using the domain name by putting it
            // into the description.name in order to still support legacy happner-1 attaching endpoints/clients
            domain = _this._mesh.config.domain;
          }
        } catch (e) {
          // do nothing
        }

        var subscriber = Internals._getSubscriber(endpoint, domain, componentName);
        subscriber.__version = componentDescription.__version;

        eventAPI[endpointName][componentName] = subscriber;
        if (endpointName === _this._mesh.config.name)
          //is local, so create shortened route
          eventAPI[componentName] = subscriber;
      });
    Internals._decoupleEventAPILayer(eventAPI);
    callback();
  });
})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
