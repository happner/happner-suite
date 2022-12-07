module.exports = class AuthProvider {
  #securityFacade;
  #config;
  #locks;
  constructor(securityFacade, config) {
    this.#securityFacade = securityFacade;
    this.#config = config || {};
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

  get locks() {
    return this.#locks;
  }

  static create(providerPath, securityFacade, config) {
    let providerFactory = AuthProvider.#resolveProvider(providerPath);
    return providerFactory.create(securityFacade, config);
  }

  static #resolveProvider(providerPath) {
    let providerClass;
    try {
      providerClass = require(providerPath);
    } catch (e) {
      throw new Error(`failed to resolve auth provider on path: ${providerPath}`);
    }
    return providerClass(AuthProvider);
  }

  accessDenied(errorMessage, callback) {
    return callback(this.#securityFacade.error.AccessDeniedError(errorMessage));
  }

  invalidCredentials(errorMessage, callback) {
    return callback(this.#securityFacade.error.InvalidCredentialsError(errorMessage));
  }

  systemError(errorMessage, callback) {
    return callback(this.#securityFacade.error.SystemError(errorMessage));
  }

  login(credentials, sessionId, request, callback) {
    if (typeof sessionId === 'function') {
      callback = sessionId;
      sessionId = null;
    }

    if (credentials.username === '_ANONYMOUS') {
      if (!this.#config.allowAnonymousAccess) {
        return callback(
          this.#securityFacade.error.InvalidCredentialsError('Anonymous access is disabled')
        );
      }
      credentials.password = 'anonymous';
    }
    //default is a stateful login
    if (credentials.type == null) credentials.type = 1;

    if (
      !((credentials.username && (credentials.password || credentials.digest)) || credentials.token)
    ) {
      return this.invalidCredentials('Invalid credentials', callback);
    }
    if (
      !this.#securityFacade.security.checkIPAddressWhitelistPolicy(credentials, sessionId, request)
    ) {
      return this.invalidCredentials('Source address access restricted', callback);
    }
    if (
      this.#securityFacade.security.checkDisableDefaultAdminNetworkConnections(credentials, request)
    ) {
      return this.accessDenied('use of _ADMIN credentials over the network is disabled', callback);
    }
    if (credentials.token) {
      return this.tokenLogin(credentials, sessionId, request, callback);
    }

    this.#userCredsLogin(credentials, sessionId, callback);
  }

  async tokenLogin(credentials, sessionId, request, callback) {
    let username;
    try {
      let [authorized, reason] = this.#securityFacade.utils.coerceArray(
        await this.#securityFacade.security.checkRevocations(credentials.token)
      );

      if (!authorized) return this.accessDenied(reason, callback);
      let previousSession = this.#securityFacade.security.decodeToken(credentials.token);
      if (previousSession == null) {
        return this.invalidCredentials('Invalid credentials: invalid session token', callback);
      }
      username = previousSession.username;

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
        return this.accessDenied(errorMessage, callback);
      }

      //Anything further is dealt with in the specific provider
      return this.providerTokenLogin(credentials, previousSession, sessionId, callback);
    } catch (e) {
      return this.loginFailed(username, 'Invalid credentials', e, callback);
    }
  }

  providerTokenLogin(_username, _credentials, callback) {
    return this.accessDenied('providerTokenLogin not implemented.', callback);
  }

  providerCredsLogin(_credentials, _sessionId, callback) {
    return this.accessDenied('providerCredsLogin not implemented.', callback);
  }

  loginFailed(username, specificMessage, e, callback, overrideLockout) {
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

    return this.invalidCredentials(message, callback);
  }

  loginOK(credentials, user, sessionId, callback, tokenLogin, additionalInfo) {
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
      return callback(new Error('session disconnected during login'));
    }
    callback(null, session);
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

  #userCredsLogin(credentials, sessionId, callback) {
    if (this.#checkLockedOut(credentials.username)) {
      return this.accessDenied('Account locked out', callback);
    }
    return this.providerCredsLogin(credentials, sessionId, callback);
  }

  #checkLockedOut(username) {
    if (!username || !this.#config.accountLockout || !this.#config.accountLockout.enabled)
      return false;
    let existingLock = this.#locks.get(username);
    return existingLock != null && existingLock.attempts >= this.#config.accountLockout.attempts;
  }
};
