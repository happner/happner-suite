module.exports = class SecurityAuthProviderFactory {
  create(securityFacade, happnConfig, options) {
    if (typeof this.createAuthProvider !== 'function') {
      throw new Error(`Auth provider factory must implement the createAuthProvider method`);
    }
    return this.createAuthProvider(securityFacade, happnConfig, options);
  }
};
