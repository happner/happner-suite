import { HappnConfigurationBuilder } from './happn-configuration-builder';
import { HappnClusterConfigurationBuilder } from './happn-cluster-configuration-builder';

import HappnConfigBuilder = require('../builders/happn-config-builder');
import CacheConfigBuilder = require('../builders/services/cache-config-builder');
import ConnectConfigBuilder = require('../builders/services/connect-config-builder');
import DataConfigBuilder = require('../builders/services/data-config-builder');
import HealthConfigBuilder = require('../builders/services/health-config-builder');
import ProtocolConfigBuilder = require('../builders/services/protocol-config-builder');
import PublisherConfigBuilder = require('../builders/services/publisher-config-builder');
import SecurityConfigBuilder = require('../builders/services/security-config-builder');
import SubscriptionConfigBuilder = require('../builders/services/subscription-config-builder');
import SystemConfigBuilder = require('../builders/services/system-config-builder');
import TransportConfigBuilder = require('../builders/services/transport-config-builder');
import HappnClusterConfigBuilder = require('../builders/happn-cluster-config-builder');
import MembershipConfigBuilder = require('../builders/services/membership-config-builder');
import OrchestratorConfigBuilder = require('../builders/services/orchestrator-config-builder');
import ProxyConfigBuilder = require('../builders/services/proxy-config-builder');
import ReplicatorConfigBuilder = require('../builders/services/replicator-config-builder');
import FieldTypeValidator = require('../validators/field-type-validator');

const BUILDER_TYPE = {
  HAPPN: 'happn',
  HAPPN_CLUSTER: 'happn-cluster',
  HAPPNER: 'happner',
  HAPPNER_CLUSTER: 'happner-cluster',
};

export class ConfigBuilderFactory {
  static getBuilder(type: string) {
    switch (type) {
      case BUILDER_TYPE.HAPPN:
        return new HappnConfigurationBuilder(
          new HappnConfigBuilder(),
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
          new HappnConfigBuilder(),
          new CacheConfigBuilder(),
          new ConnectConfigBuilder(),
          new DataConfigBuilder(),
          new ProtocolConfigBuilder(new FieldTypeValidator()),
          new PublisherConfigBuilder(),
          new SecurityConfigBuilder(),
          new SubscriptionConfigBuilder(),
          new SystemConfigBuilder(),
          new TransportConfigBuilder(),
          new HappnClusterConfigBuilder(),
          new HealthConfigBuilder(),
          new MembershipConfigBuilder(),
          new OrchestratorConfigBuilder(),
          new ProxyConfigBuilder(),
          new ReplicatorConfigBuilder()
        );
    }
  }
}
