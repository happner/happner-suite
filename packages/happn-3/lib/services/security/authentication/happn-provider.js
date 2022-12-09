let AuthProvider = require('./base-provider');
module.exports = class HappnAuthProvider extends AuthProvider {
  constructor(securityFacade, config) {
    // sets securityFacade, config on super, becomes available via getters as this.securityFacade, this.config
    super(securityFacade, config);
  }

  static create(securityFacade, config) {
    return new HappnAuthProvider(securityFacade, config);
  }

  async providerTokenLogin(credentials, decodedToken, sessionId) {
    let ok = await this.securityFacade.security.checkTokenUserId(decodedToken);
    if (!ok) {
      return this.accessDenied(
        `token userid does not match userid for username: ${decodedToken.username}`
      );
    }

    let [authorized, reason] = this.securityFacade.utils.coerceArray(
      await this.securityFacade.security.authorize(decodedToken, null, 'login')
    );

    if (!authorized) return this.invalidCredentials(reason);
    let user = await this.securityFacade.users.getUser(decodedToken.username);
    if (user == null) return this.invalidCredentials('Invalid credentials');

    return this.loginOK(credentials, user, sessionId, {
      session: decodedToken,
      token: credentials.token,
    });
  }

  async #digestLogin(user, credentials, sessionId) {
    if (user.publicKey !== credentials.publicKey)
      return this.loginFailed(credentials.username, 'Invalid credentials', null);

    if ((await this.securityFacade.security.verifyAuthenticationDigest(credentials)) !== true) {
      return this.loginFailed(credentials.username, 'Invalid credentials', null);
    }
    return this.loginOK(credentials, user, sessionId);
  }

  async providerCredsLogin(credentials, sessionId) {
    try {
      const user = await this.securityFacade.users.getUser(credentials.username);
      if (user == null) {
        return this.loginFailed(credentials.username, 'Invalid credentials');
      }
      if (credentials.digest) return this.#digestLogin(user, credentials, sessionId);
      const hash = await this.securityFacade.users.getPasswordHash(credentials.username);
      // eslint-disable-next-line eqeqeq
      if (!(await this.securityFacade.security.matchPassword(credentials.password, hash))) {
        return this.loginFailed(credentials.username, 'Invalid credentials');
      }
      return this.loginOK(credentials, user, sessionId);
    } catch (e) {
      if (e.toString() === 'Error: ' + credentials.username + ' does not exist in the system')
        return this.loginFailed(credentials.username, 'Invalid credentials');
      throw e;
    }
  }
};
