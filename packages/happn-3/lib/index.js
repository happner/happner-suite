const packager = require('./packager');

module.exports = {
  client: require('./client'),
  service: require('./service'),
  constants: require('./constants-builder'),
  packager,
  package: packager,
  protocol: packager.protocol,
  version: packager.version,
};
