const dface = require('dface');
const defaultName = require('../utils/default-name');
module.exports = class ClusterConfigurator extends require('./base-configurator') {
  constructor() {
    super();
  }
  static create() {
    return new ClusterConfigurator();
  }
  configure(definedConfig) {
    const config = this.commons._.defaultsDeep({}, definedConfig, this.getDefaultConfig());
    config.host = dface(config.host);
    config.name = defaultName(config);
    return config;
  }
  getDefaultConfig() {
    return {
      port: 57000,
      transport: {
        mode: 'http',
      },
      services: {
        data: {
          config: {
            datastores: [],
          },
        },
      },
    };
  }
};
