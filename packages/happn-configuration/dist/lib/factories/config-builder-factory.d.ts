import { IHappnClusterConfigurationBuilder } from '../builders/interfaces/i-happn-cluster-configuration-builder';
import { IHappnConfigurationBuilder } from '../builders/interfaces/i-happn-configuration-builder';
import { IHappnerConfigurationBuilder } from '../builders/interfaces/i-happner-configuration-builder';
import { IHappnerClusterConfigurationBuilder } from '../builders/interfaces/i-happner-cluster-configuration-builder';
import { MixinFactory } from './mixin-factory';
import { CacheConfigBuilder, ComponentsConfigBuilder, ConnectConfigBuilder, DataConfigBuilder, EndpointsConfigBuilder, HealthConfigBuilder, MembershipConfigBuilder, ModulesConfigBuilder, OrchestratorConfigBuilder, ProtocolConfigBuilder, ProxyConfigBuilder, PublisherConfigBuilder, ReplicatorConfigBuilder, SecurityConfigBuilder, SubscriptionConfigBuilder, SystemConfigBuilder, TransportConfigBuilder } from '../builders/builders';
export declare class ConfigBuilderFactory {
    #private;
    constructor(mixinFactory: MixinFactory, cacheConfigBuilder: CacheConfigBuilder, componentsConfigBuilder: ComponentsConfigBuilder, connectConfigBuilder: ConnectConfigBuilder, dataConfigBuilder: DataConfigBuilder, endpointsConfigBuilder: EndpointsConfigBuilder, healthConfigBuilder: HealthConfigBuilder, membershipConfigBuilder: MembershipConfigBuilder, modulesConfigBuilder: ModulesConfigBuilder, orchestratorConfigBuilder: OrchestratorConfigBuilder, protocolConfigBuilder: ProtocolConfigBuilder, proxyConfigBuilder: ProxyConfigBuilder, publisherConfigBuilder: PublisherConfigBuilder, replicatorConfigBuilder: ReplicatorConfigBuilder, securityConfigBuilder: SecurityConfigBuilder, subscriptionConfigBuilder: SubscriptionConfigBuilder, systemConfigBuilder: SystemConfigBuilder, transportConfigBuilder: TransportConfigBuilder);
    static create(): ConfigBuilderFactory;
    getHappnBuilder(): IHappnConfigurationBuilder;
    getHappnClusterBuilder(): IHappnClusterConfigurationBuilder;
    getHappnerBuilder(): IHappnerConfigurationBuilder;
    getHappnerClusterBuilder(): IHappnerClusterConfigurationBuilder;
}
