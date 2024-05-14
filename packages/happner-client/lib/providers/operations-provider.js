(function (isBrowser) {
  var semver;
  var RequestBuilder;

  if (isBrowser) {
    // eslint-disable-next-line no-undef
    Happner.OperationsProvider = OperationsProvider;
    // eslint-disable-next-line no-undef
    semver = Happner.semver;
    // eslint-disable-next-line no-undef
    RequestBuilder = Happner.RequestBuilder;
  } else {
    module.exports = OperationsProvider;
    semver = require('happner-semver');
    RequestBuilder = require('../builders/request-builder');
  }

  function OperationsProvider(happnerClient, connection, implementors) {
    Object.defineProperty(this, 'happnerClient', { value: happnerClient });
    this.connection = connection;
    this.implementors = implementors;
    this.responsePathsSubscribed = {};
    this.lastSeq = 0;
    this.awaitingResponses = {};
    this.requestBuilder = new RequestBuilder();
    this.start();
  }

  OperationsProvider.prototype.stop = function () {
    clearInterval(this.pruneResponseSubscriptionsInterval);
  };

  OperationsProvider.prototype.start = function () {
    this.pruneResponseSubscriptionsInterval = setInterval(
      this.pruneResponseSubscriptions.bind(this),
      60e3
    );
  };

  OperationsProvider.prototype.connected = function (callback) {
    if (!this.connection.connected) {
      callback(new Error('Not connected'));
      return false;
    }
    return true;
  };

  OperationsProvider.prototype.subscribe = function (
    component,
    version,
    key,
    handler,
    callback,
    options
  ) {
    var _this = this;

    if (!options) options = {};

    if (!this.connected(callback)) return;

    var filterByVersion = function (data, meta) {
      if (meta.componentVersion) {
        // inserted by happner $happn.emit()
        if (!semver.coercedSatisfies(meta.componentVersion, version)) return;
      }

      handler(data, meta);
    };

    _this.implementors
      .getDescriptions()
      .then(function () {
        var path = '/_events/' + _this.implementors.domain + '/' + component + '/' + key;
        var subscribeOptions = {
          event_type: 'set',
          meta: {
            componentVersion: version,
          },
        };
        return _this.connection.client.on(
          path,
          { ...options, ...subscribeOptions },
          filterByVersion,
          callback
        );
      })
      .catch(callback);
  };

  OperationsProvider.prototype.unsubscribe = function (id, callback) {
    if (!this.connected(callback)) return;

    this.connection.client.off(id, callback);
  };

  OperationsProvider.prototype.unsubscribePath = function (component, key, callback) {
    var _this = this;

    if (!this.connected(callback)) return;

    Promise.resolve()

      .then(function () {
        // get description for domain name
        return _this.implementors.getDescriptions();
      })

      .then(function () {
        var path = '/_events/' + _this.implementors.domain + '/' + component + '/' + key;
        _this.connection.client.offPath(path, callback);
      })

      .catch(callback);
  };

  OperationsProvider.prototype.request = function (
    component,
    version,
    method,
    args,
    callback,
    origin
  ) {
    var _this = this,
      implementation;

    if (!this.connected(callback)) return;

    Promise.resolve()

      .then(function () {
        return _this.implementors.getDescriptions();
      })

      .then(function () {
        return _this.implementors.getNextImplementation(component, version, method);
      })

      .then(function (_implementation) {
        implementation = _implementation;
        return _this.subscribeToResponsePaths(component, method);
      })

      .then(function () {
        return _this.executeRequest(
          implementation,
          component,
          version,
          method,
          args,
          callback,
          origin
        );
      })

      .catch(callback);
  };

  OperationsProvider.prototype.nextSeq = function () {
    this.lastSeq++;
    if (this.lastSeq >= Number.MAX_SAFE_INTEGER) {
      this.lastSeq = 1;
    }
    return this.lastSeq;
  };

  OperationsProvider.prototype.executeRequest = function (
    implementation,
    component,
    version,
    method,
    args,
    callback,
    origin
  ) {
    var _this = this;
    return new Promise(function (resolve, reject) {
      if (!_this.connected(reject)) return;

      const requestSequence = _this.nextSeq();

      let requestArgs = _this.requestBuilder
        .withComponent(component)
        .withDomain(_this.implementors.domain)
        .withVersion(version)
        .withMethod(method)
        .withSequence(requestSequence)
        .withArgs(args)
        .withSessionId(_this.connection.client.session.id)
        .withUsername(
          _this.connection.client.session.user
            ? _this.connection.client.session.user.username
            : null
        )
        .withIsSecure(_this.connection.client.session.happn.secure);

      if (!implementation.local) {
        requestArgs = requestArgs.withCallbackPeer(_this.implementors.name);
      }

      requestArgs = requestArgs.build();

      const requestOptions = {
        timeout: _this.happnerClient.__requestTimeout,
        noStore: true,
        noCluster: true,
      };

      if (origin) requestOptions.onBehalfOf = origin.username;

      let client;

      if (implementation.local) {
        client = _this.connection.client;
      } else {
        const peer = _this.connection.clusterInstance.peers.find(
          (peer) => peer.peerInfo.memberName === implementation.name
        );
        client = peer.client;
      }

      // need to create the response handler before calling set() because
      // if it is only created in set()'s callback there is a race condition
      // where sometimes the response arrives before the set()'s callback

      _this.awaitingResponses[requestSequence] = {
        callback: callback,
        timeout: setTimeout(function () {
          delete _this.awaitingResponses[requestSequence];
          callback(
            new Error(`Timeout awaiting response on ${component}.${method} version: ${version}`)
          );
        }, _this.happnerClient.__responseTimeout),
      };

      client.set(
        `/_exchange/requests/${_this.implementors.domain}/${component}/${method}`,
        requestArgs,
        requestOptions,
        function (e) {
          var handler = _this.awaitingResponses[requestSequence];
          if (e) {
            if (handler) {
              clearTimeout(handler.timeout);
              delete _this.awaitingResponses[requestSequence];
            }
            return reject(e);
          }
          resolve();
        }
      );
    });
  };

  OperationsProvider.prototype.response = function (data, meta) {
    var sequence = meta.path.substr(meta.path.lastIndexOf('/') + 1);
    var handler = this.awaitingResponses[sequence];

    if (!handler) return;

    clearTimeout(handler.timeout);
    delete this.awaitingResponses[sequence];

    if (data.status === 'ok') return handler.callback.apply(this, data.args);

    var error = new Error(data.args[0].message);
    error.name = data.args[0].name;

    handler.callback(error);
  };

  OperationsProvider.prototype.subscribeToResponsePaths = function (component, method) {
    var _this = this;
    return new Promise(function (resolve, reject) {
      // subscribe to response paths
      // insecure: /_exchange/responses/bd826ed2-d9d6-4ca0-9b74-9cb0484432e2/*
      // secure: /_exchange/responses/SERVER_NAME/example/method/f16de5bb-bb62-48f9-b34a-9262b5f5d12b/*

      var path = '/_exchange/responses/';

      if (!_this.connected(reject)) return;

      path += _this.implementors.secure
        ? _this.implementors.domain +
          '/' +
          component +
          '/' +
          method +
          '/' +
          _this.implementors.sessionId +
          '/*'
        : _this.implementors.sessionId + '/*';

      if (_this.responsePathsSubscribed[path] === true) return resolve();

      _this.responsePathsSubscribed[path] = _this.responsePathsSubscribed[path] || [];

      _this.responsePathsSubscribed[path].push({
        resolve: resolve,
        reject: reject,
      });

      if (_this.responsePathsSubscribed[path].length > 1) return;

      _this.connection.client.on(
        path,
        { event_type: 'set' },
        _this.response.bind(_this),
        function (e) {
          var reply;
          if (e) {
            while ((reply = _this.responsePathsSubscribed[path].shift())) {
              reply.reject(e);
            }
            return;
          }

          while ((reply = _this.responsePathsSubscribed[path].shift())) {
            reply.resolve();
          }

          _this.responsePathsSubscribed[path] = true;
        }
      );
    });
  };

  OperationsProvider.prototype.pruneResponseSubscriptions = function () {
    var _this = this;
    if (!this.implementors.sessionId || this.implementors.sessionId.length < 1) return;
    if (!this.connection.connected) return;

    Object.keys(this.responsePathsSubscribed).forEach(function (path) {
      if (path.indexOf(_this.implementors.sessionId) > 0) return;
      if (!_this.connection.client) return;

      delete _this.responsePathsSubscribed[path];

      _this.connection.client.offPath(path, function (e) {
        if (e) _this.responsePathsSubscribed[path] = true;
      });
    });
  };
})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
