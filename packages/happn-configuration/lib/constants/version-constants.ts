import {
  HappnCoreBuilder,
  HappnClusterCoreBuilder,
  HappnClusterCoreBuilderV2,
  HappnerCoreBuilder,
  HappnerClusterCoreBuilder,
  DataConfigBuilder,
  ConnectConfigBuilder,
  ComponentsConfigBuilder,
  CacheConfigBuilder,
  ModulesConfigBuilder,
  EndpointsConfigBuilder,
  TransportConfigBuilder,
  SystemConfigBuilder,
  SubscriptionConfigBuilder,
  SecurityConfigBuilder,
  ReplicatorConfigBuilder,
  PublisherConfigBuilder,
  ProxyConfigBuilder,
  ProtocolConfigBuilder,
  MembershipConfigBuilder,
  HealthConfigBuilder,
  OrchestratorConfigBuilderV2,
  OrchestratorConfigBuilder,
} from '../builders/builders';

/*
These constants are used by the builder-factory to retrieve the correct builders based on an incoming
framework version (happn, happn-cluster, happner or happner-cluster).
Modules are matched based on the highest version match to the incoming framework version
 */
export default {
  VERSION_THRESHOLDS: {
    HappnCore: { '1.0.0': HappnCoreBuilder },
    HappnClusterCore: { '1.0.0': HappnClusterCoreBuilder, '12.0.0': HappnClusterCoreBuilderV2 },
    HappnerCore: { '1.0.0': HappnerCoreBuilder },
    HappnerClusterCore: { '1.0.0': HappnerClusterCoreBuilder },
    DataConfig: { '1.0.0': DataConfigBuilder },
    ConnectConfig: { '1.0.0': ConnectConfigBuilder },
    ComponentsConfig: { '1.0.0': ComponentsConfigBuilder },
    CacheConfig: { '1.0.0': CacheConfigBuilder },
    ModulesConfig: { '1.0.0': ModulesConfigBuilder },
    EndpointsConfig: { '1.0.0': EndpointsConfigBuilder },
    TransportConfig: { '1.0.0': TransportConfigBuilder },
    SystemConfig: { '1.0.0': SystemConfigBuilder },
    SubscriptionConfig: { '1.0.0': SubscriptionConfigBuilder },
    SecurityConfig: { '1.0.0': SecurityConfigBuilder },
    ReplicatorConfig: { '1.0.0': ReplicatorConfigBuilder },
    PublisherConfig: { '1.0.0': PublisherConfigBuilder },
    ProxyConfig: { '1.0.0': ProxyConfigBuilder },
    ProtocolConfig: { '1.0.0': ProtocolConfigBuilder },
    MembershipConfig: { '1.0.0': MembershipConfigBuilder },
    HealthConfig: { '1.0.0': HealthConfigBuilder },
    OrchestratorConfig: {
      '1.0.0': OrchestratorConfigBuilder,
      '12.0.0': OrchestratorConfigBuilderV2,
    },
  },
};
