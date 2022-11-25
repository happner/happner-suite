module.exports = function(ParentClass) {
  return class TestAuthProvider extends ParentClass {
    constructor(happn, config) {
      super(happn, config);
    }
    static create(happn, config) {
      return new TestAuthProvider(happn, config);
    }
    login(credentials, sessionId, request, callback) {
      return callback(null, 'Login called in second auth provider');
    }
  };
};
