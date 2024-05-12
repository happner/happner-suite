const commons = require('happn-commons');
const dface = require('dface');
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
    let definedServiceConfig = definedConfig?.services?.membership?.config;

    const serviceName = definedServiceConfig?.serviceName || Defaults.SERVICE_NAME;
    const clusterName = definedServiceConfig?.clusterName || Defaults.CLUSTER_NAME;
    const memberName =
      definedConfig?.name ||
      definedServiceConfig?.memberName ||
      `${serviceName}-${commons.uuid.v4()}`;

    config.name = memberName;
    config.services.membership.config.clusterName = clusterName;
    config.services.membership.config.serviceName = serviceName;
    config.services.membership.config.memberName = memberName;

    return config;
  }
  getDefaultConfig() {
    return {
      port: 55000,
      transport: {
        mode: 'http',
      },
      services: {
        proxy: {},
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
