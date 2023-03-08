import { expect } from 'chai';
import sinon = require('sinon');
import { ConfigBuilderFactory } from '../../lib/factories/config-builder-factory';
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
} from '../../lib/builders/builders';
import { MixinFactory } from '../../lib/factories/mixin-factory';

describe('config-builder-factory tests', function () {
  const mockMixinFactory = {
    getMixin: () => {
      return sinon.stub();
    },
  } as unknown as MixinFactory;
  const mockCacheConfigBuilder = sinon.mock(CacheConfigBuilder) as unknown as CacheConfigBuilder;
  const mockComponentsConfigBuilder = sinon.mock(
    ComponentsConfigBuilder
  ) as unknown as ComponentsConfigBuilder;
  const mockConnectConfigBuilder = sinon.mock(
    ConnectConfigBuilder
  ) as unknown as ConnectConfigBuilder;
  const mockDataConfigBuilder = sinon.mock(DataConfigBuilder) as unknown as DataConfigBuilder;
  const mockEndpointsConfigBuilder = sinon.mock(
    EndpointsConfigBuilder
  ) as unknown as EndpointsConfigBuilder;
  const mockHealthConfigBuilder = sinon.mock(HealthConfigBuilder) as unknown as HealthConfigBuilder;
  const mockMembershipConfigBuilder = sinon.mock(
    MembershipConfigBuilder
  ) as unknown as MembershipConfigBuilder;
  const mockModulesConfigBuilder = sinon.mock(
    ModulesConfigBuilder
  ) as unknown as ModulesConfigBuilder;
  const mockOrchestratorConfigBuilder = sinon.mock(
    OrchestratorConfigBuilder
  ) as unknown as OrchestratorConfigBuilder;
  const mockProtocolConfigBuilder = sinon.mock(
    ProtocolConfigBuilder
  ) as unknown as ProtocolConfigBuilder;
  const mockProxyConfigBuilder = sinon.mock(ProxyConfigBuilder) as unknown as ProxyConfigBuilder;
  const mockPublisherConfigBuilder = sinon.mock(
    PublisherConfigBuilder
  ) as unknown as PublisherConfigBuilder;
  const mockReplicatorConfigBuilder = sinon.mock(
    ReplicatorConfigBuilder
  ) as unknown as ReplicatorConfigBuilder;
  const mockSecurityConfigBuilder = sinon.mock(
    SecurityConfigBuilder
  ) as unknown as SecurityConfigBuilder;
  const mockSubscriptionConfigBuilder = sinon.mock(
    SubscriptionConfigBuilder
  ) as unknown as SubscriptionConfigBuilder;
  const mockSystemConfigBuilder = sinon.mock(SystemConfigBuilder) as unknown as SystemConfigBuilder;
  const mockTransportConfigBuilder = sinon.mock(
    TransportConfigBuilder
  ) as unknown as TransportConfigBuilder;

  const factory = new ConfigBuilderFactory(
    mockMixinFactory,
    mockCacheConfigBuilder,
    mockComponentsConfigBuilder,
    mockConnectConfigBuilder,
    mockDataConfigBuilder,
    mockEndpointsConfigBuilder,
    mockHealthConfigBuilder,
    mockMembershipConfigBuilder,
    mockModulesConfigBuilder,
    mockOrchestratorConfigBuilder,
    mockProtocolConfigBuilder,
    mockProxyConfigBuilder,
    mockPublisherConfigBuilder,
    mockReplicatorConfigBuilder,
    mockSecurityConfigBuilder,
    mockSubscriptionConfigBuilder,
    mockSystemConfigBuilder,
    mockTransportConfigBuilder
  );

  it('successfully returns a happn-builder', () => {
    const result = factory.getHappnBuilder();
    expect(result.builderType).to.equal('happn');
  });

  it('successfully returns a happn-cluster-builder', () => {
    const result = factory.getHappnClusterBuilder();
    expect(result.builderType).to.equal('happn-cluster');
  });

  it('successfully returns a happner-builder', () => {
    const result = factory.getHappnerBuilder();
    expect(result.builderType).to.equal('happner');
  });

  it('successfully returns a happner-cluster-builder', () => {
    const result = factory.getHappnerClusterBuilder();
    expect(result.builderType).to.equal('happner-cluster');
  });
});
