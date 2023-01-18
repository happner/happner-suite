/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

import BuilderConstants from '../constants/builder-constants';
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
import { FieldTypeValidator } from '../validators/field-type-validator';
import { ComponentsConfigBuilder } from '../builders/happner/components/components-config-builder';
import { EndpointsConfigBuilder } from '../builders/happner/endpoints/endpoints-config-builder';
import { ModulesConfigBuilder } from '../builders/happner/modules/modules-config-builder';
// mixin specific imports
import { HappnCoreBuilder } from '../builders/happn/happn-core-mixin';
import { HappnClusterCoreBuilder } from '../builders/happn-cluster/happn-cluster-core-mixin';
import { HappnerCoreBuilder } from '../builders/happner/happner-core-mixin';
import { HappnerClusterCoreBuilder } from '../builders/happner-cluster/happner-cluster-core-mixin';

const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = BuilderConstants;

// core class used for mixins...
const BaseClz = class BaseClz extends BaseBuilder {
  #builderType;

  constructor(...args: any[]) {
    super(...args);
  }

  set builderType(type) {
    this.#builderType = type;
  }

  get builderType() {
    return this.#builderType;
  }

  build() {
    const result = super.build();

    switch (this.builderType) {
      case HAPPN:
      case HAPPN_CLUSTER:
        return result.happn;
      case HAPPNER:
      case HAPPNER_CLUSTER:
        return result;
      default:
        throw new Error('unknown baseType');
    }
  }
};

export class ConfigBuilderFactory {
  static getBuilder(type: string, version: string) {
    switch (type) {
      case HAPPN:
        return ConfigBuilderFactory.getHappnBuilder();
      case HAPPN_CLUSTER:
        return ConfigBuilderFactory.getHappnClusterBuilder();
      case HAPPNER:
        return ConfigBuilderFactory.getHappnerBuilder();
      case HAPPNER_CLUSTER:
        return ConfigBuilderFactory.getHappnerClusterBuilder(version);
      default:
        throw new Error('Unknown configuration type');
    }
  }

  static getHappnBuilder() {
    const container = ConfigBuilderFactory.createContainer();
    const HappnMixin = HappnCoreBuilder(BaseClz);
    const result = new HappnMixin(container);
    result.builderType = HAPPN;
    return result;
  }

  static getHappnClusterBuilder() {
    const container = ConfigBuilderFactory.createContainer();
    const HappnClusterMixin = HappnCoreBuilder(HappnClusterCoreBuilder(BaseClz));
    const result = new HappnClusterMixin(container);
    result.builderType = HAPPN_CLUSTER;
    return result;
  }

  static getHappnerBuilder() {
    const container = ConfigBuilderFactory.createContainer();
    const HappnerMixin = HappnCoreBuilder(HappnerCoreBuilder(BaseClz));
    const result = new HappnerMixin(container);
    result.builderType = HAPPNER;
    return result;
  }

  static getHappnerClusterBuilder() {
    const container = ConfigBuilderFactory.createContainer();
    const HappnerClusterMixin = HappnCoreBuilder(
      HappnClusterCoreBuilder(HappnerCoreBuilder(HappnerClusterCoreBuilder(BaseClz)))
    );
    const result = new HappnerClusterMixin(container);
    result.builderType = HAPPNER_CLUSTER;
    return result;
  }

  static createContainer() {
    return {
      cacheConfigBuilder: new CacheConfigBuilder(),
      componentsConfigBuilder: new ComponentsConfigBuilder(),
      connectConfigBuilder: new ConnectConfigBuilder(),
      dataConfigBuilder: new DataConfigBuilder(),
      endpointsConfigBuilder: new EndpointsConfigBuilder(),
      membershipConfigBuilder: new MembershipConfigBuilder(),
      modulesConfigBuilder: new ModulesConfigBuilder(),
      orchestratorConfigBuilder: new OrchestratorConfigBuilder(),
      protocolConfigBuilder: new ProtocolConfigBuilder(new FieldTypeValidator()),
      proxyConfigBuilder: new ProxyConfigBuilder(),
      publisherConfigBuilder: new PublisherConfigBuilder(),
      replicatorConfigBuilder: new ReplicatorConfigBuilder(),
      securityConfigBuilder: new SecurityConfigBuilder(),
      subscriptionConfigBuilder: new SubscriptionConfigBuilder(),
      systemConfigBuilder: new SystemConfigBuilder(),
      transportConfigBuilder: new TransportConfigBuilder(),
      healthConfigBuilder: new HealthConfigBuilder(),
    };
  }
}
