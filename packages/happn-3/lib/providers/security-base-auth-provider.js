const SecurityAuthProviderFactory = require('../factories/security-auth-provider-factory');
const commons = require('happn-commons');
module.exports = class SecurityBaseAuthProvider {
  #securityFacade;
  #config;
  #options;
  #locks;
  constructor(securityFacade, happnConfig, providerOptions) {
    this.#securityFacade = securityFacade;
    this.#config = happnConfig || {};
    this.#options = this.defaults(commons._.clone(providerOptions || {}));

    if (!this.#config.accountLockout) {
      this.#config.accountLockout = {};
    }
    if (this.#config.accountLockout.enabled == null) {
      this.#config.accountLockout.enabled = true;
    }
    if (this.#config.accountLockout.enabled === true) {
      this.#locks = this.#securityFacade.cache.getOrCreate('security_account_lockout');
      if (!this.#config.accountLockout.attempts) {
        this.#config.accountLockout.attempts = 4;
      }
      if (!this.#config.accountLockout.retryInterval) {
        this.#config.accountLockout.retryInterval = 60 * 1000 * 10; //10 minutes
      }
    }
  }

  get securityFacade() {
    return this.#securityFacade;
  }

  get config() {
    return this.#config;
  }

  get options() {
    return this.#options;
  }

  get locks() {
    return this.#locks;
  }

  static create(providerConfig, securityFacade, happnConfig) {
    const providerPathOrInstance =
      providerConfig.provider != null ? providerConfig.provider : providerConfig;

    // we attach an instance directly to the config
    if (providerPathOrInstance instanceof SecurityBaseAuthProvider) {
      return providerPathOrInstance;
    }
    const options = providerConfig.options || {};
    // we attach a factory directly to the config
    if (providerPathOrInstance instanceof SecurityAuthProviderFactory) {
      return providerPathOrInstance.create(securityFacade, happnConfig, options);
    }

    // we are using a filepath
    let providerClass;
    try {
      providerClass = require(providerPathOrInstance);
    } catch (e) {
      throw new Error(`failed to resolve auth provider on path: ${providerPathOrInstance}`);
    }
    const providerInst = new providerClass(securityFacade, happnConfig, options);
    // we are using a filepath that points to a factory
    if (providerInst instanceof SecurityAuthProviderFactory) {
      return providerInst.create(securityFacade, happnConfig, options);
    }
    return providerInst;
  }

  accessDenied(errorMessage) {
    throw this.#securityFacade.error.AccessDeniedError(errorMessage);
  }

  invalidCredentials(errorMessage) {
    throw this.#securityFacade.error.InvalidCredentialsError(errorMessage);
  }

  systemError(errorMessage) {
    throw this.#securityFacade.error.SystemError(errorMessage);
  }

  async login(credentials, sessionId, request) {
    if (credentials.username === '_ANONYMOUS') {
      if (!this.#config.allowAnonymousAccess) {
        throw this.#securityFacade.error.InvalidCredentialsError('Anonymous access is disabled');
      }
      credentials.password = 'anonymous';
    }
    //default is a stateful login
    if (credentials.type == null) credentials.type = 1;

    if (
      !((credentials.username && (credentials.password || credentials.digest)) || credentials.token)
    ) {
      return this.invalidCredentials('Invalid credentials');
    }
    if (
      !this.#securityFacade.security.checkIPAddressWhitelistPolicy(credentials, sessionId, request)
    ) {
      return this.invalidCredentials('Source address access restricted');
    }
    if (
      this.#securityFacade.security.checkDisableDefaultAdminNetworkConnections(credentials, request)
    ) {
      return this.accessDenied('use of _ADMIN credentials over the network is disabled');
    }
    if (credentials.token) {
      return this.tokenLogin(credentials, sessionId, request);
    }

    return this.#userCredsLogin(credentials, sessionId);
  }

  async tokenLogin(credentials, sessionId, request) {
    let [authorized, reason] = this.#securityFacade.utils.coerceArray(
      await this.#securityFacade.security.checkRevocations(credentials)
    );

    if (!authorized) return this.accessDenied(reason);
    let previousSession = this.#securityFacade.security.decodeToken(credentials.token);
    if (previousSession == null) {
      return this.invalidCredentials('Invalid credentials: invalid session token');
    }

    if (previousSession.ttl > 0) {
      if (Date.now() - previousSession.timestamp > previousSession.ttl) {
        return this.invalidCredentials('Invalid credentials: token timed out');
      }
    }

    let errorMessage;
    if (previousSession && previousSession.type != null && this.#config.lockTokenToLoginType) {
      if (previousSession.type !== credentials.type) {
        errorMessage = `token was created using the login type ${previousSession.type}, which does not match how the new token is to be created`;
      }
    }
    if (
      this.#securityFacade.security.checkDisableDefaultAdminNetworkConnections(
        previousSession,
        request
      )
    ) {
      errorMessage = 'use of _ADMIN credentials over the network is disabled';
    }

    let previousPolicy = previousSession.policy[1]; //always the stateful policy

    if (previousPolicy.disallowTokenLogins) {
      errorMessage = `logins with this token are disallowed by policy`;
    }

    if (
      previousPolicy.lockTokenToOrigin &&
      previousSession.origin !== this.#securityFacade.system.name
    ) {
      errorMessage = `this token is locked to a different origin by policy`;
    }

    if (errorMessage) {
      return this.accessDenied(errorMessage);
    }

    //Anything further is dealt with in the specific provider
    return this.providerTokenLogin(credentials, previousSession, sessionId);
  }

  async providerTokenLogin() {
    return this.accessDenied('providerTokenLogin not implemented.');
  }

  async providerCredsLogin() {
    return this.accessDenied('providerCredsLogin not implemented.');
  }

  loginFailed(username, specificMessage, e, overrideLockout) {
    let message = 'Invalid credentials';
    if (specificMessage) message = specificMessage;

    if (e) {
      if (e.message) message = message + ': ' + e.message;
      else message = message + ': ' + e.toString();
    }

    if (this.#config.accountLockout && this.#config.accountLockout.enabled && !overrideLockout) {
      let currentLock = this.#locks.get(username);

      if (!currentLock) {
        currentLock = {
          attempts: 0,
        };
      }

      currentLock.attempts++;

      this.#locks.set(username, currentLock, {
        ttl: this.#config.accountLockout.retryInterval,
      });
    }

    return this.invalidCredentials(message);
  }

  loginOK(credentials, user, sessionId, tokenLogin, additionalInfo) {
    delete user.password;
    if (this.#locks) this.#locks.remove(user.username); //remove previous locks
    const session = this.#securityFacade.security.generateSession(
      user,
      sessionId,
      credentials,
      tokenLogin,
      additionalInfo
    );
    if (session == null) {
      throw new Error('session disconnected during login');
    }
    return session;
  }

  checkDisableDefaultAdminNetworkConnections(credentials, request) {
    return (
      credentials.username === '_ADMIN' &&
      this.#config.disableDefaultAdminNetworkConnections === true &&
      request &&
      request.data &&
      request.data.info &&
      request.data.info._local === false
    );
  }

  #userCredsLogin(credentials, sessionId) {
    if (this.#checkLockedOut(credentials.username)) {
      return this.accessDenied('Account locked out');
    }
    return this.providerCredsLogin(credentials, sessionId);
  }

  #checkLockedOut(username) {
    if (!username || !this.#config.accountLockout || !this.#config.accountLockout.enabled)
      return false;
    let existingLock = this.#locks.get(username);
    return existingLock != null && existingLock.attempts >= this.#config.accountLockout.attempts;
  }

  defaults(options) {
    return options;
  }
};
