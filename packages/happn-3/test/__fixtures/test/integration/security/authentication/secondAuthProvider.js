module.exports = function(ParentClass) {
  return class SecondAuthProvider extends ParentClass {
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
};
