let clone = require('happn-commons')._.cloneDeep;

module.exports = Config;

function Config() {}

// we deep copy the configuration, then process various shortform leaves
// the deep copy ensures that configs passed in do not come out with new properties

Config.prototype.process = function (mesh, config, callback) {
  this.log = mesh.log.createLogger('Config');
  this.log.$$TRACE('process()');

  var clonedConfig = clone(config);
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
