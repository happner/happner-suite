const packager = require('./packager');

module.exports = {
  client: require('./client'),
  service: require('./service'),
  constants: require('./constants-builder'),
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
