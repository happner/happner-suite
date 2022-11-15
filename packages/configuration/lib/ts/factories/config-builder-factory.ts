import { HappnConfigurationBuilder } from '../builders/happn/happn-configuration-builder.js';
import { HappnClusterConfigurationBuilder } from '../builders/happn-cluster/happn-cluster-configuration-builder.js';

import { CacheConfigBuilder } from '../builders/happn/services/cache-config-builder.js';
import { ConnectConfigBuilder } from '../builders/happn/services/connect-config-builder.js';
import { DataConfigBuilder } from '../builders/happn/services/data-config-builder.js';
import { PublisherConfigBuilder } from '../builders/happn/services/publisher-config-builder.js';
import { ProtocolConfigBuilder } from '../builders/happn/services/protocol-config-builder.js';
import { SecurityConfigBuilder } from '../builders/happn/services/security-config-builder.js';
import { SubscriptionConfigBuilder } from '../builders/happn/services/subscription-config-builder.js';
import { SystemConfigBuilder } from '../builders/happn/services/system-config-builder.js';
import { TransportConfigBuilder } from '../builders/happn/services/transport-config-builder.js';
import { MembershipConfigBuilder } from '../builders/happn/services/membership-config-builder.js';
import { OrchestratorConfigBuilder } from '../builders/happn/services/orchestrator-config-builder.js';
import { ReplicatorConfigBuilder } from '../builders/happn/services/replicator-config-builder.js';
import { ProxyConfigBuilder } from '../builders/happn/services/proxy-config-builder.js';
import { HealthConfigBuilder } from '../builders/happn/services/health-config-builder.js';

import { FieldTypeValidator } from '../validators/field-type-validator.js';
import { HappnerConfigurationBuilder } from '../builders/happner/happner-configuration-builder.js';
import { ComponentsConfigBuilder } from '../builders/happner/components/components-config-builder.js';
import { EndpointsConfigBuilder } from '../builders/happner/endpoints/endpoints-config-builder.js';
import { ModulesConfigBuilder } from '../builders/happner/modules/modules-config-builder.js';

const BUILDER_TYPE = require('../../constants/builder-constants');

export class ConfigBuilderFactory {
  static getBuilder(type: string) {
    switch (type) {
      case BUILDER_TYPE.HAPPN:
        return new HappnConfigurationBuilder(
          new CacheConfigBuilder(),
          new ConnectConfigBuilder(),
          new DataConfigBuilder(),
          new ProtocolConfigBuilder(new FieldTypeValidator()),
          new PublisherConfigBuilder(),
          new SecurityConfigBuilder(),
          new SubscriptionConfigBuilder(),
          new SystemConfigBuilder(),
          new TransportConfigBuilder()
        );
      case BUILDER_TYPE.HAPPN_CLUSTER:
        return new HappnClusterConfigurationBuilder(
          new CacheConfigBuilder(),
          new ConnectConfigBuilder(),
          new DataConfigBuilder(),
          new ProtocolConfigBuilder(new FieldTypeValidator()),
          new PublisherConfigBuilder(),
          new SecurityConfigBuilder(),
          new SubscriptionConfigBuilder(),
          new SystemConfigBuilder(),
          new TransportConfigBuilder(),
          new HealthConfigBuilder(),
          new MembershipConfigBuilder(),
          new OrchestratorConfigBuilder(),
          new ProxyConfigBuilder(),
          new ReplicatorConfigBuilder()
        );
      case BUILDER_TYPE.HAPPNER:
        return new HappnerConfigurationBuilder(
          new CacheConfigBuilder(),
          new ConnectConfigBuilder(),
          new DataConfigBuilder(),
          new ProtocolConfigBuilder(new FieldTypeValidator()),
          new PublisherConfigBuilder(),
          new SecurityConfigBuilder(),
          new SubscriptionConfigBuilder(),
          new SystemConfigBuilder(),
          new TransportConfigBuilder(),
          new ComponentsConfigBuilder(),
          new EndpointsConfigBuilder(),
          new ModulesConfigBuilder()
        );
      default:
        return null;
    }
  }
}
