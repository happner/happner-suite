module.exports = class SecondAuthProvider extends require('../../../../../..').providers.SecurityBaseAuthProvider {
  constructor(securityFacade, config) {
    super(securityFacade, config);
  }
  static create(securityFacade, config) {
    return new SecondAuthProvider(securityFacade, config);
  }
  async login() {
    return 'Login called in second auth provider';
  }
};