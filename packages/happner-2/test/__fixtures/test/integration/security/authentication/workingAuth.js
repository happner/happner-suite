module.exports = function(ParentClass) {
  return class TestAuthProvider extends ParentClass {
    constructor(securityFacade, config) {
      super(securityFacade, config);
    }

    static create(securityFacade, config) {
      return new TestAuthProvider(securityFacade, config);
    }
    providerCredsLogin(credentials, sessionId, callback) {      
        if (credentials.username === "secondTestuser@somewhere.com" && credentials.password === "secondPass") {        
          let user = {username: "secondTestuser@somewhere.com", groups: { _MESH_GST: { data: {} } }}
          return this.loginOK(credentials, user, sessionId, callback);
        }
        return this.loginFailed(credentials.username, 'Invalid credentials', null, callback);
      }
    providerTokenLogin(credentials, decodedToken, sessionId, callback) {      
      if (decodedToken.username === "secondTestuser@somewhere.com" && credentials.token != null) {        
        let user = {username: "secondTestuser@somewhere.com", groups: { _MESH_GST: { data: {} } }}
        return this.loginOK(credentials, user, sessionId, callback);
      }
      return this.loginFailed(credentials.username, 'Invalid credentials', null, callback);
    }
  }
};
