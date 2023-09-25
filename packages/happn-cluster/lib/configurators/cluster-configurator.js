const commons = require('happn-commons');
const dface = require('dface');
const defaultName = require('../utils/default-name');
const Defaults = require('../constants/defaults');
const constants = require('../constants/all-constants');
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
    let membershipConfig = config.services.membership.config;

    membershipConfig.clusterName = clusterName;
    membershipConfig.serviceName = serviceName;
    membershipConfig.memberName = config.name || `${serviceName}-${commons.uuid.v4()}`;
    membershipConfig.messageBusType =
      membershipConfig.messageBusType || constants.MESSAGE_BUS_TYPES.KAFKA;
    membershipConfig.messageBus = membershipConfig.messageBus || {
      kafka: {
        clientId: membershipConfig.memberName,
        brokers: ['localhost:9092'],
      },
    };
    membershipConfig.replicationPaths = membershipConfig.replicationPaths || ['**'];
    membershipConfig.replicationPaths.push(
      constants.EVENT_KEYS.SYSTEM_CLUSTER_SECURITY_DIRECTORY_REPLICATE
    );
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
