import BaseBuilder from 'happn-commons/lib/base-builder';
import { HealthConfigBuilder } from '../happn/services/health-config-builder';
import { MembershipConfigBuilder } from '../happn/services/membership-config-builder';
import { OrchestratorConfigBuilder } from '../happn/services/orchestrator-config-builder';
import { ProxyConfigBuilder } from '../happn/services/proxy-config-builder';
import { ReplicatorConfigBuilder } from '../happn/services/replicator-config-builder';
import { IHappnClusterConfigurationBuilder } from '../interfaces/i-happn-cluster-configuration-builder';

export class HappnClusterCoreConfigurationBuilder
  extends BaseBuilder
  implements IHappnClusterConfigurationBuilder
{
  #healthConfigBuilder: HealthConfigBuilder;
  #membershipConfigBuilder: MembershipConfigBuilder;
  #orchestratorConfigBuilder: OrchestratorConfigBuilder;
  #proxyConfigBuilder: ProxyConfigBuilder;
  #replicatorConfigBuilder: ReplicatorConfigBuilder;

  constructor(
    healthConfigBuilder: HealthConfigBuilder,
    membershipConfigBuilder: MembershipConfigBuilder,
    orchestratorConfigBuilder: OrchestratorConfigBuilder,
    proxyConfigBuilder: ProxyConfigBuilder,
    replicatorConfigBuilder: ReplicatorConfigBuilder
  ) {
    super();
    this.#healthConfigBuilder = healthConfigBuilder;
    this.#membershipConfigBuilder = membershipConfigBuilder;
    this.#orchestratorConfigBuilder = orchestratorConfigBuilder;
    this.#proxyConfigBuilder = proxyConfigBuilder;
    this.#replicatorConfigBuilder = replicatorConfigBuilder;
  }

  /*
    HEALTH
     */

  withHealthInterval(interval: number): HappnClusterCoreConfigurationBuilder {
    this.#healthConfigBuilder.withHealthInterval(interval);
    return this;
  }

  withHealthWarmupLimit(limit: number): HappnClusterCoreConfigurationBuilder {
    this.#healthConfigBuilder.withHealthWarmupLimit(limit);
    return this;
  }

  /*
  MEMBERSHIP
   */

  withMembershipClusterName(name: string): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipClusterName(name);
    return this;
  }

  withMembershipDisseminationFactor(factor: number): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipDisseminationFactor(factor);
    return this;
  }

  withMembershipHost(host: string, port: number): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipHost(host);
    this.#membershipConfigBuilder.withMembershipPort(port);
    return this;
  }

  withMembershipJoinTimeout(timeout: number): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipJoinTimeout(timeout);
    return this;
  }

  withMembershipJoinType(type: string): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipJoinType(type);
    return this;
  }

  withMembershipMemberHost(host: string): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipMemberHost(host);
    return this;
  }

  withMembershipPing(
    interval: number,
    pingTimeout?: number,
    requestTimeout?: number,
    requestGroupSize?: number
  ): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipPingInterval(interval);
    if (pingTimeout !== undefined)
      this.#membershipConfigBuilder.withMembershipPingTimeout(pingTimeout);
    if (requestTimeout !== undefined)
      this.#membershipConfigBuilder.withMembershipPingReqTimeout(requestTimeout);
    if (requestGroupSize !== undefined)
      this.#membershipConfigBuilder.withMembershipPingReqGroupSize(requestGroupSize);
    return this;
  }

  withMembershipRandomWait(wait: number): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipRandomWait(wait);
    return this;
  }

  withMembershipIsSeed(isSeed: boolean): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipIsSeed(isSeed);
    return this;
  }

  withMembershipSeedWait(wait: number): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipSeedWait(wait);
    return this;
  }

  withMembershipUdpMaxDgramSize(size: number): HappnClusterCoreConfigurationBuilder {
    this.#membershipConfigBuilder.withMembershipUdpMaxDgramSize(size);
    return this;
  }

  /*
  ORCHESTRATOR
   */

  withOrchestratorMinimumPeers(minimum: number): HappnClusterCoreConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorMinimumPeers(minimum);
    return this;
  }

  withOrchestratorReplicatePath(path: string): HappnClusterCoreConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorReplicatePath(path);
    return this;
  }

  withOrchestratorStableReportInterval(interval: number): HappnClusterCoreConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout: number): HappnClusterCoreConfigurationBuilder {
    this.#orchestratorConfigBuilder.withOrchestratorStabiliseTimeout(timeout);
    return this;
  }

  /*
  PROXY
   */

  withProxyAllowSelfSignedCerts(allow: boolean): HappnClusterCoreConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyAllowSelfSignedCerts(allow);
    return this;
  }

  withProxyCertPath(path: string): HappnClusterCoreConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyCertPath(path);
    return this;
  }

  withProxyHost(host: string, port: number): HappnClusterCoreConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyHost(host);
    this.#proxyConfigBuilder.withProxyPort(port);
    return this;
  }

  withProxyKeyPath(path: string): HappnClusterCoreConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyKeyPath(path);
    return this;
  }

  withProxyTimeout(timeout: number): HappnClusterCoreConfigurationBuilder {
    this.#proxyConfigBuilder.withProxyTimeout(timeout);
    return this;
  }

  /*
  REPLICATOR
   */

  withReplicatorSecurityChangeSetReplicateInterval(
    interval: number
  ): HappnClusterCoreConfigurationBuilder {
    this.#replicatorConfigBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
    return this;
  }

  build() {
    return super.build();
  }
}
