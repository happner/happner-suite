let commons = require('happn-commons');

module.exports = Config;

function Config() {}

// we clone the configuration, to ensure that configs passed in do not come out with new properties
Config.prototype.process = function (mesh, config, callback) {
  try {
    this.log = mesh.log.createLogger('Config');
    this.log.$$TRACE('process()');
    const clonedConfig = commons.clone(config, [
      'modules',
      'services.security.config.authProviders',
      'happn.services.security.config.authProviders',
      'plugins',
    ]);
    // process shortform endpoints
    Object.keys(clonedConfig.endpoints || {}).forEach(function (name) {
      var econf = clonedConfig.endpoints[name];
      if (!isNaN(parseInt(econf))) {
        clonedConfig.endpoints[name] = {
          clonedConfig: {
            port: parseInt(econf),
          },
        };
      } else if (typeof econf === 'string') {
        var pp = econf.split(':');
        clonedConfig.endpoints[name] = {
          clonedConfig: {
            host: pp[0].trim(),
            port: parseInt(pp[1].trim()),
          },
        };
      }
    });

    clonedConfig.endpoints = clonedConfig.endpoints || {};
    callback(null, clonedConfig);
  } catch (e) {
    callback(e);
  }
};
