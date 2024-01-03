const packager = require('./packager');
const commons = require('happn-commons');

module.exports = {
  client: require('./client'),
  service: require('./service'),
  constants: commons.constants,
  packager,
  package: packager,
  protocol: packager.protocol,
  version: packager.version,
  factories: {
    SecurityAuthProviderFactory: require('./factories/security-auth-provider-factory'),
  },
  providers: {
    SecurityBaseAuthProvider: require('./providers/security-base-auth-provider'),
  },
};
