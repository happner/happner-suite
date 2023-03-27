const commons = require('happn-commons');
const dface = require('dface');
const defaultName = require('../utils/default-name');
const Defaults = require('../constants/defaults');
module.exports = class ClusterConfigurator extends require('./base-configurator') {
  constructor() {
    super();
  }
  static create() {
    return new ClusterConfigurator();
  }
  configure(definedConfig) {
    const config = this.commons._.defaultsDeep({}, definedConfig, this.getDefaultConfig());
    if (!config.services.membership.config.deploymentId) {
      throw new Error(`services.membership.config.deploymentId not set`);
    }
    config.host = dface(config.host);
    config.name = defaultName(config);
    const serviceName =
      definedConfig?.services?.membership?.config?.serviceName || Defaults.SERVICE_NAME;
    const clusterName =
      definedConfig?.services?.membership?.config?.clusterName || Defaults.CLUSTER_NAME;
    config.services.membership.config.clusterName = clusterName;
    config.services.membership.config.serviceName = serviceName;
    config.services.membership.config.memberName =
      config.name || `${serviceName}-${commons.uuid.v4()}`;
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
        membership: {
          config: {},
        },
      },
    };
  }
};
