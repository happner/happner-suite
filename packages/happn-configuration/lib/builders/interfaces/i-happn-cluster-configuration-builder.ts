import { ICoreBuilder } from './i-core-builder';
import { IHappnConfigurationBuilder } from './i-happn-configuration-builder';

export interface IHappnClusterConfigurationBuilder
  extends ICoreBuilder,
    IHappnConfigurationBuilder {
  withHealthInterval(interval: number);

  withHealthWarmupLimit(limit: number);

  withMembershipClusterName(name: string);

  withMembershipDisseminationFactor(factor: number);

  withMembershipHost(host: string, port: number);

  withMembershipJoinTimeout(timeout: number);

  withMembershipJoinType(type: string);

  withMembershipMemberHost(host: string);

  withMembershipPing(
    interval: number,
    pingTimeout?: number,
    requestTimeout?: number,
    requestGroupSize?: number
  );

  withMembershipRandomWait(wait: number);

  withMembershipIsSeed(isSeed: boolean);

  withMembershipSeedWait(wait: number);

  withMembershipUdpMaxDgramSize(size: number);

  withOrchestratorMinimumPeers(minimum: number);

  withOrchestratorReplicatePath(path: string);

  withOrchestratorStableReportInterval(interval: number);

  withOrchestratorStabiliseTimeout(timeout: number);

  withProxyAllowSelfSignedCerts(allow: boolean);

  withProxyCertPath(path: string);

  withProxyHost(host: string, port: number);

  withProxyKeyPath(path: string);

  withProxyTimeout(timeout: number);

  withReplicatorSecurityChangeSetReplicateInterval(interval: number);
}
