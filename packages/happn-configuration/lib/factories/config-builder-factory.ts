import BuilderConstants from '../constants/builder-constants';
import { FieldTypeValidator } from '../validators/field-type-validator';
import { IHappnClusterConfigurationBuilder } from '../builders/interfaces/i-happn-cluster-configuration-builder';
import { IHappnConfigurationBuilder } from '../builders/interfaces/i-happn-configuration-builder';
import { IHappnerConfigurationBuilder } from '../builders/interfaces/i-happner-configuration-builder';
import { IHappnerClusterConfigurationBuilder } from '../builders/interfaces/i-happner-cluster-configuration-builder';
import { MixinFactory } from './mixin-factory';
import {
  CacheConfigBuilder,
  ComponentsConfigBuilder,
  ConnectConfigBuilder,
  DataConfigBuilder,
  EndpointsConfigBuilder,
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

const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = BuilderConstants;

export class ConfigBuilderFactory {
  #mixinFactory: MixinFactory;
  #cacheConfigBuilder: CacheConfigBuilder;
  #componentsConfigBuilder: ComponentsConfigBuilder;
  #connectConfigBuilder: ConnectConfigBuilder;
  #dataConfigBuilder: DataConfigBuilder;
  #endpointsConfigBuilder: EndpointsConfigBuilder;
  #healthConfigBuilder: HealthConfigBuilder;
  #membershipConfigBuilder: MembershipConfigBuilder;
  #modulesConfigBuilder: ModulesConfigBuilder;
  #orchestratorConfigBuilder: OrchestratorConfigBuilder;
  #protocolConfigBuilder: ProtocolConfigBuilder;
  #proxyConfigBuilder: ProxyConfigBuilder;
  #publisherConfigBuilder: PublisherConfigBuilder;
  #replicatorConfigBuilder: ReplicatorConfigBuilder;
  #securityConfigBuilder: SecurityConfigBuilder;
  #subscriptionConfigBuilder: SubscriptionConfigBuilder;
  #systemConfigBuilder: SystemConfigBuilder;
  #transportConfigBuilder: TransportConfigBuilder;

  constructor(
    mixinFactory: MixinFactory,
    cacheConfigBuilder: CacheConfigBuilder,
    componentsConfigBuilder: ComponentsConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    endpointsConfigBuilder: EndpointsConfigBuilder,
    healthConfigBuilder: HealthConfigBuilder,
    membershipConfigBuilder: MembershipConfigBuilder,
    modulesConfigBuilder: ModulesConfigBuilder,
    orchestratorConfigBuilder: OrchestratorConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    proxyConfigBuilder: ProxyConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    replicatorConfigBuilder: ReplicatorConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder,
    subscriptionConfigBuilder: SubscriptionConfigBuilder,
    systemConfigBuilder: SystemConfigBuilder,
    transportConfigBuilder: TransportConfigBuilder
  ) {
    this.#mixinFactory = mixinFactory;
    this.#cacheConfigBuilder = cacheConfigBuilder;
    this.#componentsConfigBuilder = componentsConfigBuilder;
    this.#connectConfigBuilder = connectConfigBuilder;
    this.#dataConfigBuilder = dataConfigBuilder;
    this.#endpointsConfigBuilder = endpointsConfigBuilder;
    this.#healthConfigBuilder = healthConfigBuilder;
    this.#membershipConfigBuilder = membershipConfigBuilder;
    this.#modulesConfigBuilder = modulesConfigBuilder;
    this.#orchestratorConfigBuilder = orchestratorConfigBuilder;
    this.#protocolConfigBuilder = protocolConfigBuilder;
    this.#proxyConfigBuilder = proxyConfigBuilder;
    this.#publisherConfigBuilder = publisherConfigBuilder;
    this.#replicatorConfigBuilder = replicatorConfigBuilder;
    this.#securityConfigBuilder = securityConfigBuilder;
    this.#subscriptionConfigBuilder = subscriptionConfigBuilder;
    this.#systemConfigBuilder = systemConfigBuilder;
    this.#transportConfigBuilder = transportConfigBuilder;
  }

  static create() {
    return new ConfigBuilderFactory(
      new MixinFactory(),
      new CacheConfigBuilder(),
      new ComponentsConfigBuilder(),
      new ConnectConfigBuilder(),
      new DataConfigBuilder(),
      new EndpointsConfigBuilder(),
      new HealthConfigBuilder(),
      new MembershipConfigBuilder(),
      new ModulesConfigBuilder(),
      new OrchestratorConfigBuilder(),
      new ProtocolConfigBuilder(new FieldTypeValidator()),
      new ProxyConfigBuilder(),
      new PublisherConfigBuilder(),
      new ReplicatorConfigBuilder(),
      new SecurityConfigBuilder(),
      new SubscriptionConfigBuilder(),
      new SystemConfigBuilder(),
      new TransportConfigBuilder()
    );
  }

  get #childBuildersContainer() {
    return {
      // HAPPN
      cacheConfigBuilder: this.#cacheConfigBuilder,
      connectConfigBuilder: this.#connectConfigBuilder,
      dataConfigBuilder: this.#dataConfigBuilder,
      protocolConfigBuilder: this.#protocolConfigBuilder,
      publisherConfigBuilder: this.#publisherConfigBuilder,
      securityConfigBuilder: this.#securityConfigBuilder,
      subscriptionConfigBuilder: this.#subscriptionConfigBuilder,
      systemConfigBuilder: this.#systemConfigBuilder,
      transportConfigBuilder: this.#transportConfigBuilder,
      // HAPPN_CLUSTER
      healthConfigBuilder: this.#healthConfigBuilder,
      membershipConfigBuilder: this.#membershipConfigBuilder,
      orchestratorConfigBuilder: this.#orchestratorConfigBuilder,
      proxyConfigBuilder: this.#proxyConfigBuilder,
      replicatorConfigBuilder: this.#replicatorConfigBuilder,
      // HAPPNER
      componentsConfigBuilder: this.#componentsConfigBuilder,
      endpointsConfigBuilder: this.#endpointsConfigBuilder,
      modulesConfigBuilder: this.#modulesConfigBuilder,
    };
  }

  getHappnBuilder(): IHappnConfigurationBuilder {
    const HappnMixin = this.#mixinFactory.getMixin(HAPPN);
    const result = new HappnMixin(this.#childBuildersContainer);
    result.builderType = HAPPN;
    return result as unknown as IHappnConfigurationBuilder;
  }

  getHappnClusterBuilder(): IHappnClusterConfigurationBuilder {
    const HappnClusterMixin = this.#mixinFactory.getMixin(HAPPN_CLUSTER);
    const result = new HappnClusterMixin(this.#childBuildersContainer);
    result.builderType = HAPPN_CLUSTER;
    return result as unknown as IHappnClusterConfigurationBuilder;
  }

  getHappnerBuilder(): IHappnerConfigurationBuilder {
    const HappnerMixin = this.#mixinFactory.getMixin(HAPPNER);
    const result = new HappnerMixin(this.#childBuildersContainer);
    result.builderType = HAPPNER;
    return result as unknown as IHappnerConfigurationBuilder;
  }

  getHappnerClusterBuilder(): IHappnerClusterConfigurationBuilder {
    const HappnerClusterMixin = this.#mixinFactory.getMixin(HAPPNER_CLUSTER);
    const result = new HappnerClusterMixin(this.#childBuildersContainer);
    result.builderType = HAPPNER_CLUSTER;
    return result as unknown as IHappnerClusterConfigurationBuilder;
  }
}
