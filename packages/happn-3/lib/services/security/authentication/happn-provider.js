let AuthProvider = require('./base-provider');
module.exports = class HappnAuthProvider extends AuthProvider {
  constructor(securityFacade, config) {
    // sets securityFacade, config on super, becomes available via getters as this.securityFacade, this.config
    super(securityFacade, config);
  }

  static create(securityFacade, config) {
    return new HappnAuthProvider(securityFacade, config);
  }

  async providerTokenLogin(credentials, decodedToken, sessionId, callback) {
    try {
      let ok = await this.securityFacade.security.checkTokenUserId(decodedToken);
      if (!ok) {
        return this.accessDenied(
          `token userid does not match userid for username: ${decodedToken.username}`,
          callback
        );
      }

      let [authorized, reason] = this.securityFacade.utils.coerceArray(
        await this.securityFacade.security.authorize(decodedToken, null, 'login')
      );

      if (!authorized) return this.invalidCredentials(reason, callback);
      let user = await this.securityFacade.users.getUser(decodedToken.username);
      if (user == null) return this.invalidCredentials('Invalid credentials', callback);

      return this.loginOK(credentials, user, sessionId, callback, {
        session: decodedToken,
        token: credentials.token,
      });
    } catch (e) {
      this.securityFacade.log.error(`token login failure: ${e.message}`, e);
      return this.systemError('token login failure', callback);
    }
  }

  #digestLogin(user, credentials, sessionId, callback) {
    if (user.publicKey !== credentials.publicKey)
      return this.loginFailed(credentials.username, 'Invalid credentials', null, callback);

    return this.securityFacade.security.verifyAuthenticationDigest(credentials, (e, valid) => {
      if (e) return callback(e);

      if (!valid) {
        return this.loginFailed(credentials.username, 'Invalid credentials', null, callback);
      }

      return this.loginOK(credentials, user, sessionId, callback);
    });
  }

  providerCredsLogin(credentials, sessionId, callback) {
    return this.securityFacade.users.getUser(credentials.username, (e, user) => {
      if (e) return callback(e);

      if (user == null) {
        return this.loginFailed(credentials.username, 'Invalid credentials', null, callback);
      }

      if (credentials.digest) return this.#digestLogin(user, credentials, sessionId, callback);

      return this.securityFacade.users.getPasswordHash(credentials.username, (e, hash) => {
        if (e) {
          if (e.toString() === 'Error: ' + credentials.username + ' does not exist in the system')
            return this.loginFailed(credentials.username, 'Invalid credentials', null, callback);
          return callback(e);
        }
        this.securityFacade.security.matchPassword(credentials.password, hash, (e, match) => {
          if (e) return callback(e);
          if (!match) {
            return this.loginFailed(credentials.username, 'Invalid credentials', null, callback);
          }
          return this.loginOK(credentials, user, sessionId, callback);
        });
      });
    });
  }
};
