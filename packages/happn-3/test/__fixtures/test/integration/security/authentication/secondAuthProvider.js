module.exports = function(ParentClass) {
  return class TestAuthProvider extends ParentClass {
    constructor(securityFacade, config) {
      super(securityFacade, config);
    }
    static create(securityFacade, config) {
      return new TestAuthProvider(securityFacade, config);
    }
    login(credentials, sessionId, request, callback) {
      return callback(null, 'Login called in second auth provider');
    }
  };
};
