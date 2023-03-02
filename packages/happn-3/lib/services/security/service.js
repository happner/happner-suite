const jwt = require('jwt-simple'),
  commons = require('happn-commons'),
  uuid = commons.uuid,
  util = commons.utils,
  nodeUtil = require('util'),
  async = commons.async,
  BaseAuthProvider = require('../../providers/security-base-auth-provider'),
  SecurityFacadeFactory = require('../../factories/security-facade-factory'),
  path = require('path'),
  CONSTANTS = require('../..').constants,
  AUTHORIZE_ACTIONS = CONSTANTS.AUTHORIZE_ACTIONS_COLLECTION;
module.exports = class SecurityService extends require('events').EventEmitter {
  #dataHooks;
  #dataChangedQueue;
  #sessionManagementActive;
  #locks;
  #profilesConfigurator;
  constructor(opts) {
    super();
    this.log = opts.logger.createLogger('Security');
    this.log.$$TRACE('construct(%j)', opts);
    //security-data-changed event causes warning
    this.setMaxListeners(35);

    if (!opts.onBehalfOfCache) {
      opts.onBehalfOfCache = {
        max: 1e3,
        maxAge: 0,
      };
    }
    this.options = opts;

    this.#profilesConfigurator = require('../../configurators/security-profiles-configurator');

    this.cache_profiles = null;
    this.cache_revoked_tokens = null;
    this.cache_session_activity = null;
    this.cache_session_on_behalf_of = null;
    this.cache_security_authentication_nonce = null;

    this.#dataHooks = [];

    this.initialize = nodeUtil.callbackify(this.initialize);
    this.dataChanged = util.maybePromisify(this.dataChanged);
    this.checkRevocations = util.maybePromisify(this.checkRevocations);
    this.checkTokenUserId = util.maybePromisify(this.checkTokenUserId);
    this.authorize = util.maybePromisify(this.authorize);
    this.listActiveSessions = util.maybePromisify(this.listActiveSessions);
    this.loadRevokedTokens = util.maybePromisify(this.loadRevokedTokens);
    this.login = util.maybePromisify(this.login);
    this.matchPassword = util.maybePromisify(this.matchPassword);
    this.verifyAuthenticationDigest = util.maybePromisify(this.verifyAuthenticationDigest);
    this.revokeToken = util.maybePromisify(this.revokeToken);
  }

  get sessionManagementActive() {
    return this.#sessionManagementActive;
  }

  async initialize(config) {
    if (this.happn.config.disableDefaultAdminNetworkConnections === true)
      config.disableDefaultAdminNetworkConnections = true;

    this.cacheService = this.happn.services.cache;
    this.dataService = this.happn.services.data;
    this.cryptoService = this.happn.services.crypto;
    this.sessionService = this.happn.services.session;
    this.utilsService = this.happn.services.utils;
    this.errorService = this.happn.services.error;
    this.systemService = this.happn.services.system;

    this.pathField = this.dataService.pathField; //backward compatible for allowing mongo plugin, which uses an actual path field

    if (config.updateSubscriptionsOnSecurityDirectoryChanged == null)
      config.updateSubscriptionsOnSecurityDirectoryChanged = true;

    if (!config.defaultNonceTTL) config.defaultNonceTTL = 60000;
    //1 minute
    else config.defaultNonceTTL = this.happn.services.utils.toMilliseconds(config.defaultNonceTTL);

    if (!config.logSessionActivity) config.logSessionActivity = false;

    if (!config.sessionActivityTTL) config.sessionActivityTTL = 60000 * 60 * 24;
    //1 day
    else
      config.sessionActivityTTL = this.happn.services.utils.toMilliseconds(
        config.sessionActivityTTL
      );

    if (typeof config.pbkdf2Iterations !== 'number') config.pbkdf2Iterations = 10000;

    // token is always locked to login type
    if (config.lockTokenToLoginType == null) config.lockTokenToLoginType = true;

    // rest logouts disabled by default
    if (config.allowLogoutOverHttp == null) config.allowLogoutOverHttp = false;

    this.config = config;
    this.config.cookieName = this.config.cookieName || 'happn_token';

    if (!this.config.secure) this.processAuthorize = this.processAuthorizeUnsecure;

    //we only want 1 security directory refresh to happen at a time
    this.#dataChangedQueue = async.queue((task, callback) => {
      this.#dataChangedInternal(task.whatHappnd, task.changedData, task.additionalInfo, callback);
    }, 1);

    await this.#initializeGroups(config);
    await this.#initializeCheckPoint(config);
    await this.#initializeUsers(config);
    await this.#initializeLookupTables(config);
    this.#initializeProfiles(config);
    await this.#initializeSessionManagement(config);
    this.#initializeOnBehalfOfCache(config);
    await this.#ensureAdminUser(config);
    this.anonymousUser = await this.#ensureAnonymousUser(config);
    await this.#initializeReplication(config);
    await this.#initializeSessionTokenSecret(config);
    await this.#initializeAuthProviders(config);
    this.cache_security_authentication_nonce = this.cacheService.create(
      'security_authentication_nonce'
    );
  }
  processUnsecureLogin(message, callback) {
    let session = this.generateEmptySession(message.session.id);
    session.info = message.request.data.info;
    message.response = {
      data: this.happn.services.session.attachSession(message.session.id, session),
    };

    return callback(null, message);
  }

  #getAuthProvider(authType) {
    const foundAuthType = this.authProviders[authType] ? authType : 'default';
    return { instance: this.authProviders[foundAuthType], authType: foundAuthType };
  }

  #getAuthProviderForUser(username, callback) {
    if (username === '_ADMIN' || username === '_ANONYMOUS') {
      return callback(null, this.#getAuthProvider('happn'));
    }
    this.users.getUser(username, (e, user) => {
      if (e) return callback(e);
      if (!user) {
        return callback(null, this.#getAuthProvider('default'));
      }
      return callback(null, this.#getAuthProvider(user.authType));
    });
  }

  #matchAuthProvider(credentials, callback, allowCredentialsAuthType) {
    if (credentials.token) {
      // authType in the token
      let decodedToken = this.decodeToken(credentials.token);
      if (decodedToken == null) {
        return callback(
          this.happn.services.error.InvalidCredentialsError(
            'Invalid credentials: invalid session token'
          )
        );
      }
      return this.#matchAuthProvider(decodedToken, callback, true);
    }
    if (credentials.authType != null) {
      // user specifies their own authType
      if (this?.config?.allowUserChooseAuthProvider === false && !allowCredentialsAuthType) {
        return callback(
          this.happn.services.error.InvalidCredentialsError(
            'Invalid credentials: security policy disallows choosing of own auth provider'
          )
        );
      }
      return callback(null, this.#getAuthProvider(credentials.authType));
    }
    if (credentials.username == null) {
      // no user specified
      return callback(null, this.#getAuthProvider('default'));
    }
    // get by username
    this.#getAuthProviderForUser(credentials.username, (e, authProvider) => {
      if (e) {
        return callback(e);
      }
      return callback(null, authProvider, credentials);
    });
  }

  processLogin(message, callback) {
    let credentials = message.request.data;
    let sessionId = null;
    if (message.session) sessionId = message.session.id;
    this.#matchAuthProvider(
      credentials,
      (e, authProvider) => {
        if (e) return callback(e);
        let loginError, loginSession;
        authProvider.instance
          .login(credentials, sessionId, message.request)
          .then(
            (session) => {
              loginSession = session;
            },
            (e) => {
              loginError = e;
            }
          )
          .finally(() => {
            if (loginError) {
              return callback(loginError);
            }
            let attachedSession = this.happn.services.session.attachSession(
              sessionId,
              loginSession,
              authProvider.authType
            );
            if (!attachedSession) {
              return callback(
                new Error('session with id ' + sessionId + ' dropped while logging in')
              );
            }
            let decoupledSession = this.happn.services.utils.clone(attachedSession);
            delete decoupledSession.user.groups; //needlessly large list of security groups passed back, groups are necessary on server side though
            message.response = {
              data: decoupledSession,
            };
            callback(null, message);
          });
      },
      this?.config?.allowUserChooseAuthProvider !== false
    );
  }

  login(credentials, sessionId, request, callback) {
    this.#matchAuthProvider(
      credentials,
      (e, authProvider) => {
        if (e) return callback(e);
        let loginSession, loginError;
        return authProvider.instance
          .login(credentials, sessionId, request)
          .then(
            (session) => {
              loginSession = session;
            },
            (e) => {
              loginError = e;
            }
          )
          .finally(() => {
            if (loginError) {
              return callback(loginError);
            }
            callback(null, loginSession);
          });
      },
      this?.config?.allowUserChooseAuthProvider !== false
    );
  }

  processAuthorizeUnsecure(message, callback) {
    return callback(null, message);
  }

  processAuthorize(message, callback) {
    if (AUTHORIZE_ACTIONS.indexOf(message.request.action) === -1) return callback(null, message);
    if (!message.request.path)
      return callback(this.happn.services.error.AccessDeniedError('invalid path'));

    const authPath = message.request.path.replace(/^\/(?:REMOVE|SET|ALL)@/, '');

    if (
      message.request.options &&
      message.request.options.onBehalfOf &&
      message.request.options.onBehalfOf !== '_ADMIN'
    )
      return this.authorizeOnBehalfOf(
        message.session,
        authPath,
        message.request.action,
        message.request.options.onBehalfOf,
        (e, authorized, reason, onBehalfOfSession) => {
          if (e) return callback(e);
          if (!authorized) {
            let onBehalfOfMessage =
              'request on behalf of unauthorised user: ' + message.request.options.onBehalfOf;
            if (!reason) {
              reason = onBehalfOfMessage;
            } else {
              reason += ' ' + onBehalfOfMessage;
            }
            return callback(this.happn.services.error.AccessDeniedError('unauthorized', reason));
          }
          message.session = onBehalfOfSession;
          callback(null, message);
        }
      );

    return this.authorize(
      message.session,
      authPath,
      message.request.action,
      (e, authorized, reason) => {
        if (e) return callback(e);
        if (!authorized) {
          return callback(this.happn.services.error.AccessDeniedError(reason || 'unauthorized'));
        }
        callback(null, message);
      }
    );
  }

  processNonceRequest(message, callback) {
    const callbackArgs = [];
    try {
      const nonce = this.createAuthenticationNonce(message.request.data);
      message.response = {
        nonce,
        data: {
          nonce, //happn-2 backward compatability
        },
      };
      callbackArgs.push(null, message);
    } catch (e) {
      callbackArgs.length = 0;
      callbackArgs.push(e);
    } finally {
      callback(...callbackArgs);
    }
  }

  AccessDeniedError(message, reason) {
    return this.happn.services.error.AccessDeniedError(message, reason);
  }

  async #ensureAdminUser(config) {
    if (!config.adminUser)
      config.adminUser = {
        custom_data: {},
      };
    if (!config.adminGroup)
      config.adminGroup = {
        custom_data: {
          description: 'the default administration group for happn',
        },
      };

    config.adminUser.username = '_ADMIN';
    config.adminGroup.name = '_ADMIN';

    config.adminGroup.permissions = {
      '*': {
        actions: ['*'],
      },
    };
    // recreate admin group, so that base system permissions are always in place
    const adminGroup = await this.groups.upsertGroupWithoutValidation(config.adminGroup, {});
    const foundUser = await this.users.getUser('_ADMIN');

    if (foundUser) return;
    if (!config.adminUser.password) {
      config.adminUser.password = 'happn';
    }
    const adminUser = await this.users.upsertUserWithoutValidation(config.adminUser, {});
    await this.groups.linkGroup(adminGroup, adminUser);
  }

  async #ensureAnonymousUser(config) {
    if (!config.allowAnonymousAccess) return null;
    let anonymousUser = await this.users.getUser('_ANONYMOUS');
    if (anonymousUser != null) return anonymousUser;
    return this.users.upsertUserWithoutValidation({
      username: '_ANONYMOUS',
      password: 'anonymous',
    });
  }

  async linkAnonymousGroup(group) {
    if (!this.config.allowAnonymousAccess) throw new Error('Anonymous access is not configured');
    return await this.groups.linkGroup(group, this.anonymousUser);
  }

  async unlinkAnonymousGroup(group) {
    if (!this.config.allowAnonymousAccess) throw new Error('Anonymous access is not configured');
    return await this.groups.unlinkGroup(group, this.anonymousUser);
  }

  #initializeReplication() {
    if (!this.happn.services.replicator) return;

    this.happn.services.replicator.on('/security/dataChanged', (payload, self) => {
      if (self) return;

      let whatHappnd = payload.whatHappnd;
      let changedData = payload.changedData;
      let additionalInfo = payload.additionalInfo;

      // flag as learned from replication - to not replicate again
      changedData.replicated = true;
      this.dataChanged(whatHappnd, changedData, additionalInfo);
    });
  }

  #initializeCheckPoint(config) {
    return new Promise((resolve, reject) => {
      let checkpoint = require('./checkpoint');
      this.checkpoint = new checkpoint({
        logger: this.log,
      });

      Object.defineProperty(this.checkpoint, 'happn', {
        value: this.happn,
      });

      this.checkpoint.initialize(config, this, (e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  #initializeUsers(config) {
    return new Promise((resolve, reject) => {
      let SecurityUsers = require('./users');
      this.users = new SecurityUsers({
        logger: this.log,
      });
      Object.defineProperty(this.users, 'happn', {
        value: this.happn,
      });
      Object.defineProperty(this.users, 'groups', {
        value: this.groups,
      });
      this.users.initialize(config, this, (e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  #initializeLookupTables(config) {
    let SecurityLookupTables = require('./lookup-tables');
    this.lookupTables = SecurityLookupTables.create({
      logger: this.log,
    });
    return this.lookupTables.initialize(this.happn, config.lookup);
  }

  async #initializeSessionTokenSecret(config) {
    if (config.sessionTokenSecret != null) {
      return this.dataService.upsert('/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET', {
        secret: config.sessionTokenSecret,
      });
    }
    const found = await this.dataService.get('/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET');
    if (found) {
      config.sessionTokenSecret = found.data.secret;
      return;
    }
    const secret = uuid.v4() + uuid.v4();
    await this.dataService.upsert('/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET', {
      secret,
    });
    config.sessionTokenSecret = secret;
  }

  #initializeGroups(config) {
    return new Promise((resolve, reject) => {
      let SecurityGroups = require('./groups');

      this.groups = new SecurityGroups({
        logger: this.log,
      });

      Object.defineProperty(this.groups, 'happn', {
        value: this.happn,
      });

      this.groups.initialize(config, this, (e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  #clearOnBehalfOfCache() {
    if (this.cache_session_on_behalf_of) this.cache_session_on_behalf_of.clear();
  }

  #initializeOnBehalfOfCache() {
    if (!this.config.secure || this.cache_session_on_behalf_of) {
      return;
    }
    this.cache_session_on_behalf_of = this.cacheService.create(
      'cache_session_on_behalf_of',
      this.options.onBehalfOfCache
    );
  }

  #initializeSessionManagement(config) {
    return new Promise((resolve, reject) => {
      if (!this.config.secure) return resolve();
      if (!config.activateSessionManagement)
        return this.loadRevokedTokens((e) => {
          if (e) return reject(e);
          resolve();
        });
      this.activateSessionManagement(config.logSessionActivity, (e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  #initializeAuthProviders(config) {
    let authProviders = config.authProviders || {};
    this.authProviders = {};
    this.authProviders.happn = require(path.resolve(
      __dirname,
      `../../providers/security-happn-auth-provider`
    )).create(SecurityFacadeFactory.createNewFacade(this), config);
    let defaultAuthProvider = config.defaultAuthProvider || 'happn';

    Object.keys(authProviders).forEach((key) => {
      if (key === 'happn') {
        // already added (above)
        return;
      }
      let provider = authProviders[key];
      this.authProviders[key] = BaseAuthProvider.create(
        provider,
        SecurityFacadeFactory.createNewFacade(this),
        config
      );
    });
    this.authProviders.default = this.authProviders[defaultAuthProvider];
    return this.#startAuthProviders();
  }

  async #startAuthProviders() {
    for (const authProviderKey in this.authProviders) {
      const authProvider = this.authProviders[authProviderKey];
      if (typeof authProvider.start === 'function' && authProviderKey !== 'default') {
        this.log.info(`starting auth provider: ${authProviderKey}`);
        await authProvider.start();
      }
    }
  }

  async #stopAuthProviders() {
    for (const authProviderKey in this.authProviders) {
      const authProvider = this.authProviders[authProviderKey];
      if (typeof authProvider.stop === 'function' && authProviderKey !== 'default') {
        this.log.info(`stopping auth provider: ${authProviderKey}`);
        await authProvider.stop();
      }
    }
  }

  activateSessionActivity(callback) {
    return this.#loadSessionActivity(callback);
  }

  deactivateSessionActivity(clear, callback) {
    if (typeof clear === 'function') {
      callback = clear;
      clear = false;
    }

    if (!this.cache_session_activity) return callback();
    this.config.logSessionActivity = false;
    if (clear) return this.cache_session_activity.clear(callback);
    callback();
  }

  activateSessionManagement(logSessionActivity, callback) {
    if (typeof logSessionActivity === 'function') {
      callback = logSessionActivity;
      logSessionActivity = false;
    }

    if (!this.config.secure)
      return callback(new Error('session management must run off a secure instance'));
    this.#sessionManagementActive = true;

    this.loadRevokedTokens((e) => {
      if (e) return callback(e);
      if (!logSessionActivity) return callback();
      this.#loadSessionActivity(callback);
    });
  }

  deactivateSessionManagement(logSessionActivity, callback) {
    if (typeof logSessionActivity === 'function') {
      callback = logSessionActivity;
      logSessionActivity = false;
    }

    if (!this.config.secure)
      return callback(new Error('session management must run off a secure instance'));

    this.#sessionManagementActive = false;

    if (logSessionActivity) this.deactivateSessionActivity(true, callback);
    else callback();
  }

  loadRevokedTokens(callback) {
    if (this.cache_revoked_tokens) return callback();

    let config = {
      type: 'persist',
      cache: {
        dataStore: this.dataService,
      },
      overwrite: true,
    };

    this.cache_revoked_tokens = this.cacheService.create('cache_revoked_tokens', config);
    this.cache_revoked_tokens.sync(callback);
  }

  #loadSessionActivity(callback) {
    if (!this.config.logSessionActivity) this.config.logSessionActivity = true;

    if (this.cache_session_activity) return callback();

    let config = {
      type: 'persist',
      cache: {
        dataStore: this.dataService,
        defaultTTL: this.config.sessionActivityTTL,
      },
    };

    this.cache_session_activity = this.cacheService.create('cache_session_activity', config);
    this.cache_session_activity.sync(callback);
  }

  checkRevocations(session, callback) {
    this.#matchAuthProvider(session, (e, authProvider, credentials) => {
      if (e) {
        return callback(e);
      }
      if (typeof authProvider.instance.providerCheckRevocations === 'function') {
        let revocationCheckError, revocationCheckResult;
        return authProvider.instance
          .providerCheckRevocations(credentials)
          .then((result) => {
            revocationCheckResult = result;
          })
          .catch((e) => {
            revocationCheckError = e;
          })
          .finally(() => {
            if (revocationCheckError) {
              return callback(revocationCheckError);
            }
            if (revocationCheckResult === true) {
              return callback(null, false, `token has been revoked`);
            }
            callback(null, true);
          });
      }
      if (!this.cache_revoked_tokens) return callback(null, true);
      this.cache_revoked_tokens.get(session.token, (e, item) => {
        if (e) return callback(e);
        if (item == null) {
          return callback(null, true);
        }
        callback(null, false, `token has been revoked`);
      });
    });
  }

  tokenFromRequest(req, options) {
    if (!options) options = {};
    if (!options.tokenName) options.tokenName = 'happn_token';
    let token;
    let cookieName = this.getCookieName(req.headers, req.connection, options);
    token = req.cookies.get(cookieName);
    if (token) return token;
    //fall back to the old cookie name, for backward compatibility - old browsers
    token = req.cookies.get(options.cookieName);
    if (token) return token;
    token = require('url').parse(req.url, true).query[options.tokenName];
    if (token) return token;
    //look in the auth headers
    if (req.headers.authorization != null) {
      let authHeader = req.headers.authorization.split(' ');
      //bearer token
      if (authHeader[0].toLowerCase() === 'bearer') token = authHeader[1];
    }
    return token;
  }

  #emitTokenRevoked(token, decoded, reason, timestamp, ttl, customRevocation, callback) {
    return (e) => {
      if (!e) {
        this.dataChanged(
          CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
          {
            token,
            session: decoded,
            reason,
            timestamp,
            ttl,
            customRevocation,
          },
          `token for session with id ${decoded.id}  and origin ${
            decoded.parentId ? decoded.parentId : decoded.id
          } revoked`
        );
      }
      callback(e);
    };
  }

  #getPolicyTTL(decoded) {
    let ttl = 0;

    if (decoded.info && decoded.info._browser) {
      // browser logins can only be used for stateful sessions
      ttl = decoded.policy[1].ttl;
    } else if (this.config.lockTokenToLoginType && decoded.type != null) {
      // we are checking if the token contains a type - to have backward compatibility
      // with old machine to machine tokens
      ttl = decoded.policy[decoded.type].ttl;
    } else {
      // tokens are interchangeable between login types
      // if both policy types have a ttl, we set the ttl
      // of the revocation to the biggest one
      if (
        decoded.policy[0].ttl &&
        decoded.policy[0].ttl !== Infinity &&
        decoded.policy[1].ttl &&
        decoded.policy[1].ttl !== Infinity
      ) {
        if (decoded.policy[0].ttl >= decoded.policy[1].ttl) ttl = decoded.policy[0].ttl;
        else ttl = decoded.policy[1].ttl;
      }
    }
    return ttl;
  }

  revokeToken(token, reason, callback) {
    if (typeof reason === 'function') {
      callback = reason;
      reason = 'SYSTEM';
    }
    if (!this.happn.config.secure) {
      return callback(
        new Error('attempt to logout or revoke token for unsecured session, use disconnect')
      );
    }
    if (token == null) {
      return callback(new Error('token not defined'));
    }
    let decoded = this.decodeToken(token);
    if (decoded == null) {
      return callback(new Error('invalid token'));
    }
    this.#matchAuthProvider(decoded, (e, authProvider) => {
      if (e) {
        return callback(e);
      }
      const timestamp = Date.now();
      const ttl = this.#getPolicyTTL(decoded);
      const customRevocation = typeof authProvider.instance.providerRevokeToken === 'function';

      const emitAndCallback = this.#emitTokenRevoked(
        token,
        decoded,
        reason,
        timestamp,
        ttl,
        customRevocation, // replicate set to true means other cluster nodes must update their cache_revoked_tokens, false means they will not update their caches
        callback
      );

      if (customRevocation) {
        let revokeError;
        // the authProvider has its own revocation logic
        return authProvider.instance
          .providerRevokeToken(decoded, reason)
          .catch((e) => {
            revokeError = e;
          })
          .finally(() => {
            emitAndCallback(revokeError);
          });
      }

      // use standard revocation logic
      if (ttl === 0) {
        this.log.warn(
          'revoking a token without a ttl means it stays in the revocation list forever'
        );
      }

      this.cache_revoked_tokens.set(
        token,
        {
          reason,
          timestamp,
          ttl,
        },
        { ttl },
        emitAndCallback
      );
    });
  }

  restoreToken(token, callback) {
    this.cache_revoked_tokens.remove(token, (e) => {
      if (!e)
        this.dataChanged(
          CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_RESTORED,
          { token },
          `token restored: ${token}`
        );
      callback(e);
    });
  }

  listRevokedTokens(filter, callback) {
    if (typeof filter === 'function') {
      callback = filter;
      filter = null;
    }
    const callbackArgs = [];
    try {
      if (!this.#sessionManagementActive) {
        return callbackArgs.push(new Error('session management not activated'));
      }
      const revokedList = this.cache_revoked_tokens.all(filter);
      return callbackArgs.push(null, revokedList);
    } catch (e) {
      callbackArgs.length = 0;
      return callbackArgs.push(e);
    } finally {
      callback(...callbackArgs);
    }
  }

  decodeToken(token) {
    try {
      if (!token) throw new Error('missing session token');

      let decoded = jwt.decode(token, this.config.sessionTokenSecret);
      let unpacked = require('jsonpack').unpack(decoded);

      return unpacked;
    } catch (e) {
      this.log.warn(`invalid session token: ${e.message}`);
      return null;
    }
  }

  checkTokenUserId(token, callback) {
    if (!this.config.lockTokenToUserId) return callback(null, true);
    this.users.getUser(token.username, (e, user) => {
      if (e) return callback(e);
      if (!user) return callback(null, true); //user doesnt exist, authorize fails at a later point
      if (!user.userid) return callback(null, true); //backward compatibility - old users
      callback(null, user.userid === token.userid);
    });
  }

  getCookieName(headers, connectionData, options) {
    if (!options.cookieName) options.cookieName = this.config.cookieName;
    if (this.config.httpsCookie) {
      return headers['x-forwarded-proto'] === 'https' ||
        headers['x-forwarded-proto'] === 'wss' ||
        connectionData.encrypted
        ? `${options.cookieName}_https`
        : options.cookieName;
    }
    //fall back to the old cookie name, for backward compatibility - old browsers
    return options.cookieName;
  }

  sessionFromRequest(req, options) {
    if (req.happn_session != null) return req.happn_session; //attached somewhere else up the call stack

    let token = this.tokenFromRequest(req, options);

    if (!token) return null;

    let session = this.decodeToken(token);
    if (session == null) {
      this.log.warn('failed decoding session token from request');
      return null;
    }
    session.type = 0;
    session.happn = this.happn.services.system.getDescription();
    session.token = token;
    return session;
  }

  logSessionActivity(sessionId, path, action, err, authorized, reason, callback) {
    let activityInfo = {
      path: path,
      action: action,
      id: sessionId,
      error: err ? err.toString() : '',
      authorized: authorized,
      reason: reason,
    };

    this.cache_session_activity.set(sessionId, activityInfo, callback);
  }

  #listCache(cacheName, filter) {
    if (!this[cacheName]) throw new Error(`cache with name${cacheName} does not exist`);
    return this[cacheName].all(filter);
  }

  listSessionActivity(filter, callback) {
    if (typeof filter === 'function') {
      callback = filter;
      filter = null;
    }
    const callbackArgs = [];
    try {
      if (!this.config.logSessionActivity)
        return callbackArgs.push(new Error('session activity logging not activated'));
      callbackArgs.push(null, this.#listCache('cache_session_activity', filter));
    } catch (e) {
      callbackArgs.length = 0;
      return callbackArgs.push(e);
    } finally {
      callback(...callbackArgs);
    }
  }

  listActiveSessions(filter, callback) {
    if (typeof filter === 'function') {
      callback = filter;
      filter = null;
    }
    const callbackArgs = [];
    try {
      if (!this.#sessionManagementActive) {
        return callbackArgs.push(new Error('session management not activated'));
      }
      const activeSessionsList = this.happn.services.session.activeSessions.all(filter);
      return callbackArgs.push(null, activeSessionsList);
    } catch (e) {
      callbackArgs.length = 0;
      return callbackArgs.push(e);
    } finally {
      callback(...callbackArgs);
    }
  }

  offDataChanged(index) {
    delete this.#dataHooks[index];
  }

  onDataChanged(hook) {
    this.#dataHooks.push(hook);
    return this.#dataHooks.length - 1;
  }

  getEffectedSession(sessionData, causeSubscriptionsRefresh) {
    return {
      id: sessionData.id,
      username: sessionData.user ? sessionData.user.username : 'unknown',
      isToken: sessionData.isToken == null ? false : sessionData.isToken,
      previousPermissionSetKey: sessionData.previousPermissionSetKey,
      permissionSetKey: sessionData.permissionSetKey,
      user: sessionData.user,
      happn: sessionData.happn,
      protocol: sessionData.protocol,
      causeSubscriptionsRefresh: causeSubscriptionsRefresh,
    };
  }

  resetSessionPermissions(whatHappnd, changedData) {
    return new Promise((resolve, reject) => {
      let effectedSessions = [];
      let groupName;
      if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED) {
        let revokedSession = this.getEffectedSession(changedData.session, true);
        effectedSessions.push(revokedSession);
        //disconnect the revoked session and its descendents
        this.sessionService.disconnectSessionsWithToken(
          changedData.token,
          {
            reason: CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
          },
          (e) => {
            if (e) this.errorService.handleSystem(e, 'SecurityService');
          }
        );

        // cache does not need to be updated, just resolve
        // this is because we either handle the revocation logic in a non standard auth provider (changedData.replicate === false)
        // or the TOKEN_REVOKED event was not emitted by a remote cluster member
        if (!changedData.replicated || changedData.customRevocation === true) {
          return resolve(effectedSessions);
        }

        //means we are getting a replication from elsewhere in the cluster
        return this.cache_revoked_tokens.set(
          changedData.token,
          { reason: changedData.reason, id: changedData.id },
          { noPersist: true, ttl: changedData.ttl },
          (e) => {
            if (e) return reject(e);
            resolve(effectedSessions);
          }
        );
      }

      if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_RESTORED) {
        //remove the restored token without updating the db, the originating call to restoreToken already did this
        return this.cache_revoked_tokens.remove(
          changedData.token,
          { noPersist: changedData.replicated },
          (e) => {
            if (e) return reject(e);
            resolve(effectedSessions);
          }
        );
      }

      this.sessionService.each(
        (sessionData, sessionCallback) => {
          if (!sessionData.user) return sessionCallback();
          sessionData.previousPermissionSetKey = sessionData.permissionSetKey;
          if (
            whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.PERMISSION_REMOVED ||
            whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.PERMISSION_UPSERTED
          ) {
            //all we need to do, permissionSetKey remains the same (as it is the ordered list of linked groups) - all caches are cleared, but effected sessions are different
            if (
              sessionData.user.groups[changedData.groupName] != null ||
              changedData.username === sessionData.user.username
            )
              effectedSessions.push(this.getEffectedSession(sessionData, true));
          }

          if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_TABLE_CHANGED) {
            if (
              Object.keys(sessionData.user.groups).some((group) =>
                changedData.groups.includes(group)
              )
            )
              effectedSessions.push(this.getEffectedSession(sessionData, true));
          }
          if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_PERMISSION_CHANGED) {
            if (Object.keys(sessionData.user.groups).includes(changedData.group))
              effectedSessions.push(this.getEffectedSession(sessionData, true));
          }

          if (
            whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.LINK_GROUP &&
            changedData._meta.path.indexOf(
              `/_SYSTEM/_SECURITY/_USER/${sessionData.user.username}/_USER_GROUP/`
            ) === 0
          ) {
            groupName = changedData._meta.path.replace(
              `/_SYSTEM/_SECURITY/_USER/${sessionData.user.username}/_USER_GROUP/`,
              ''
            );
            sessionData.user.groups[groupName] = changedData;
            sessionData.permissionSetKey = this.generatePermissionSetKey(sessionData.user);
            effectedSessions.push(this.getEffectedSession(sessionData, true));
          }

          if (
            whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_GROUP &&
            sessionData.user.groups[changedData.name]
          ) {
            //cause a subscription refresh if the group permissions were also submitted
            if (changedData.permissions && Object.keys(changedData.permissions).length > 0)
              effectedSessions.push(this.getEffectedSession(sessionData, true));
            else effectedSessions.push(this.getEffectedSession(sessionData, false));
          }

          if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.UNLINK_GROUP) {
            if (
              changedData.path.indexOf(
                '/_SYSTEM/_SECURITY/_USER/' + sessionData.user.username + '/_USER_GROUP/'
              ) === 0
            ) {
              groupName = changedData.path.replace(
                '/_SYSTEM/_SECURITY/_USER/' + sessionData.user.username + '/_USER_GROUP/',
                ''
              );
              delete sessionData.user.groups[groupName];
              sessionData.permissionSetKey = this.generatePermissionSetKey(sessionData.user);
              effectedSessions.push(this.getEffectedSession(sessionData, true));
            }
          }

          if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.DELETE_USER) {
            let userName = changedData.obj._meta.path.replace('/_SYSTEM/_SECURITY/_USER/', '');

            if (sessionData.user.username === userName) {
              effectedSessions.push(this.getEffectedSession(sessionData, true));
              this.sessionService.disconnectSession(sessionData.id, null, {
                reason: 'security directory update: user deleted',
              });
            }
          }

          if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.DELETE_GROUP) {
            if (sessionData.user.groups[changedData.obj.name]) {
              delete sessionData.user.groups[changedData.obj.name];
              sessionData.permissionSetKey = this.generatePermissionSetKey(sessionData.user);
              effectedSessions.push(this.getEffectedSession(sessionData, true));
            }
          }

          if (whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_USER) {
            if (sessionData.user.username === changedData.username) {
              return this.users.getUser(changedData.username, (e, user) => {
                if (e) return sessionCallback(e);
                if (user == null) {
                  // the user was deleted while the security directory is being updated
                  return sessionCallback();
                }
                sessionData.user = user;
                effectedSessions.push(this.getEffectedSession(sessionData, true));
                sessionCallback();
              });
            }
          }

          sessionCallback();
        },
        (e) => {
          if (e) return reject(e);
          resolve(effectedSessions);
        }
      );
    });
  }

  emitChanges(whatHappnd, changedData, effectedSessions) {
    return new Promise((resolve, reject) => {
      try {
        let changedDataSerialized = null;
        let effectedSessionsSerialized = null;

        if (changedData) changedDataSerialized = JSON.stringify(changedData);
        if (effectedSessions) effectedSessionsSerialized = JSON.stringify(effectedSessions);

        this.#dataHooks.every((hook) => {
          return hook.apply(hook, [
            whatHappnd,
            JSON.parse(changedDataSerialized),
            JSON.parse(effectedSessionsSerialized),
          ]);
        });
        this.emit('security-data-changed', {
          whatHappnd: whatHappnd,
          changedData: changedData,
          effectedSessions: effectedSessions,
        });

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  dataChanged(whatHappnd, changedData, additionalInfo, callback) {
    if (typeof additionalInfo === 'function') {
      callback = additionalInfo;
      additionalInfo = undefined;
    }
    this.#dataChangedQueue.push({ whatHappnd, changedData, additionalInfo }, callback);
  }

  #dataChangedInternal(whatHappnd, changedData, additionalInfo, callback) {
    if (CONSTANTS.SECURITY_DIRECTORY_EVENTS_COLLECTION.indexOf(whatHappnd) === -1)
      return callback();
    this.users.clearCaches();
    this.groups.clearCaches();
    this.#clearOnBehalfOfCache();
    this.resetSessionPermissions(whatHappnd, changedData, additionalInfo)
      .then((effectedSessions) => {
        this.checkpoint.clearCaches();
        return new Promise((resolve, reject) => {
          if (
            this.happn.services.subscription &&
            this.config.updateSubscriptionsOnSecurityDirectoryChanged
          )
            this.happn.services.subscription
              .securityDirectoryChanged(whatHappnd, changedData, effectedSessions, additionalInfo)
              .then(() => {
                resolve(effectedSessions);
              })
              .catch(reject);
          else {
            resolve(effectedSessions);
          }
        });
      })
      .then((effectedSessions) => {
        return new Promise((resolve, reject) => {
          if (this.happn.services.session)
            this.happn.services.session
              .securityDirectoryChanged(whatHappnd, changedData, effectedSessions, additionalInfo)
              .then(() => {
                resolve(effectedSessions);
              })
              .catch(reject);
          else resolve(effectedSessions);
        });
      })
      .then((effectedSessions) => {
        return this.emitChanges(whatHappnd, changedData, effectedSessions, additionalInfo);
      })
      .then(() => {
        return this.#replicateDataChanged(whatHappnd, changedData, additionalInfo);
      })
      .then(() => {
        if (callback) callback();
      })
      .catch((e) => {
        this.happn.services.error.handleFatal('failure updating cached security data', e);
      });
  }

  #replicateDataChanged(whatHappnd, changedData, additionalInfo) {
    let replicator = this.happn.services.replicator;
    if (!replicator) return;
    if (changedData.replicated) return; // don't re-replicate

    return new Promise((resolve, reject) => {
      replicator.send(
        '/security/dataChanged',
        {
          whatHappnd: whatHappnd,
          changedData: changedData,
          additionalInfo: additionalInfo,
        },
        (e) => {
          if (e) {
            if (e.message === 'Replicator not ready') {
              // means not connected to self (or other peers in cluster)
              // not a problem, there will be no user/group changes to replicate
              // (other than the initial admin user create)
              // - no clients connected to this node
              // - no component start methods modifying users
              //   (the start methods only run after cluster is up)
              return resolve();
            }
            return reject(e);
          }
          resolve();
        }
      );
    });
  }

  generatePermissionSetKey(user) {
    return require('crypto')
      .createHash('sha1')
      .update(
        user.permissions
          ? Object.keys(user.groups).concat(Object.keys(user.permissions)).sort().join('/')
          : Object.keys(user.groups).sort().join('/')
      )
      .digest('base64');
  }

  generateEmptySession(id) {
    return { id: id || uuid.v4() };
  }

  profileSession(session) {
    session.policy = {
      0: null,
      1: null,
    };
    //we dont want to mess around with the actual sessions type
    //it is an unknown at this point
    let decoupledSession = this.happn.services.utils.clone(session);
    this.cache_profiles.forEach((profile) => {
      let filter = profile.session;
      [0, 1].forEach((sessionType) => {
        if (session.policy[sessionType] != null) return;
        decoupledSession.type = sessionType;
        if (commons.mongoFilter(filter, decoupledSession).length === 1) {
          session.policy[sessionType] = profile.policy;
        }
      });
    });

    if (session.policy[0] == null && session.policy[1] == null)
      throw new Error('unable to match session with a profile'); //this should never happen
  }

  generateToken(session, type) {
    let decoupledSession = this.happn.services.utils.clone(session);

    decoupledSession.type = type == null ? 1 : type; //session based type if  not specified
    decoupledSession.isToken = true;

    delete decoupledSession.permissionSetKey; //this should never be used as it may get out of sync
    delete decoupledSession.user; //also not to be used later on as it may go out of sync

    if (session.user && session.user.username) {
      decoupledSession.username = session.user.username;
      decoupledSession.userid = session.user.userid;
    }

    let packed = require('jsonpack').pack(decoupledSession);
    return jwt.encode(packed, this.config.sessionTokenSecret);
  }

  generateSession(user, sessionId, credentials, tokenLogin, additionalInfo = {}) {
    let session = this.generateEmptySession(sessionId);
    session.httpsCookie = this.config.httpsCookie;
    session.info = credentials.info;
    session.user = user;
    session.timestamp = Date.now();
    session.origin = this.happn.services.system.name;

    if (tokenLogin) {
      session.type = tokenLogin.session.type;
      session.parentId = tokenLogin.session.id;
    } else {
      session.type = 1; //stateful
      session.parentId = session.id;
    }

    this.profileSession(session); //session ttl, activity threshold and user effective permissions are set here

    session.permissionSetKey = this.generatePermissionSetKey(session.user, session);

    session.token = tokenLogin
      ? tokenLogin.token
      : this.generateToken({ ...session, ...additionalInfo }, credentials.type);

    // It is not possible for the login (websocket call) to assign the session token (cookie) server side,
    // so the cookie is therefore created in the browser upon login success.
    // It is necessary to include how to make the cookie in the login reply via this session object.
    session.cookieName = this.config.cookieName;
    //if we are logging in via websockets (and possibly the browser), we want to ensure the correct cookie name is used
    if (this.config.httpsCookie && sessionId) {
      let sessionInfo = this.sessionService.getSession(sessionId);
      if (sessionInfo == null) {
        return null;
      }
      if (
        sessionInfo.headers['x-forwarded-proto'] === 'https' ||
        sessionInfo.headers['x-forwarded-proto'] === 'wss' ||
        sessionInfo.encrypted
      ) {
        session.cookieName = `${this.config.cookieName}_https`;
      }
    }
    if (this.config.cookieDomain) {
      session.cookieDomain = this.config.cookieDomain;
    }
    return session;
  }

  //so external services can use this
  matchPassword(password, hash, callback) {
    this.cryptoService.verifyHash(password, hash, this.config.pbkdf2Iterations, callback);
  }

  #initializeProfiles(config) {
    this.cache_profiles = this.#profilesConfigurator.configure(config, this.utilsService).profiles;
  }

  #loginOK(credentials, user, sessionId, callback, tokenLogin, additionalInfo) {
    delete user.password;
    if (this.#locks) this.#locks.remove(user.username); //remove previous locks
    callback(null, this.generateSession(user, sessionId, credentials, tokenLogin, additionalInfo));
  }

  adminLogin(sessionId, callback) {
    let credentials = { username: '_ADMIN' };

    this.users.getUser(credentials.username, (e, adminUser) => {
      if (e) return callback(e);

      return this.#loginOK(credentials, adminUser, sessionId, callback);
    });
  }

  checkDisableDefaultAdminNetworkConnections(credentials, request) {
    return (
      credentials.username === '_ADMIN' &&
      this.config.disableDefaultAdminNetworkConnections === true &&
      request?.data?.info?._local === false // request origin over a socket, not in process
    );
  }

  checkIPAddressWhitelistPolicy(credentials, sessionId, request) {
    return this.cache_profiles.every((profile) => {
      if (profile.policy.sourceIPWhitelist == null || profile.policy.sourceIPWhitelist.length === 0)
        return true;
      if (commons.mongoFilter(profile.session, { user: credentials }).length === 0) return true;
      if (sessionId) {
        const session = this.sessionService.getSession(sessionId);
        if (!session) return false;
        return profile.policy.sourceIPWhitelist.indexOf(session.address.ip) > -1;
      }
      return profile.policy.sourceIPWhitelist.indexOf(request.address.ip) > -1;
    });
  }

  createAuthenticationNonce(request) {
    if (!request.publicKey) throw new Error('no public key with request');
    let nonce = this.cryptoService.generateNonce();
    this.cache_security_authentication_nonce.set(request.publicKey, nonce, {
      ttl: this.config.defaultNonceTTL,
    });
    return nonce;
  }

  /**
   * checks the incoming requests digest against a nonce that is cached via the public key of the request, calls back with true or false depending on
   * whether the digest and nonce are related by the same private key.
   */
  verifyAuthenticationDigest(request, callback) {
    const callbackArgs = [];
    try {
      if (!request.publicKey) return callbackArgs.push(new Error('no publicKey in request'));
      if (!request.digest) return callbackArgs.push(new Error('no digest in request'));
      const nonce = this.cache_security_authentication_nonce.get(request.publicKey);
      if (!nonce) return callbackArgs.push(new Error('nonce expired or public key invalid'));
      let verified = this.cryptoService.verify(nonce, request.digest, request.publicKey);
      callbackArgs.push(null, verified);
    } catch (verifyFailed) {
      callbackArgs.length = 0;
      callbackArgs.push(verifyFailed);
    } finally {
      callback(...callbackArgs);
    }
  }

  authorize(session, path, action, callback) {
    let completeCall = (err, authorized, reason) => {
      callback(err, authorized, reason);
      if (this.config.logSessionActivity)
        this.logSessionActivity(session.id, path, action, err, authorized, reason, (e) => {
          if (e) this.log.warn('unable to log session activity: ' + e.toString());
        });
    };
    this.checkRevocations(session, (e, authorized, reason) => {
      if (e) return callback(e);
      if (!authorized) return completeCall(null, false, reason);
      this.checkpoint._authorizeSession(
        session,
        path,
        action,
        (e, authorized, reason, passthrough) => {
          //check the session ttl, expiry,permissions etc.

          if (e) return callback(e);
          if (!authorized) return completeCall(null, false, reason);
          if (passthrough || session.bypassAuthUser) return completeCall(null, true);

          this.checkpoint._authorizeUser(session, path, action, completeCall);
        }
      );
    });
  }

  userIsDelegate(username, callback) {
    if (username === '_ADMIN') {
      return callback(null, true);
    }

    this.users.userBelongsToGroups(username, ['_MESH_DELEGATE'], (e, belongs) => {
      if (e) return callback(e);
      callback(null, belongs);
    });
  }

  authorizeOnBehalfOf(session, path, action, onBehalfOf, callback) {
    let completeCall = (err, authorized, reason, onBehalfOfSession) => {
      callback(err, authorized, reason, onBehalfOfSession);
      if (this.config.logSessionActivity)
        this.logSessionActivity(session.id, path, action, err, authorized, reason, (e) => {
          if (e) this.log.warn('unable to log session activity: ' + e.toString());
        });
    };

    this.userIsDelegate(session.user.username, (e, isDelegate) => {
      if (e) return callback(e);
      if (!isDelegate) {
        return completeCall(
          null,
          false,
          'session attempting to act on behalf of is not authorized'
        );
      }
      this.getOnBehalfOfSession(session, onBehalfOf, session.type, (e, behalfOfSession) => {
        if (e) return completeCall(e, false, 'failed to get on behalf of session');
        if (!behalfOfSession) return completeCall(null, false, 'on behalf of user does not exist');
        this.authorize(behalfOfSession, path, action, (err, authorized, reason) => {
          if (err || !authorized) {
            return completeCall(err, false, reason);
          }
          return completeCall(err, authorized, reason, behalfOfSession);
        });
      });
    });
  }

  getOnBehalfOfSession(delegatedBy, onBehalfOf, sessionType = 1, callback) {
    let behalfOfSession = this.cache_session_on_behalf_of.get(`${onBehalfOf}:${sessionType}`, {
      clone: false,
    });
    if (behalfOfSession) {
      return callback(null, behalfOfSession);
    }

    this.users.getUser(onBehalfOf, (e, onBehalfOfUser) => {
      if (e) return callback(e);
      if (!onBehalfOfUser) {
        return callback(null, null);
      }
      behalfOfSession = this.generateSession(
        onBehalfOfUser,
        null,
        {
          info: { delegatedBy: delegatedBy.user.username },
        },
        { session: { type: sessionType } }
      );
      behalfOfSession.happn = this.happn.services.system.getDescription();
      this.cache_session_on_behalf_of.set(`${onBehalfOf}:${sessionType}`, behalfOfSession, {
        clone: false,
      });
      callback(null, behalfOfSession);
    });
  }

  getCorrectSession(message, callback) {
    if (
      !(
        message.request.options &&
        message.request.options.onBehalfOf &&
        message.request.options.onBehalfOf !== '_ADMIN'
      )
    )
      return callback(null, message.session);
    return this.getOnBehalfOfSession(
      message.session,
      message.request.options.onBehalfOf,
      message.session.type,
      callback
    );
  }

  getRelevantPaths(message, callback) {
    this.getCorrectSession(message, (e, session) => {
      if (e) callback(e);
      const authPath = message.request.path.replace(/^\/(?:REMOVE|SET|ALL)@/, '');
      this.checkpoint.listRelevantPermissions(session, authPath, message.request.action, callback);
    });
  }

  stop(options, callback) {
    if (typeof options === 'function') callback = options;

    //stop cache timers
    if (this.#locks) this.#locks.stop();
    if (this.cache_session_activity) this.cache_session_activity.stop();
    if (this.cache_revoked_tokens) this.cache_revoked_tokens.stop();
    if (this.cache_security_authentication_nonce) this.cache_security_authentication_nonce.stop();

    this.checkpoint.stop();
    this.#stopAuthProviders()
      .then(
        () => {
          this.log.info(`stopped auth providers`);
        },
        (e) => {
          this.log.warn(`error stopping auth providers: ${e.message}`);
        }
      )
      .finally(callback);
  }

  validateName(name, validationType) {
    if (!name) throw new this.errorService.ValidationError('names cannot be empty');

    if (
      this.utilsService.stringContainsAny(name, [
        '/',
        '_SYSTEM',
        '_GROUP',
        '_PERMISSION',
        '_USER_GROUP',
        '_ADMIN',
        '_ANONYMOUS',
      ])
    ) {
      throw new this.errorService.ValidationError(
        'validation error: ' +
          validationType +
          ' names cannot contain the special _SYSTEM, _GROUP, _PERMISSION, _USER_GROUP, _ADMIN, _ANONYMOUS segment or a forward slash /'
      );
    }
  }

  checkOverwrite(validationType, obj, path, name, options, callback) {
    if (!name) name = obj.name;
    if (options && options.overwrite === false)
      return this.dataService.get(path, {}, (e, result) => {
        if (e) return callback(e);
        if (result)
          return callback(
            new Error(
              'validation failure: ' + validationType + ' by the name ' + name + ' already exists'
            )
          );
        callback();
      });

    callback();
  }

  serializeAll(objectType, objArray, options) {
    if (!objArray) return [];
    return objArray.map((obj) => {
      return this.serialize(objectType, obj, options);
    });
  }

  serialize(objectType, obj, options) {
    //don't clone if clone is explicitly set to false
    let returnObj =
      options && options.clone === false ? obj.data : this.utilsService.clone(obj.data);

    returnObj._meta = obj._meta;

    if (objectType === 'user') {
      delete returnObj.password;
      delete returnObj._meta;
    }

    return returnObj;
  }
};
