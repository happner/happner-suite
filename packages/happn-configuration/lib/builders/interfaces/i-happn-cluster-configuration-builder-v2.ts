import { ICoreBuilder } from './i-core-builder';
import { IHappnConfigurationBuilder } from './i-happn-configuration-builder';

/***
 * No membership in this version
 */
export interface IHappnClusterConfigurationBuilderV2
  extends ICoreBuilder,
    IHappnConfigurationBuilder {
  withHealthInterval(interval: number);

  withHealthWarmupLimit(limit: number);

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
