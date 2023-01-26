module.exports = class TestAuthProvider extends require('../../../../../..').providers.SecurityBaseAuthProvider {
  constructor(securityFacade, happnConfig, providerOptions) {
    super(securityFacade, happnConfig, providerOptions);
  }

  static create(securityFacade, config, providerOptions) {
    return new TestAuthProvider(securityFacade, config, providerOptions);
  }

  async providerCredsLogin(credentials, sessionId) {      
    if (credentials.username === "secondTestuser@somewhere.com" && credentials.password === "secondPass") {        
      let user = {username: "secondTestuser@somewhere.com", groups:[]}
      return this.loginOK(credentials, user, sessionId);
    }
    return this.loginFailed(credentials.username, 'Invalid credentials');
  }

  async providerTokenLogin(credentials, decodedToken, sessionId) {      
    if (decodedToken.username === "secondTestuser@somewhere.com" && credentials.token != null) {        
      let user = {username: "secondTestuser@somewhere.com", groups:[]}
      return this.loginOK(credentials, user, sessionId);
    }
    return this.loginFailed(credentials.username, 'Invalid credentials');
  }

  defaults(options) {
    return {
      test: (options?.test || 0) + 1,
    }
  }
};
