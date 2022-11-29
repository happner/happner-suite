import BaseBuilder from 'happn-commons/lib/base-builder';
import { Constructor } from '../../types/mixin-types';
import { HealthConfigBuilder } from '../happn/services/health-config-builder';
import { MembershipConfigBuilder } from '../happn/services/membership-config-builder';
import { OrchestratorConfigBuilder } from '../happn/services/orchestrator-config-builder';
import { ProxyConfigBuilder } from '../happn/services/proxy-config-builder';
import { ReplicatorConfigBuilder } from '../happn/services/replicator-config-builder';
import { IHappnClusterConfigurationBuilder } from '../interfaces/i-happn-cluster-configuration-builder';

export function HappnClusterCoreBuilder<TBase extends Constructor>(Base: TBase) {
  return class HappnClusterBuilder extends Base implements IHappnClusterConfigurationBuilder {
    #healthConfigBuilder: HealthConfigBuilder;
    #membershipConfigBuilder: MembershipConfigBuilder;
    #orchestratorConfigBuilder: OrchestratorConfigBuilder;
    #proxyConfigBuilder: ProxyConfigBuilder;
    #replicatorConfigBuilder: ReplicatorConfigBuilder;

    constructor(...args: any[]) {
      super(...args);

      const container = args[0];

      this.#healthConfigBuilder = container.healthConfigBuilder;
      this.#membershipConfigBuilder = container.membershipConfigBuilder;
      this.#orchestratorConfigBuilder = container.orchestratorConfigBuilder;
      this.#proxyConfigBuilder = container.proxyConfigBuilder;
      this.#replicatorConfigBuilder = container.replicatorConfigBuilder;

      this.set(`health`, this.#healthConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(`membership`, this.#membershipConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(`orchestrator`, this.#orchestratorConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(`proxy`, this.#proxyConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(`replicator`, this.#replicatorConfigBuilder, BaseBuilder.Types.OBJECT);
    }

    /*
      HEALTH
       */

    withHealthInterval(interval: number) {
      this.#healthConfigBuilder.withHealthInterval(interval);
      return this;
    }

    withHealthWarmupLimit(limit: number) {
      this.#healthConfigBuilder.withHealthWarmupLimit(limit);
      return this;
    }

    /*
    MEMBERSHIP
     */

    withMembershipClusterName(name: string) {
      this.#membershipConfigBuilder.withMembershipClusterName(name);
      return this;
    }

    withMembershipDisseminationFactor(factor: number) {
      this.#membershipConfigBuilder.withMembershipDisseminationFactor(factor);
      return this;
    }

    withMembershipHost(host: string, port: number) {
      this.#membershipConfigBuilder.withMembershipHost(host);
      this.#membershipConfigBuilder.withMembershipPort(port);
      return this;
    }

    withMembershipJoinTimeout(timeout: number) {
      this.#membershipConfigBuilder.withMembershipJoinTimeout(timeout);
      return this;
    }

    withMembershipJoinType(type: string) {
      this.#membershipConfigBuilder.withMembershipJoinType(type);
      return this;
    }

    withMembershipMemberHost(host: string) {
      this.#membershipConfigBuilder.withMembershipMemberHost(host);
      return this;
    }

    withMembershipPing(
      interval: number,
      pingTimeout?: number,
      requestTimeout?: number,
      requestGroupSize?: number
    ) {
      this.#membershipConfigBuilder.withMembershipPingInterval(interval);
      if (pingTimeout !== undefined)
        this.#membershipConfigBuilder.withMembershipPingTimeout(pingTimeout);
      if (requestTimeout !== undefined)
        this.#membershipConfigBuilder.withMembershipPingReqTimeout(requestTimeout);
      if (requestGroupSize !== undefined)
        this.#membershipConfigBuilder.withMembershipPingReqGroupSize(requestGroupSize);
      return this;
    }

    withMembershipRandomWait(wait: number) {
      this.#membershipConfigBuilder.withMembershipRandomWait(wait);
      return this;
    }

    withMembershipIsSeed(isSeed: boolean) {
      this.#membershipConfigBuilder.withMembershipIsSeed(isSeed);
      return this;
    }

    withMembershipSeedWait(wait: number) {
      this.#membershipConfigBuilder.withMembershipSeedWait(wait);
      return this;
    }

    withMembershipUdpMaxDgramSize(size: number) {
      this.#membershipConfigBuilder.withMembershipUdpMaxDgramSize(size);
      return this;
    }

    /*
    ORCHESTRATOR
     */

    withOrchestratorMinimumPeers(minimum: number) {
      this.#orchestratorConfigBuilder.withOrchestratorMinimumPeers(minimum);
      return this;
    }

    withOrchestratorReplicatePath(path: string) {
      this.#orchestratorConfigBuilder.withOrchestratorReplicatePath(path);
      return this;
    }

    withOrchestratorStableReportInterval(interval: number) {
      this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
      return this;
    }

    withOrchestratorStabiliseTimeout(timeout: number) {
      this.#orchestratorConfigBuilder.withOrchestratorStabiliseTimeout(timeout);
      return this;
    }

    /*
    PROXY
     */

    withProxyAllowSelfSignedCerts(allow: boolean) {
      this.#proxyConfigBuilder.withProxyAllowSelfSignedCerts(allow);
      return this;
    }

    withProxyCertPath(path: string) {
      this.#proxyConfigBuilder.withProxyCertPath(path);
      return this;
    }

    withProxyHost(host: string, port: number) {
      this.#proxyConfigBuilder.withProxyHost(host);
      this.#proxyConfigBuilder.withProxyPort(port);
      return this;
    }

    withProxyKeyPath(path: string) {
      this.#proxyConfigBuilder.withProxyKeyPath(path);
      return this;
    }

    withProxyTimeout(timeout: number) {
      this.#proxyConfigBuilder.withProxyTimeout(timeout);
      return this;
    }

    /*
    REPLICATOR
     */

    withReplicatorSecurityChangeSetReplicateInterval(interval: number) {
      this.#replicatorConfigBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
      return this;
    }
  };
}
