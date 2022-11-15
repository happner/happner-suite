const BaseBuilder = require('happn-commons/lib/base-builder');

import { HappnConfigurationBuilder } from '../happn/happn-configuration-builder.js';
import { CacheConfigBuilder } from '../happn/services/cache-config-builder.js';
import { ConnectConfigBuilder } from '../happn/services/connect-config-builder.js';
import { DataConfigBuilder } from '../happn/services/data-config-builder.js';
import { HealthConfigBuilder } from '../happn/services/health-config-builder.js';
import { MembershipConfigBuilder } from '../happn/services/membership-config-builder.js';
import { ProtocolConfigBuilder } from '../happn/services/protocol-config-builder.js';
import { PublisherConfigBuilder } from '../happn/services/publisher-config-builder.js';
import { SecurityConfigBuilder } from '../happn/services/security-config-builder.js';
import { SubscriptionConfigBuilder } from '../happn/services/subscription-config-builder.js';
import { SystemConfigBuilder } from '../happn/services/system-config-builder.js';
import { TransportConfigBuilder } from '../happn/services/transport-config-builder.js';
import { OrchestratorConfigBuilder } from '../happn/services/orchestrator-config-builder.js';
import { ProxyConfigBuilder } from '../happn/services/proxy-config-builder.js';
import { ReplicatorConfigBuilder } from '../happn/services/replicator-config-builder.js';

export class HappnClusterConfigurationBuilder extends HappnConfigurationBuilder {
  #healthConfigBuilder: HealthConfigBuilder;
  #membershipConfigBuilder: MembershipConfigBuilder;
  #orchestratorConfigBuilder: OrchestratorConfigBuilder;
  #proxyConfigBuilder: ProxyConfigBuilder;
  #replicatorConfigBuilder: ReplicatorConfigBuilder;

  constructor(
    cacheConfigBuilder: CacheConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder,
    subscriptionConfigBuilder: SubscriptionConfigBuilder,
    systemConfigBuilder: SystemConfigBuilder,
    transportConfigBuilder: TransportConfigBuilder,
    healthConfigBuilder: HealthConfigBuilder,
    membershipConfigBuilder: MembershipConfigBuilder,
    orchestratorConfigBuilder: OrchestratorConfigBuilder,
    proxyConfigBuilder: ProxyConfigBuilder,
    replicatorConfigBuilder: ReplicatorConfigBuilder
  ) {
    super(
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

  withMembershipSeedWait(wait: number): HappnClusterConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipSeedWait(wait);
    return this;
  }

  withMembershipUdpMaxDgramSize(size: number): HappnClusterConfigurationBuilder {
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

  withOrchestratorStableReportInterval(interval: number): HappnClusterConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout: number): HappnClusterConfigurationBuilder {
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

    const clusterBuilder = new BaseBuilder();
    clusterBuilder.set(`health`, this.#healthConfigBuilder, BaseBuilder.Types.OBJECT);
    clusterBuilder.set(`membership`, this.#membershipConfigBuilder, BaseBuilder.Types.OBJECT);
    clusterBuilder.set(`orchestrator`, this.#orchestratorConfigBuilder, BaseBuilder.Types.OBJECT);
    clusterBuilder.set(`proxy`, this.#proxyConfigBuilder, BaseBuilder.Types.OBJECT);
    clusterBuilder.set(`replicator`, this.#replicatorConfigBuilder, BaseBuilder.Types.OBJECT);

    const clusterConfig = clusterBuilder.build();

    return { happn: happnConfig, ...clusterConfig };
  }
}
