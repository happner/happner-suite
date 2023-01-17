module.exports = class TestAuthProvider extends require('happn-3').providers.SecurityBaseAuthProvider {
  constructor(securityFacade, config) {
    super(securityFacade, config);
  }

  static create(securityFacade, config) {
    return new TestAuthProvider(securityFacade, config);
  }

  async providerCredsLogin(credentials, sessionId) {      
    if (credentials.username === "secondTestuser@somewhere.com" && credentials.password === "secondPass") {        
      let user = {username: "secondTestuser@somewhere.com",  groups: { _MESH_GST: { data: {} } }}
      return this.loginOK(credentials, user, sessionId);
    }
    return this.loginFailed(credentials.username, 'Invalid credentials');
  }

  async providerTokenLogin(credentials, decodedToken, sessionId) {      
    if (decodedToken.username === "secondTestuser@somewhere.com" && credentials.token != null) {        
      let user = {username: "secondTestuser@somewhere.com",  groups: { _MESH_GST: { data: {} } }}
      return this.loginOK(credentials, user, sessionId);
    }
    return this.loginFailed(credentials.username, 'Invalid credentials');
  }
};
