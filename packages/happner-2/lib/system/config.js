let commons = require('happn-commons');

module.exports = Config;

function Config() {}

// we clone the configuration, to ensure that configs passed in do not come out with new properties
Config.prototype.process = function (mesh, config, callback) {
  this.log = mesh.log.createLogger('Config');
  this.log.$$TRACE('process()');
  const clonedConfig = commons._.cloneDeepWith(config, (value) => {
    if (value instanceof commons.directives.NotCloneable) {
      return value;
    }
    return commons._.clone(value);
  });
  // re-attach modules
  clonedConfig.modules = config.modules;

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
};
