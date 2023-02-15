import { IHappnClusterConfigurationBuilder } from '../builders/interfaces/i-happn-cluster-configuration-builder';
import { IHappnConfigurationBuilder } from '../builders/interfaces/i-happn-configuration-builder';
import { CacheConfigBuilder, ComponentsConfigBuilder, ConnectConfigBuilder, DataConfigBuilder, EndpointsConfigBuilder, HealthConfigBuilder, MembershipConfigBuilder, ModulesConfigBuilder, OrchestratorConfigBuilder, ProtocolConfigBuilder, ProxyConfigBuilder, PublisherConfigBuilder, ReplicatorConfigBuilder, SecurityConfigBuilder, SubscriptionConfigBuilder, SystemConfigBuilder, TransportConfigBuilder } from '../builders/builders';
import { IHappnerConfigurationBuilder } from '../builders/interfaces/i-happner-configuration-builder';
import { IHappnerClusterConfigurationBuilder } from '../builders/interfaces/i-happner-cluster-configuration-builder';
export declare class ConfigBuilderFactory {
    static create(): ConfigBuilderFactory;
    getHappnBuilder(): IHappnConfigurationBuilder;
    getHappnClusterBuilder(): IHappnClusterConfigurationBuilder;
    getHappnerBuilder(): IHappnerConfigurationBuilder;
    getHappnerClusterBuilder(): IHappnerClusterConfigurationBuilder;
    createChildBuildersContainer(): {
        cacheConfigBuilder: CacheConfigBuilder;
        connectConfigBuilder: ConnectConfigBuilder;
        dataConfigBuilder: DataConfigBuilder;
        protocolConfigBuilder: ProtocolConfigBuilder;
        publisherConfigBuilder: PublisherConfigBuilder;
        securityConfigBuilder: SecurityConfigBuilder;
        subscriptionConfigBuilder: SubscriptionConfigBuilder;
        systemConfigBuilder: SystemConfigBuilder;
        transportConfigBuilder: TransportConfigBuilder;
        healthConfigBuilder: HealthConfigBuilder;
        membershipConfigBuilder: MembershipConfigBuilder;
        orchestratorConfigBuilder: OrchestratorConfigBuilder;
        proxyConfigBuilder: ProxyConfigBuilder;
        replicatorConfigBuilder: ReplicatorConfigBuilder;
        componentsConfigBuilder: ComponentsConfigBuilder;
        endpointsConfigBuilder: EndpointsConfigBuilder;
        modulesConfigBuilder: ModulesConfigBuilder;
    };
}
