const commons = require('happn-commons');
module.exports = class SecurityAuthProviderFactory extends commons.directives.NotCloneable {
  create(securityFacade, config) {
    if (typeof this.createInternal !== 'function') {
      throw new Error(`Auth provider factory must implement the createInternal method`);
    }
    return this.createInternal(securityFacade, config);
  }
};
