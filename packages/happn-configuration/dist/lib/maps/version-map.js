"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const happn_core_mixin_1 = require("../builders/happn/happn-core-mixin");
const happn_cluster_core_mixin_1 = require("../builders/happn-cluster/happn-cluster-core-mixin");
const happner_core_mixin_1 = require("../builders/happner/happner-core-mixin");
const happner_cluster_core_mixin_1 = require("../builders/happner-cluster/happner-cluster-core-mixin");
const data_config_builder_1 = require("../builders/happn/services/data-config-builder");
const connect_config_builder_1 = require("../builders/happn/services/connect-config-builder");
const components_config_builder_1 = require("../builders/happner/components/components-config-builder");
const cache_config_builder_1 = require("../builders/happn/services/cache-config-builder");
const modules_config_builder_1 = require("../builders/happner/modules/modules-config-builder");
const endpoints_config_builder_1 = require("../builders/happner/endpoints/endpoints-config-builder");
const transport_config_builder_1 = require("../builders/happn/services/transport-config-builder");
const system_config_builder_1 = require("../builders/happn/services/system-config-builder");
const subscription_config_builder_1 = require("../builders/happn/services/subscription-config-builder");
const security_config_builder_1 = require("../builders/happn/services/security-config-builder");
const replicator_config_builder_1 = require("../builders/happn/services/replicator-config-builder");
const publisher_config_builder_1 = require("../builders/happn/services/publisher-config-builder");
const proxy_config_builder_1 = require("../builders/happn/services/proxy-config-builder");
const protocol_config_builder_1 = require("../builders/happn/services/protocol-config-builder");
const membership_config_builder_1 = require("../builders/happn/services/membership-config-builder");
const health_config_builder_1 = require("../builders/happn/services/health-config-builder");
const orchestrator_config_builder_1 = require("../builders/happn/services/orchestrator-config-builder");
const versionMap = new Map();
versionMap.set('HappnCore', { '1.0.0': happn_core_mixin_1.HappnCoreBuilder });
versionMap.set('HappnClusterCore', {
    '1.0.0': happn_cluster_core_mixin_1.HappnClusterCoreBuilder,
    '12.0.0': happn_cluster_core_mixin_1.HappnClusterCoreBuilder,
});
versionMap.set('HappnerCore', { '1.0.0': happner_core_mixin_1.HappnerCoreBuilder });
versionMap.set('HappnerClusterCore', { '1.0.0': happner_cluster_core_mixin_1.HappnerClusterCoreBuilder });
versionMap.set('DataConfig', { '1.0.0': data_config_builder_1.DataConfigBuilder });
versionMap.set('ConnectConfig', { '1.0.0': connect_config_builder_1.ConnectConfigBuilder });
versionMap.set('ComponentsConfig', { '1.0.0': components_config_builder_1.ComponentsConfigBuilder });
versionMap.set('CacheConfig', { '1.0.0': cache_config_builder_1.CacheConfigBuilder });
versionMap.set('ModulesConfig', { '1.0.0': modules_config_builder_1.ModulesConfigBuilder });
versionMap.set('EndpointsConfig', { '1.0.0': endpoints_config_builder_1.EndpointsConfigBuilder });
versionMap.set('TransportConfig', { '1.0.0': transport_config_builder_1.TransportConfigBuilder });
versionMap.set('SystemConfig', { '1.0.0': system_config_builder_1.SystemConfigBuilder });
versionMap.set('SubscriptionConfig', { '1.0.0': subscription_config_builder_1.SubscriptionConfigBuilder });
versionMap.set('SecurityConfig', { '1.0.0': security_config_builder_1.SecurityConfigBuilder });
versionMap.set('ReplicatorConfig', { '1.0.0': replicator_config_builder_1.ReplicatorConfigBuilder });
versionMap.set('PublisherConfig', { '1.0.0': publisher_config_builder_1.PublisherConfigBuilder });
versionMap.set('ProxyConfig', { '1.0.0': proxy_config_builder_1.ProxyConfigBuilder });
versionMap.set('ProtocolConfig', { '1.0.0': protocol_config_builder_1.ProtocolConfigBuilder });
versionMap.set('MembershipConfig', { '1.0.0': membership_config_builder_1.MembershipConfigBuilder });
versionMap.set('HealthConfig', { '1.0.0': health_config_builder_1.HealthConfigBuilder });
versionMap.set('OrchestratorConfig', {
    '1.0.0': orchestrator_config_builder_1.OrchestratorConfigBuilder,
    '12.0.0': orchestrator_config_builder_1.OrchestratorConfigBuilder,
});
exports.default = versionMap;
