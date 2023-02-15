import { HappnCoreBuilder } from '../builders/happn/happn-core-mixin';
import { HappnClusterCoreBuilder } from '../builders/happn-cluster/happn-cluster-core-mixin';
import { HappnClusterCoreBuilderV2 } from '../builders/happn-cluster/happn-cluster-core-mixin-v2';
import { HappnerCoreBuilder } from '../builders/happner/happner-core-mixin';
import { HappnerClusterCoreBuilder } from '../builders/happner-cluster/happner-cluster-core-mixin';
import { DataConfigBuilder } from '../builders/happn/services/data-config-builder';
import { ConnectConfigBuilder } from '../builders/happn/services/connect-config-builder';
import { ComponentsConfigBuilder } from '../builders/happner/components/components-config-builder';
import { CacheConfigBuilder } from '../builders/happn/services/cache-config-builder';
import { ModulesConfigBuilder } from '../builders/happner/modules/modules-config-builder';
import { EndpointsConfigBuilder } from '../builders/happner/endpoints/endpoints-config-builder';
import { TransportConfigBuilder } from '../builders/happn/services/transport-config-builder';
import { SystemConfigBuilder } from '../builders/happn/services/system-config-builder';
import { SubscriptionConfigBuilder } from '../builders/happn/services/subscription-config-builder';
import { SecurityConfigBuilder } from '../builders/happn/services/security-config-builder';
import { ReplicatorConfigBuilder } from '../builders/happn/services/replicator-config-builder';
import { PublisherConfigBuilder } from '../builders/happn/services/publisher-config-builder';
import { ProxyConfigBuilder } from '../builders/happn/services/proxy-config-builder';
import { ProtocolConfigBuilder } from '../builders/happn/services/protocol-config-builder';
import { MembershipConfigBuilder } from '../builders/happn/services/membership-config-builder';
import { HealthConfigBuilder } from '../builders/happn/services/health-config-builder';
import { OrchestratorConfigBuilder } from '../builders/happn/services/orchestrator-config-builder';
import { OrchestratorConfigBuilderV2 } from '../builders/happn/services/orchestrator-config-builder-2.0.0';

const versionMap = new Map<string, object>();

versionMap.set('HappnCore', { '1.0.0': HappnCoreBuilder });
versionMap.set('HappnClusterCore', {
  '1.0.0': HappnClusterCoreBuilder,
  '12.0.0': HappnClusterCoreBuilderV2,
});
versionMap.set('HappnerCore', { '1.0.0': HappnerCoreBuilder });
versionMap.set('HappnerClusterCore', { '1.0.0': HappnerClusterCoreBuilder });
versionMap.set('DataConfig', { '1.0.0': DataConfigBuilder });
versionMap.set('ConnectConfig', { '1.0.0': ConnectConfigBuilder });
versionMap.set('ComponentsConfig', { '1.0.0': ComponentsConfigBuilder });
versionMap.set('CacheConfig', { '1.0.0': CacheConfigBuilder });
versionMap.set('ModulesConfig', { '1.0.0': ModulesConfigBuilder });
versionMap.set('EndpointsConfig', { '1.0.0': EndpointsConfigBuilder });
versionMap.set('TransportConfig', { '1.0.0': TransportConfigBuilder });
versionMap.set('SystemConfig', { '1.0.0': SystemConfigBuilder });
versionMap.set('SubscriptionConfig', { '1.0.0': SubscriptionConfigBuilder });
versionMap.set('SecurityConfig', { '1.0.0': SecurityConfigBuilder });
versionMap.set('ReplicatorConfig', { '1.0.0': ReplicatorConfigBuilder });
versionMap.set('PublisherConfig', { '1.0.0': PublisherConfigBuilder });
versionMap.set('ProxyConfig', { '1.0.0': ProxyConfigBuilder });
versionMap.set('ProtocolConfig', { '1.0.0': ProtocolConfigBuilder });
versionMap.set('MembershipConfig', { '1.0.0': MembershipConfigBuilder });
versionMap.set('HealthConfig', { '1.0.0': HealthConfigBuilder });
versionMap.set('OrchestratorConfig', {
  '1.0.0': OrchestratorConfigBuilder,
  '12.0.0': OrchestratorConfigBuilderV2,
});

export default versionMap;
