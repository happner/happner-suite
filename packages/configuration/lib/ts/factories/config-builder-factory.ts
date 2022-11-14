import { HappnConfigurationBuilder } from '../builders/happn/happn-configuration-builder';
import { HappnClusterConfigurationBuilder } from '../builders/happn-cluster/happn-cluster-configuration-builder';

import { CacheConfigBuilder } from '../builders/happn/services/cache-config-builder';
import { ConnectConfigBuilder } from '../builders/happn/services/connect-config-builder';
import { DataConfigBuilder } from '../builders/happn/services/data-config-builder';
import { PublisherConfigBuilder } from '../builders/happn/services/publisher-config-builder';
import { ProtocolConfigBuilder } from '../builders/happn/services/protocol-config-builder';
import { SecurityConfigBuilder } from '../builders/happn/services/security-config-builder';
import { SubscriptionConfigBuilder } from '../builders/happn/services/subscription-config-builder';
import { SystemConfigBuilder } from '../builders/happn/services/system-config-builder';
import { TransportConfigBuilder } from '../builders/happn/services/transport-config-builder';
import { MembershipConfigBuilder } from '../builders/happn/services/membership-config-builder';
import { OrchestratorConfigBuilder } from '../builders/happn/services/orchestrator-config-builder';
import { ReplicatorConfigBuilder } from '../builders/happn/services/replicator-config-builder';
import { ProxyConfigBuilder } from '../builders/happn/services/proxy-config-builder';
import { HealthConfigBuilder } from '../builders/happn/services/health-config-builder';

import FieldTypeValidator from '../../validators/field-type-validator';
import { HappnerConfigurationBuilder } from '../builders/happner/happner-configuration-builder';
import { ComponentsConfigBuilder } from '../builders/happner/components/components-config-builder';
import { EndpointsConfigBuilder } from '../builders/happner/endpoints/endpoints-config-builder';
import { ModulesConfigBuilder } from '../builders/happner/modules/modules-config-builder';

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
