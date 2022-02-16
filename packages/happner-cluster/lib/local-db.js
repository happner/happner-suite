module.exports.gotConfig = function (config) {
  if (!config.happn.services.data) return false;
  if (!config.happn.services.data.config) return false;
  if (!config.happn.services.data.config.datastores) return false;

  return config.happn.services.data.config.datastores.some(function (ds) {
    // use /nesh/schema to spot the nedb datastore
    if (ds.patterns && ds.patterns.indexOf('/mesh/schema/*') >= 0) {
      if (ds.patterns.indexOf('/_SYSTEM/_NETWORK/_SETTINGS/NAME') < 0) {
        ds.patterns.push('/_SYSTEM/_NETWORK/_SETTINGS/NAME');
      }
      return true;
    }
    return false;
  });
};

module.exports.addConfig = function (config) {
  config.happn.services.data = config.happn.services.data || {};
  config.happn.services.data.config = config.happn.services.data.config || {};
  config.happn.services.data.config.datastores = config.happn.services.data.config.datastores || [];
  config.happn.services.data.config.datastores.push({
    name: 'own-schema',
    patterns: ['/mesh/schema/*', '/_SYSTEM/_NETWORK/_SETTINGS/NAME'],
  });
};
