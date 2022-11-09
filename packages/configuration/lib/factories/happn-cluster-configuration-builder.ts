import HappnClusterConfigBuilder from '../builders/happn-cluster-config-builder';
import HealthConfigBuilder from '../builders/services/health-config-builder';
import MembershipConfigBuilder from '../builders/services/membership-config-builder';
import OrchestratorConfigBuilder from '../builders/services/orchestrator-config-builder';
import ProxyConfigBuilder from '../builders/services/proxy-config-builder';
import ReplicatorConfigBuilder from '../builders/services/replicator-config-builder';
import { HappnConfigurationBuilder } from './happn-configuration-builder';
import HappnConfigBuilder from '../builders/happn-config-builder';
import CacheConfigBuilder from '../builders/services/cache-config-builder';
import ConnectConfigBuilder from '../builders/services/connect-config-builder';
import DataConfigBuilder from '../builders/services/data-config-builder';
import ProtocolConfigBuilder from '../builders/services/protocol-config-builder';
import PublisherConfigBuilder from '../builders/services/publisher-config-builder';
import SecurityConfigBuilder from '../builders/services/security-config-builder';
import SubscriptionConfigBuilder from '../builders/services/subscription-config-builder';
import SystemConfigBuilder from '../builders/services/system-config-builder';
import TransportConfigBuilder from '../builders/services/transport-config-builder';

export class HappnClusterConfigurationBuilder extends HappnConfigurationBuilder {
  #happnClusterConfigBuilder: HappnClusterConfigBuilder;
  #healthConfigBuilder: HealthConfigBuilder;
  #membershipConfigBuilder: MembershipConfigBuilder;
  #orchestratorConfigBuilder: OrchestratorConfigBuilder;
  #proxyConfigBuilder: ProxyConfigBuilder;
  #replicatorConfigBuilder: ReplicatorConfigBuilder;

  constructor(
    happnConfigBuilder: HappnConfigBuilder,
    cacheConfigBuilder: CacheConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder,
    subscriptionConfigBuilder: SubscriptionConfigBuilder,
    systemConfigBuilder: SystemConfigBuilder,
    transportConfigBuilder: TransportConfigBuilder,
    happnClusterConfigBuilder: HappnClusterConfigBuilder,
    healthConfigBuilder: HealthConfigBuilder,
    membershipConfigBuilder: MembershipConfigBuilder,
    orchestratorConfigBuilder: OrchestratorConfigBuilder,
    proxyConfigBuilder: ProxyConfigBuilder,
    replicatorConfigBuilder: ReplicatorConfigBuilder
  ) {
    super(
      happnConfigBuilder,
      cacheConfigBuilder,
      connectConfigBuilder,
      dataConfigBuilder,
      protocolConfigBuilder,
      publisherConfigBuilder,
      securityConfigBuilder,
      subscriptionConfigBuilder,
      systemConfigBuilder,
      transportConfigBuilder
    );
    this.#happnClusterConfigBuilder = happnClusterConfigBuilder;
    this.#healthConfigBuilder = healthConfigBuilder;
    this.#membershipConfigBuilder = membershipConfigBuilder;
    this.#orchestratorConfigBuilder = orchestratorConfigBuilder;
    this.#proxyConfigBuilder = proxyConfigBuilder;
    this.#replicatorConfigBuilder = replicatorConfigBuilder;
  }

  /*
  HEALTH
   */

  withHealthInterval(interval: number): HappnClusterConfigurationBuilder {
    this.#healthConfigBuilder.withHealthInterval(interval);
    return this;
  }

  withHealthWarmupLimit(limit: number): HappnClusterConfigurationBuilder {
    this.#healthConfigBuilder.withHealthWarmupLimit(limit);
    return this;
  }

  /*
  MEMBERSHIP
   */

  withMembershipClusterName(name: string): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipClusterName(name);
    return this;
  }

  withMembershipDisseminationFactor(factor: number): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipDisseminationFactor(factor);
    return this;
  }

  withMembershipHost(host: string, port: number): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipHost(host);
    this.#membershipConfigBuilder.withMembershipPort(port);
    return this;
  }

  withMembershipJoinTimeout(timeout: number): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipJoinTimeout(timeout);
    return this;
  }

  withMembershipJoinType(type: string): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipJoinType(type);
    return this;
  }

  withMembershipMemberHost(host: string): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipMemberHost(host);
    return this;
  }

  withMembershipPing(
    interval: number,
    pingTimeout?: number,
    requestTimeout?: number,
    requestGroupSize?: number
  ): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipPingInterval(interval);
    if (pingTimeout !== undefined)
      this.#membershipConfigBuilder.withMembershipPingTimeout(pingTimeout);
    if (requestTimeout !== undefined)
      this.#membershipConfigBuilder.withMembershipPingReqTimeout(requestTimeout);
    if (requestGroupSize !== undefined)
      this.#membershipConfigBuilder.withMembershipPingReqGroupSize(requestGroupSize);
    return this;
  }

  withMembershipRandomWait(wait: number): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipRandomWait(wait);
    return this;
  }

  withMembershipIsSeed(isSeed: boolean): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipIsSeed(isSeed);
    return this;
  }

  withMembershipSeedWait(wait: boolean): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipSeedWait(wait);
    return this;
  }

  withMembershipUdpMaxDgramSize(size: boolean): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipUdpMaxDgramSize(size);
    return this;
  }

  /*
  ORCHESTRATOR
   */

  withOrchestratorMinimumPeers(minimum: number): HappnClusterConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorMinimumPeers(minimum);
    return this;
  }

  withOrchestratorReplicatePath(path: string): HappnClusterConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorReplicatePath(path);
    return this;
  }

  withOrchestratorStableReportInterval(interval: string): HappnClusterConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout: string): HappnClusterConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorStabiliseTimeout(timeout);
    return this;
  }

  /*
  PROXY
   */

  withProxyAllowSelfSignedCerts(allow: boolean): HappnClusterConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyAllowSelfSignedCerts(allow);
    return this;
  }

  withProxyCertPath(path: string): HappnClusterConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyCertPath(path);
    return this;
  }

  withProxyHost(host: string, port: number): HappnClusterConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyHost(host);
    this.#proxyConfigBuilder.withProxyPort(port);
    return this;
  }

  withProxyKeyPath(path: string): HappnClusterConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyKeyPath(path);
    return this;
  }

  withProxyTimeout(timeout: number): HappnClusterConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyTimeout(timeout);
    return this;
  }

  /*
  REPLICATOR
   */

  withReplicatorSecurityChangeSetReplicateInterval(
    interval: number
  ): HappnClusterConfigurationBuilder {
    this.#replicatorConfigBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
    return this;
  }

  build() {
    const happnConfig = super.build();

    const happnClusterConfig = this.#happnClusterConfigBuilder
      .withHealthConfigBuilder(this.#healthConfigBuilder)
      .withMembershipConfigBuilder(this.#membershipConfigBuilder)
      .withOrchestratorConfigBuilder(this.#orchestratorConfigBuilder)
      .withProxyConfigBuilder(this.#proxyConfigBuilder)
      .withReplicatorConfigBuilder(this.#replicatorConfigBuilder)
      .build();

    return { ...happnConfig, ...happnClusterConfig };
  }
}
