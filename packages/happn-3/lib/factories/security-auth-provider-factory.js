module.exports = class SecurityAuthProviderFactory {
  create(securityFacade, config) {
    if (typeof this.createInternal !== 'function') {
      throw new Error(`Auth provider factory must implement the createInternal method`);
    }
    return this.createInternal(securityFacade, config);
  }
};
