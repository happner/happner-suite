const Primus = require('happn-primus-wrapper'),
  commons = require('happn-commons'),
  async = commons.async,
  util = commons.utils,
  uuid = commons.uuid,
  path = require('path'),
  CONSTANTS = commons.constants;
module.exports = class SessionService extends require('events').EventEmitter {
  #state = CONSTANTS.SERVICE_STATE.UNINITIALIZED;
  constructor(opts) {
    super();
    this.log = opts.logger.createLogger('Session');
    this.log.$$TRACE('construct(%j)', opts);

    this.__sessions = {};
    this.__sessionExpiryWatchers = {};

    this.localClient = util.maybePromisify(this.localClient);
    this.localAdminClient = util.maybePromisify(this.localAdminClient);
    this.__configureSession = util.maybePromisify(this.__configureSession);
    this.disconnectAllClients = util.maybePromisify(this.disconnectAllClients);
  }
  get state() {
    return this.#state;
  }

  __sessionIsUnconfigured(sessionId, config) {
    let unconfigured = !this.__sessions[sessionId].data || !this.__sessions[sessionId].data.user;
    let connectedLongerThanThreshold =
      Date.now() - this.__sessions[sessionId].client.happnConnected > config.threshold;
    return unconfigured && connectedLongerThanThreshold;
  }

  __configuredSessionLog(message, config) {
    if (config.verbose) this.log.debug(message);
  }
  __unconfiguredSessionCleanup(config) {
    return () => {
      const sessionKeys = Object.keys(this.__sessions);
      this.__configuredSessionLog(`current live sessions count ${sessionKeys.length}`, config);
      var cleanedUp = 0;
      sessionKeys.forEach((sessionId) => {
        if (this.__sessionIsUnconfigured(sessionId, config)) {
          this.disconnectClient(this.__sessions[sessionId].client, (e) => {
            if (e) return this.log.warn(`unable to remove unconfigured session: ${sessionId}`);
            this.__configuredSessionLog(`session ${sessionId} not configured, removed`, config);
          });
          cleanedUp++;
        }
      });
      this.__configuredSessionLog(
        `attempted to clean up ${cleanedUp} unconfigured sessions`,
        config
      );
    };
  }

  __startUnconfiguredSessionCleanup(cleanupConfig) {
    if (!cleanupConfig) return;
    if (!this.config.secure) throw new Error('unable to cleanup sockets in an unsecure setup');
    this.log.debug(`starting unconfigured session cleanup, at interval: ${cleanupConfig.interval}`);
    this.__unconfiguredSessionCleanupInterval = setInterval(
      this.__unconfiguredSessionCleanup(cleanupConfig),
      cleanupConfig.interval
    );
  }

  __stopUnconfiguredSessionCleanup() {
    if (this.__unconfiguredSessionCleanupInterval) {
      clearInterval(this.__unconfiguredSessionCleanupInterval);
      this.__unconfiguredSessionCleanupInterval = null;
      this.log.debug(`stopped unconfigured session cleanup`);
    }
  }

  stats() {
    return {
      sessions: Object.keys(this.__sessions).length,
    };
  }

  __safeSessionData(sessionData) {
    const safeSessionData = {
      id: sessionData.id,
      info: sessionData.info,
      type: sessionData.type,
      msgCount: sessionData.msgCount,
      legacyPing: sessionData.legacyPing || false,
      timestamp: sessionData.timestamp,
      policy: sessionData.policy,
      protocol: sessionData.protocol,
      cookieName: sessionData.cookieName,
      browser: sessionData.info && sessionData.info._browser ? true : false,
      intraProc:
        (sessionData.info && sessionData.info._local) || sessionData.address === 'intra-proc',
      sourceAddress: sessionData.address ? sessionData.address.ip : null,
      sourcePort: sessionData.address ? sessionData.address.port : null,
      upgradeUrl: sessionData.url,
      happnVersion: sessionData.version,
      happn: sessionData.happn,
      authType: sessionData.authType,
    };

    if (sessionData.user)
      safeSessionData.user = {
        username: sessionData.user.username,
        publicKey: sessionData.user.publicKey,
      };

    return safeSessionData;
  }

  initializeCaches() {
    if (!this.config.activeSessionsCache) {
      this.config.activeSessionsCache = {
        type: 'static',
      };
    }
    this.activeSessions = this.happn.services.cache.create(
      'service_session_active_sessions',
      this.config.activeSessionsCache
    );
  }

  __attachSessionExpired(session) {
    if (
      session.policy &&
      session.policy['0'] &&
      session.policy['0'].ttl > 0 &&
      //eslint-disable-next-line
      session.policy['0'].ttl != Infinity
    ) {
      this.__sessionExpiryWatchers[session.id] = setTimeout(() => {
        this.endSession(session.id, 'token-expired');
        this.__detachSessionExpired(session.id);
      }, session.policy[0].ttl);
    }
  }

  __detachSessionExpired(sessionId) {
    if (!this.__sessionExpiryWatchers[sessionId]) return;
    clearTimeout(this.__sessionExpiryWatchers[sessionId]);
    delete this.__sessionExpiryWatchers[sessionId];
  }

  endSession(sessionId, reason) {
    this.disconnectSession(
      sessionId,
      (e) => {
        if (e) return this.log.warn(`failed to end session ${sessionId}: ${e.message}`);
      },
      {
        reason,
      }
    );
  }

  attachSession(sessionId, session, authType) {
    var sessionData = this.__updateSession(sessionId, { ...session, authType });
    if (sessionData == null) return;
    const safeSessionData = this.__safeSessionData(sessionData);
    this.logSessionAttached(safeSessionData);
    this.emit('authentic', safeSessionData);
    this.activeSessions.set(sessionId, sessionData);
    this.__attachSessionExpired(session);
    return sessionData;
  }

  logSessionAttached(safeSessionData) {
    if (this.config.disableSessionEventLogging) return;
    //logged in such a manner that we are able to ingest the data into datadog / cloudwatch etc.
    this.log.debug(this.getSessionEventJSON('session attached', safeSessionData));
  }

  logSessionDetached(safeSessionData) {
    if (this.config.disableSessionEventLogging) return;
    //logged in such a manner that we are able to ingest the data into datadog / cloudwatch etc.
    this.log.debug(this.getSessionEventJSON('session detached', safeSessionData));
  }

  getSessionEventJSON(event, safeSessionData) {
    return JSON.stringify({
      event,
      username: safeSessionData.user
        ? safeSessionData.user.username
        : 'anonymous (unsecure connection)',
      sourceAddress: safeSessionData.sourceAddress,
      sourcePort: safeSessionData.sourcePort,
      upgradeUrl: safeSessionData.upgradeUrl,
      happnVersion: safeSessionData.happnVersion,
      happnProtocolVersion: safeSessionData.protocol,
    });
  }

  processRevokeSessionToken(message, reason, callback) {
    this.happn.services.security.revokeToken(message.session.token, reason, (e) => {
      callback(e, message);
    });
  }

  __updateSession(sessionId, updated) {
    if (!this.__sessions[sessionId]) return null;
    for (var propertyName in updated)
      this.__sessions[sessionId].data[propertyName] = updated[propertyName];
    return this.__sessions[sessionId].data;
  }

  getClient(sessionId) {
    return this.__sessions[sessionId] ? this.__sessions[sessionId].client : null;
  }

  getSession(sessionId) {
    return this.__sessions[sessionId] ? this.__sessions[sessionId].data : null;
  }

  disconnectSessions(parentSessionId, message, callback, includeParent = true) {
    async.eachSeries(
      Object.keys(this.__sessions),
      (sessionId, sessionCb) => {
        const session = this.__sessions[sessionId];
        if (!includeParent && session.data.id === parentSessionId) return sessionCb();
        if (session.data.parentId !== parentSessionId) return sessionCb();
        this.disconnectSession(sessionId, sessionCb, message);
      },
      (e) => {
        return callback(e);
      }
    );
  }

  disconnectSessionsWithToken(token, message, callback) {
    async.eachSeries(
      Object.keys(this.__sessions),
      (sessionId, sessionCb) => {
        const session = this.__sessions[sessionId];
        if (session.data.token === token) {
          return this.disconnectSession(sessionId, sessionCb, message);
        }
        return sessionCb();
      },
      (e) => {
        return callback(e);
      }
    );
  }

  disconnectSession(sessionId, callback, message) {
    const session = this.__sessions[sessionId];
    if (!session) {
      if (callback) callback();
      return;
    }
    this.__detachSessionExpired(sessionId);
    this.disconnectClient(session.client, callback, {
      _meta: {
        type: 'system',
      },
      data: message,
      eventKey: 'server-side-disconnect',
      __outbound: true,
    });
  }

  each(eachHandler, callback) {
    //the caller can iterate through the sessions
    var sessionKeys = Object.keys(this.__sessions);
    if (sessionKeys.length === 0) return callback();

    async.each(
      sessionKeys,
      (sessionKey, sessionKeyCallback) => {
        eachHandler.call(eachHandler, this.__sessions[sessionKey].data, sessionKeyCallback);
      },
      callback
    );
  }

  destroyPrimus(options, callback) {
    var shutdownTimeout = setTimeout(() => {
      this.log.warn('primus destroy timed out after ' + options.timeout + ' milliseconds');
      this.__shutdownTimeout = true; //instance level flag to ensure callback is not called multiple times
      this.#state = CONSTANTS.SERVICE_STATE.STOPPED;
      callback();
    }, options.timeout);

    this.primus.destroy(
      {
        // // have primus close the http server and clean up
        close: true,
        // have primus inform clients to attempt reconnect
        reconnect: typeof options.reconnect === 'boolean' ? options.reconnect : true,
      },
      (e) => {
        //we ensure that primus didn't time out earlier
        if (!this.__shutdownTimeout) {
          clearTimeout(shutdownTimeout);
          this.#state = CONSTANTS.SERVICE_STATE.STOPPED;
          callback(e);
        }
      }
    );
  }

  stop(options, callback) {
    this.#state = CONSTANTS.SERVICE_STATE.STOPPING;
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    if (!options) options = {};

    if (!this.primus) {
      this.#state = CONSTANTS.SERVICE_STATE.STOPPED;
      return callback();
    }
    if (!options.timeout) options.timeout = 20000;
    this.__stopUnconfiguredSessionCleanup();

    if (options.reconnect !== false) {
      return this.destroyPrimus(options, callback);
    }

    // this must happen rarely or in test cases
    this.disconnectAllClients((e) => {
      if (e) this.log.warn('failed disconnecting clients gracefully', e);
      this.destroyPrimus(options, callback);
    });
  }

  disconnectAllClients(callback) {
    this.each((sessionData, sessionDataCallback) => {
      this.disconnectSession(sessionData.id, sessionDataCallback, {
        reason: 'reconnect-false',
      });
    }, callback);
  }

  initialize(config, callback) {
    try {
      if (!config) config = {};

      if (!config.timeout) config.timeout = false;

      if (!config.disconnectTimeout) config.disconnectTimeout = 1000;

      this.errorService = this.happn.services.error;

      this.config = config;

      this.__shutdownTimeout = false; //used to flag an incomplete shutdown

      this.__currentMessageId = 0;

      if (config.unconfiguredSessionCleanup) {
        //ensure we have some sensible defaults
        //the interval between checks for unconfigured sessions  (5 secs)
        config.unconfiguredSessionCleanup.interval =
          config.unconfiguredSessionCleanup.interval || 5e3;
        //how long we wait to classify a session with no user data as unconfigured (30 secs)
        config.unconfiguredSessionCleanup.threshold =
          config.unconfiguredSessionCleanup.threshold || 30e3;
        //log what is happening if not explicitly set to false
        config.unconfiguredSessionCleanup.verbose =
          config.unconfiguredSessionCleanup.verbose == null
            ? true
            : config.unconfiguredSessionCleanup.verbose;

        this.__startUnconfiguredSessionCleanup(config.unconfiguredSessionCleanup);
      }

      this.primus = new Primus(this.happn.server, config.primusOpts);

      this.primus.on('connection', this.onConnect.bind(this));
      this.primus.on('disconnection', this.onDisconnect.bind(this));

      //remove the __outbound tag
      this.primus.transform('outgoing', (packet, next) => {
        if (packet.data) delete packet.data.__outbound;
        next();
      });

      var clientPath = path.resolve(__dirname, '../connect/public');

      // happner is using this to create the api/client package
      this.script = clientPath + '/browser_primus.js';

      if (process.env.UPDATE_BROWSER_PRIMUS) {
        this.log.debug(`writing browser primus: ${this.script}`);
        this.primus.save(this.script);
      }

      this.initializeCaches();
      this.#state = CONSTANTS.SERVICE_STATE.STARTED;
      callback();
    } catch (e) {
      callback(e);
    }
  }

  localClient(config, callback) {
    if (typeof config === 'function') {
      callback = config;
      config = {};
    }

    var ClientBase = require('../../client');
    var LocalPlugin = require('./localclient').Wrapper;

    return ClientBase.create(
      {
        config: config,
        plugin: LocalPlugin,
        context: this.happn,
      },
      (e, instance) => {
        if (e) return callback(e);
        callback(null, instance);
      }
    );
  }

  localAdminClient(callback) {
    var ClientBase = require('../../client');
    var AdminPlugin = require('./adminclient').Wrapper;

    return ClientBase.create(
      {
        config: {
          username: '_ADMIN',
          password: 'LOCAL',
        }, //the AdminPlugin is directly connected to the security service, this password is just a place holder to get around client validation
        plugin: AdminPlugin,
        context: this.happn,
      },
      (e, instance) => {
        if (e) return callback(e);
        callback(null, instance);
      }
    );
  }

  // so we can update the session data to use a different protocol, or start encrypting payloads etc
  __configureSession(message, client) {
    if (!this.__sessions[client.sessionId]) return;

    let session = this.__sessions[client.sessionId];

    session.client.happnProtocol = message.data.protocol;

    var configuration = {
      version: message.data.version || 'unknown',
      protocol: message.data.protocol,
      cookieName: message.data.browser
        ? this.happn.services.security.getCookieName(session.client.headers, session.data, {})
        : undefined,
    };

    const updatedSession = this.__updateSession(client.sessionId, configuration);
    return updatedSession;
  }

  processConfigureSession(message) {
    this.emit('session-configured', this.__safeSessionData(message.session));
  }

  __discardMessage(message) {
    this.emit('message-discarded', message);
  }

  handleMessage(message, client) {
    if (this.#state !== CONSTANTS.SERVICE_STATE.STARTED) {
      // dont process anything
      return;
    }

    //legacy clients do pings
    if (message.indexOf && message.indexOf('primus::ping::') === 0) {
      if (this.__sessions[client.sessionId] && this.__sessions[client.sessionId].data)
        this.__sessions[client.sessionId].data.legacyPing = true;
      return client.onLegacyPing(message);
    }
    //this must happen before the protocol service processes the message stack
    if (message.action === 'configure-session') this.__configureSession(message, client);
    if (!this.__sessions[client.sessionId]) return this.__discardMessage(message);

    this.__sessions[client.sessionId].data.msgCount++;
    this.__currentMessageId++;

    this.happn.services.protocol.processMessageIn(
      {
        raw: message,
        session: this.__sessions[client.sessionId].data,
        id: this.__currentMessageId,
      },
      (e, processed) => {
        if (e)
          return this.happn.services.error.handleSystem(
            e,
            'SessionService.handleMessage',
            CONSTANTS.ERROR_SEVERITY.MEDIUM
          );
        processed.response.__outbound = true;
        client.write(processed.response);
      }
    );
  }

  finalizeDisconnect(client, callback) {
    try {
      const session = this.__sessions[client.sessionId];
      if (!session) return callback();
      const sessionData = session.data;
      delete this.__sessions[client.sessionId];
      this.__detachSessionExpired(client.sessionId);
      this.happn.services.subscription.clearSessionSubscriptions(client.sessionId);
      this.activeSessions.remove(client.sessionId);
      const safeSessionData = this.__safeSessionData(sessionData);
      this.logSessionDetached(safeSessionData);
      this.emit('disconnect', safeSessionData); //emit the disconnected event
      this.emit('client-disconnect', client.sessionId); //emit the disconnected event
      callback();
    } catch (e) {
      callback(e);
    }
  }

  disconnectClient(client, callback, message) {
    if (!callback) callback = () => {};
    if (!this.__sessions[client.sessionId]) return callback();
    if (client.__readyState === 2) return this.finalizeDisconnect(client, callback);
    client.once('end', () => {
      this.finalizeDisconnect(client, callback);
    });
    if (message) return client.end(message);
    client.end();
  }

  disconnect(client, callback) {
    this.disconnectClient(client, callback);
  }

  getClientUpgradeHeaders(headers) {
    if (!headers) return {};
    return Object.keys(headers).reduce((headersObj, header) => {
      const headerLowerCase = header.toLowerCase();
      if (CONSTANTS.CLIENT_HEADERS_COLLECTION.indexOf(headerLowerCase) > -1)
        headersObj[headerLowerCase] = headers[header];
      return headersObj;
    }, {});
  }

  socketErrorWarning(err) {
    return (
      err.message.indexOf('Failed to decode incoming data') > -1 ||
      err.message.indexOf('Invalid WebSocket frame') > -1
    );
  }

  onConnect(client) {
    client.sessionId = uuid.v4();
    client.happnConnected = Date.now();
    const sessionData = {
      msgCount: 0,
      id: client.sessionId,
      protocol: 'happn', //we default to the oldest protocol
      happn: this.happn.services.system.getDescription(),
      headers: this.getClientUpgradeHeaders(client.headers),
      encrypted: client.request && client.request.connection.encrypted ? true : false,
      address: client.address || 'intra-proc',
      url: client.request && client.request.url,
    };
    this.__sessions[client.sessionId] = {
      client: client,
      data: sessionData,
    };
    client.on('error', (err) => {
      if (this.socketErrorWarning(err)) this.log.warn(`socket warning: ${err.message}`);
      else this.log.error('socket error', err);
      const errorObject = this.__safeSessionData(sessionData);
      this.log.json.warn(errorObject, 'client-socket-error');
      this.emit('client-socket-error', errorObject);
    });
    client.on('data', (message) => {
      setImmediate(() => {
        this.handleMessage(message, client);
      });
    });
    this.emit('connect', this.__safeSessionData(sessionData));
  }

  onDisconnect(client) {
    this.finalizeDisconnect(client, (e) => {
      if (e) this.log.warn('client disconnect error, for session id: ' + client.sessionId, e);
    });
  }

  securityDirectoryChanged(whatHappnd, changedData, effectedSessions) {
    return new Promise((resolve, reject) => {
      if (
        effectedSessions == null ||
        effectedSessions.length === 0 ||
        CONSTANTS.SECURITY_DIRECTORY_CHANGE_EVENTS_COLLECTION.indexOf(whatHappnd) === -1
      )
        return resolve(effectedSessions);

      async.each(
        effectedSessions,
        (effectedSession, sessionCB) => {
          try {
            var client = this.getClient(effectedSession.id);
            if (!client) return sessionCB();
            this.happn.services.protocol.processSystemOut(
              {
                session: effectedSession,
                eventKey: 'security-data-changed',
                data: {
                  whatHappnd: whatHappnd,
                  changedData: changedData,
                },
              },
              sessionCB
            );
          } catch (e) {
            sessionCB(e);
          }
        },
        (e) => {
          if (e) return reject(e);
          resolve(effectedSessions);
        }
      );
    });
  }
};
