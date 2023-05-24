let SecurityBaseAuthProvider = require('./security-base-auth-provider');
module.exports = class HappnAuthProvider extends SecurityBaseAuthProvider {
  constructor(securityFacade, happnConfig, providerOptions) {
    // sets securityFacade, config on super, becomes available via getters as this.securityFacade, this.config
    super(securityFacade, happnConfig, providerOptions);
  }

  static create(securityFacade, happnConfig, providerOptions) {
    return new HappnAuthProvider(securityFacade, happnConfig, providerOptions);
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
  }

  async providerChangePassword(credentials, passwordDetails) {
    if (credentials.username === '_ANONYMOUS' || credentials.username === '_ADMIN') {
      return this.systemError(`updates to the ${credentials.username} user are forbidden`);
    }

    const user = await this.securityFacade.users.getUser(credentials.username);
    if (user == null) {
      return this.systemError(`bad username: ${credentials.username}`);
    }
    if (!passwordDetails?.oldPassword || !passwordDetails?.newPassword) {
      return this.systemError('Invalid parameters: oldPassword and newPassword required');
    }
    const hash = await this.securityFacade.users.getPasswordHash(credentials.username);
    if (!(await this.securityFacade.security.matchPassword(passwordDetails.oldPassword, hash))) {
      return this.systemError(`Invalid old password`);
    }
    user.password = passwordDetails.newPassword;
    return this.securityFacade.users.upsertUser(user);
  }
};
