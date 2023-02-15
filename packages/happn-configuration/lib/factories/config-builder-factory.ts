import BuilderConstants from '../constants/builder-constants';
import { FieldTypeValidator } from '../validators/field-type-validator';
import { CoreBuilder } from '../builders/core-builder';
import { IHappnClusterConfigurationBuilder } from '../builders/interfaces/i-happn-cluster-configuration-builder';
import { IHappnConfigurationBuilder } from '../builders/interfaces/i-happn-configuration-builder';
import {
  CacheConfigBuilder,
  ComponentsConfigBuilder,
  ConnectConfigBuilder,
  DataConfigBuilder,
  EndpointsConfigBuilder,
  HappnClusterCoreBuilder,
  HappnCoreBuilder,
  HappnerClusterCoreBuilder,
  HappnerCoreBuilder,
  HealthConfigBuilder,
  MembershipConfigBuilder,
  ModulesConfigBuilder,
  OrchestratorConfigBuilder,
  ProtocolConfigBuilder,
  ProxyConfigBuilder,
  PublisherConfigBuilder,
  ReplicatorConfigBuilder,
  SecurityConfigBuilder,
  SubscriptionConfigBuilder,
  SystemConfigBuilder,
  TransportConfigBuilder,
} from '../builders/builders';
import { IHappnerConfigurationBuilder } from '../builders/interfaces/i-happner-configuration-builder';
import { IHappnerClusterConfigurationBuilder } from '../builders/interfaces/i-happner-cluster-configuration-builder';

const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = BuilderConstants;

export class ConfigBuilderFactory {
  static create() {
    return new ConfigBuilderFactory();
  }

  getHappnBuilder(): IHappnConfigurationBuilder {
    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnMixin = HappnCoreBuilder(CoreBuilder);
    const result = new HappnMixin(container);
    result.builderType = HAPPN;

    return result as IHappnConfigurationBuilder;
  }

  getHappnClusterBuilder(): IHappnClusterConfigurationBuilder {
    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnClusterMixin = HappnClusterCoreBuilder(HappnCoreBuilder(CoreBuilder));
    const result = new HappnClusterMixin(container);
    result.builderType = HAPPN_CLUSTER;
    return result as IHappnClusterConfigurationBuilder;
  }

  getHappnerBuilder(): IHappnerConfigurationBuilder {
    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnerMixin = HappnerCoreBuilder(HappnCoreBuilder(CoreBuilder));
    const result = new HappnerMixin(container);
    result.builderType = HAPPNER;
    return result as IHappnerConfigurationBuilder;
  }

  getHappnerClusterBuilder(): IHappnerClusterConfigurationBuilder {
    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnerClusterMixin = HappnerClusterCoreBuilder(
      HappnClusterCoreBuilder(HappnerCoreBuilder(HappnCoreBuilder(CoreBuilder)))
    );
    const result = new HappnerClusterMixin(container);
    result.builderType = HAPPNER_CLUSTER;
    return result as IHappnerClusterConfigurationBuilder;
  }

  createChildBuildersContainer() {
    return {
      // HAPPN
      cacheConfigBuilder: new CacheConfigBuilder(),
      connectConfigBuilder: new ConnectConfigBuilder(),
      dataConfigBuilder: new DataConfigBuilder(),
      protocolConfigBuilder: new ProtocolConfigBuilder(new FieldTypeValidator()),
      publisherConfigBuilder: new PublisherConfigBuilder(),
      securityConfigBuilder: new SecurityConfigBuilder(),
      subscriptionConfigBuilder: new SubscriptionConfigBuilder(),
      systemConfigBuilder: new SystemConfigBuilder(),
      transportConfigBuilder: new TransportConfigBuilder(),
      // HAPPN_CLUSTER
      healthConfigBuilder: new HealthConfigBuilder(),
      membershipConfigBuilder: new MembershipConfigBuilder(),
      orchestratorConfigBuilder: new OrchestratorConfigBuilder(),
      proxyConfigBuilder: new ProxyConfigBuilder(),
      replicatorConfigBuilder: new ReplicatorConfigBuilder(),
      // HAPPNER
      componentsConfigBuilder: new ComponentsConfigBuilder(),
      endpointsConfigBuilder: new EndpointsConfigBuilder(),
      modulesConfigBuilder: new ModulesConfigBuilder(),
    };
  }
}
