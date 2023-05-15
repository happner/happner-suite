(function (isBrowser) {
  var semver;

  if (isBrowser) {
    // eslint-disable-next-line no-undef
    Happner.ImplementorsProvider = ImplementorsProvider;
    // eslint-disable-next-line no-undef
    semver = Happner.semver;
  } else {
    module.exports = ImplementorsProvider;
    semver = require('happner-semver');
  }

  function ImplementorsProvider(happnerClient, connection) {
    Object.defineProperty(this, 'happnerClient', {
      value: happnerClient,
    });
    this.log = happnerClient.log;
    this.connection = connection;
    this.dependencies = {};
    this.localDescriptions = [];
    this.descriptions = [];
    this.maps = {};

    this.name = undefined;
    this.domain = undefined;
    this.sessionId = undefined;
    this.secure = undefined;

    this.reconnectedHandler = undefined;
    this.addPeerHandler = undefined;
    this.removePeerHandler = undefined;

    // queued promise callbacks for callers to getDescriptions()
    // fist caller performs the fetching, subsequent callers wait
    // for first caller to complete then all resolve.
    this.callersAwaitingDescriptions = [];

    // got all "starting" descriptions from peers already present at join time
    this.gotDescriptions = false;

    // pending list of descriptions we're waiting for
    this.awaitingDescriptions = {};

    this.events = {
      once: {},
    };

    happnerClient.on('reconnected', (this.reconnectedHandler = this.clear.bind(this)));
  }

  ImplementorsProvider.prototype.clear = function () {
    this.localDescriptions = [];
    this.maps = {};
    this.descriptions = [];
    this.callersAwaitingDescriptions = [];
  };

  ImplementorsProvider.prototype.getSingleDescription = function (
    client,
    self,
    cluster,
    onSuccess,
    onFailure,
    onIgnore
  ) {
    client.get('/mesh/schema/description', (e, description) => {
      if (e) return onFailure(e);

      if (!description || description.initializing) {
        setTimeout(() => {
          this.getSingleDescription(client, self, cluster, onSuccess, onFailure, onIgnore);
        }, 1000);
        return;
      }

      if (!client.session) return onFailure(new Error('client session not set, no longer active'));

      description.meshName = client.session.happn.name;
      description.self = self === true;
      description.url = client.options && client.options.url ? client.options.url : null;

      if (self) {
        // future: clusters with multiple domains do magic here somehow...
        this.domain = description.name;
        this.sessionId = client.session.id;
        this.secure = client.session.happn.secure;

        if (cluster) {
          this.name = client.session.happn.name;
          this.addLocalDescription(description);
        } else {
          this.addDescription(description);
        }
      } else {
        if (cluster && description.brokered) {
          if (!client.session.info) client.session.info = {};
          client.session.info.clusterName = description.meshName;
          return onIgnore(`ignoring brokered description for peer: ${client.session.happn.name}`);
        }
        this.addDescription(description);
      }
      onSuccess(description);
    });
  };

  ImplementorsProvider.prototype.subscribeToPeerEvents = function () {
    this.connection.clusterInstance.on('PEER_CONNECTED', (this.addPeerHandler = this.addPeer.bind(this)));
    this.connection.clusterInstance.on(
      'PEER_DISCONNECTED',
      (this.removePeerHandler = this.removePeer.bind(this))
    );
  };

  ImplementorsProvider.prototype.unsubscribeFromPeerEvents = function () {
    this.connection.clusterInstance.removeListener('PEER_CONNECTED', this.addPeerHandler);
    this.connection.clusterInstance.removeListener('PEER_DISCONNECTED', this.removePeerHandler);
  };

  ImplementorsProvider.prototype.stop = function () {
    this.happnerClient.removeListener('reconnected', this.reconnectedHandler);
    this.clear();
  };

  ImplementorsProvider.prototype.addPeer = function (name) {
    const peer = this.connection.clusterInstance.peers.find(
      (peerConnector) => peerConnector.peerInfo.memberName === name
    );
    if (!peer) {
      this.log.error(`failed to find peer: ${name}`);
      return;
    }
    const onSuccess = (description) => {
      const clonedDescription = Object.assign({}, description);
      this.log.debug('logging dependencies met on addPeer');
      this.logDependenciesMet(clonedDescription);
    };
    const onFailure = (e) => {
      this.log.error('failed to get description for %s', name, e);
    };
    const onIgnore = (reason) => {
      this.log.debug(reason);
    };
    this.getSingleDescription(peer.client, false, true, onSuccess, onFailure, onIgnore);
  };

  ImplementorsProvider.prototype.removePeer = function (name) {
    var removedPeerDescription = this.removeDescription(name);
    if (removedPeerDescription)
      this.happnerClient.emit('peer/departed/description', removedPeerDescription);
  };

  ImplementorsProvider.prototype.getDescriptions = function () {
    var _this = this;
    return new Promise(function (resolve, reject) {
      if (!_this.connection.connected) {
        return reject(new Error('Not connected'));
      }

      if (_this.callersAwaitingDescriptions === false) return resolve();

      _this.callersAwaitingDescriptions = _this.callersAwaitingDescriptions || [];

      _this.callersAwaitingDescriptions.push({
        resolve: resolve,
        reject: reject,
      });

      if (_this.callersAwaitingDescriptions.length > 1) return;

      var success = function (description) {
        var reply;
        while ((reply = _this.callersAwaitingDescriptions.shift())) {
          reply.resolve();
        }
        _this.gotDescriptions = true;
        _this.callersAwaitingDescriptions = false;
        _this.log.debug('logging dependencies met on fetched descriptions');
        _this.logDependenciesMet(description);
      };

      var failure = function (e) {
        var reply;
        while ((reply = _this.callersAwaitingDescriptions.shift())) {
          reply.reject(e);
        }
      };

      var ignore = function (reason) {
        _this.log.debug(reason);
        var reply;
        while ((reply = _this.callersAwaitingDescriptions.shift())) {
          reply.resolve();
        }
        _this.gotDescriptions = true;
        _this.callersAwaitingDescriptions = false;
      };

      var fetchMultiple = function (clients) {
        return Promise.all(
          clients.map(function (client) {
            return new Promise(function (resolve) {
              _this.getSingleDescription(client, client.self, true, resolve, resolve, (reason) => {
                _this.log.debug(reason);
                resolve();
              });
            });
          })
        );
      };

      if (_this.connection.clusterInstance) {
        const clients = _this.connection.clusterInstance.peers.map(
          (clusterPeerConnector) => clusterPeerConnector.client
        );
        clients.unshift(_this.connection.client);
        return fetchMultiple(clients).then(success);
      }

      if (_this.connection.client) {
        return _this.getSingleDescription(
          _this.connection.client,
          true,
          false,
          success,
          failure,
          ignore
        );
      }
    });
  };

  ImplementorsProvider.prototype.addLocalDescription = function (description) {
    this.localDescriptions.push(description);
  };

  ImplementorsProvider.prototype.addDescription = function (description) {
    var _this = this;
    this.descriptions.push(description);
    this.happnerClient.emit('description/new', description);
    Object.keys(this.maps).forEach(function (mapPath) {
      var parts = mapPath.split('/');
      var componentName = parts[0];
      var version = parts[1];
      var methodName = parts[2];
      var component = description.components[componentName];

      if (!component) return;
      if (!semver.coercedSatisfies(component.version, version)) return;
      if (!component.methods) return;
      if (!component.methods[methodName]) return;

      var mapData = _this.maps[mapPath];
      mapData.push({
        local: description.self,
        name: description.meshName,
        version: component.version,
      });
    });
  };

  ImplementorsProvider.prototype.removeDescription = function (name) {
    var _this = this,
      removed;

    this.descriptions = this.descriptions.filter(function (el) {
      if (el.meshName !== name) return true;
      removed = el;
      return false;
    });

    Object.keys(this.maps).forEach(function (mapPath) {
      _this.maps[mapPath] = _this.maps[mapPath].filter(function (el) {
        return el.name !== name;
      });
    });
    return removed;
  };

  ImplementorsProvider.prototype.notImplementedError = function (
    componentName,
    version,
    methodName
  ) {
    return new Error('Not implemented ' + componentName + ':' + version + ':' + methodName);
  };

  ImplementorsProvider.prototype.getNextImplementation = function (
    componentName,
    version,
    methodName
  ) {
    var mapKey, mapData;

    mapKey = componentName + '/' + version + '/' + methodName;
    mapData = this.maps[mapKey];

    if (mapData != null) {
      if (mapData.length === 0) {
        return Promise.reject(this.notImplementedError(componentName, version, methodName));
      }
      return Promise.resolve(this.getNext(mapData));
    }

    mapData = [];

    this.descriptions.forEach(function (description) {
      var components = description.components;
      Object.keys(components).forEach(function (compName) {
        if (compName !== componentName) return;
        var component = components[compName];
        if (!semver.coercedSatisfies(component.version, version)) return;
        Object.keys(component.methods).forEach(function (methName) {
          if (methName !== methodName) return;
          mapData.push({
            local: description.self,
            name: description.meshName,
            version: component.version,
          });
        });
      });
    });

    this.maps[mapKey] = mapData;

    if (mapData.length === 0) {
      return Promise.reject(this.notImplementedError(componentName, version, methodName));
    }
    return Promise.resolve(this.getNext(mapData));
  };

  //how round-robining happens
  ImplementorsProvider.prototype.getNext = function (array) {
    if (array.__lastSequence == null || array.__lastSequence > array.length - 1) {
      array.__lastSequence = 0;
    }
    let highestVer = semver.sort(array.map((item) => item.version)).pop();
    let acceptable = array.filter((comp) => comp.version === highestVer);
    let next = acceptable[array.__lastSequence % acceptable.length];
    array.__lastSequence++;
    return next;
  };

  ImplementorsProvider.prototype.registerDependency = function (
    dependorName,
    componentName,
    version
  ) {
    if (!dependorName) return; // no $happn.name, not in cluster
    this.log.debug(`registering dependency: ${dependorName}.${componentName}@${version}`);
    this.dependencies[dependorName] = this.dependencies[dependorName] || {};
    this.dependencies[dependorName][componentName] = version;
  };

  ImplementorsProvider.prototype.addAndCheckDependencies = function (dependor, dependencies) {
    dependencies = dependencies.$broker || dependencies;
    Object.keys(dependencies).forEach((component) => {
      this.registerDependency(dependor, component, dependencies[component].version);
    });
    this.log.debug('logging dependencies met on add and check dependencies');
    return this.logDependenciesMet(this.descriptions);
  };

  ImplementorsProvider.prototype.logDependenciesMet = function (descriptions) {
    if (!this.gotDescriptions) {
      this.log.debug('logging dependencies met false, gotDescriptions false');
      return false;
    }
    if (!this.dependencies || Object.keys(this.dependencies).length === 0) {
      this.log.debug('logging dependencies met true, no dependencies');
      return true;
    }

    let allSatisfied = true;
    Object.keys(this.dependencies).forEach((dependorName) => {
      let satisfied = true;
      let dependencies = {
        tree: this.dependencies[dependorName],
        keys: Object.keys(this.dependencies[dependorName]),
      };
      if (dependencies.keys.length > 0) {
        this.log.debug(
          `logging dependencies ${dependencies.keys.join(',')} met for dependor ${dependorName}`
        );
      }
      dependencies.keys.forEach((componentName) => {
        let version = dependencies.tree[componentName];
        let countMatches = this.countDependencyMatches(componentName, version);
        let log = this.log.debug;
        if (countMatches === 0) {
          satisfied = false;
          allSatisfied = false;
          log = this.log.warn;
        }
        log('dependent %s has %d of %s %s', dependorName, countMatches, componentName, version);
        this.__getUpdatedDependencyDescriptions(descriptions, componentName, version).forEach(
          (foundComponentDescription) => {
            if (!foundComponentDescription.self) {
              let arrivedData = {
                dependorName: dependorName,
                countMatches: countMatches,
                componentName: componentName,
                version: version,
                description: foundComponentDescription.components[componentName],
                url: foundComponentDescription.url,
                meshName: foundComponentDescription.meshName,
              };
              this.log.debug(`emitting peer/arrived/description: ${JSON.stringify(arrivedData)}`);
              this.happnerClient.emit('peer/arrived/description', arrivedData);
            }
          }
        );
      });

      if (satisfied && !this.events.once[`${dependorName}/startup/dependencies/satisfied`]) {
        this.events.once[`${dependorName}/startup/dependencies/satisfied`] = true;
        this.happnerClient.emit(
          `${dependorName}/startup/dependencies/satisfied`,
          dependencies.keys
        );
      }
    });

    return allSatisfied;
  };

  ImplementorsProvider.prototype.__getUpdatedDependencyDescriptions = function (
    descriptions,
    componentName,
    version
  ) {
    if (!Array.isArray(descriptions)) descriptions = [descriptions];

    return descriptions.filter(function (description) {
      if (!description || !description.components || !description.components[componentName])
        return false;
      if (semver.coercedSatisfies(description.components[componentName].version, version))
        return true;
    });
  };

  ImplementorsProvider.prototype.countDependencyMatches = function (componentName, version) {
    this.log.debug(`counting dependency matches for ${componentName}@${version}`);
    var count = 0;
    this.descriptions.concat(this.localDescriptions).forEach((description) => {
      this.log.debug(`looking in description ${description.name}`);
      if (!description.components[componentName]) {
        this.log.debug(`component ${componentName} not found in description`);
        return;
      }
      const gotVersion = description.components[componentName].version;
      this.log.debug(`component ${componentName}@${gotVersion} found in description`);
      if (!semver.coercedSatisfies(gotVersion, version)) {
        this.log.debug(
          `component ${componentName}@${gotVersion} not satisfied against required version: ${version}`
        );
        return;
      }
      count++;
    });
    return count;
  };
})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
