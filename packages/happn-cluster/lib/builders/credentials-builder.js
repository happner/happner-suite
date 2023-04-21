const BaseBuilder = require('happn-commons').BaseBuilder;
module.exports = class CredentialsBuilder extends BaseBuilder {
  constructor() {
    super();
    this.set('username', '_ADMIN', CredentialsBuilder.Types.STRING);
    this.set('password', 'happn', CredentialsBuilder.Types.STRING);
  }
  static create() {
    return new CredentialsBuilder();
  }
  build() {
    return super.build(require('../objects/credentials-object').create());
  }
  withUsername(username) {
    return this.set('username', username, CredentialsBuilder.Types.STRING);
  }
  withPassword(password) {
    return this.set('password', password, CredentialsBuilder.Types.STRING);
  }
  withPublicKey(publicKey) {
    return this.set('publicKey', publicKey, CredentialsBuilder.Types.STRING);
  }
  withPrivateKey(privateKey) {
    return this.set('privateKey', privateKey, CredentialsBuilder.Types.STRING);
  }
};
