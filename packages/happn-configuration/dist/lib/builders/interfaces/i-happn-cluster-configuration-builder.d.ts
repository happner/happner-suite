import { ICoreBuilder } from './i-core-builder';
import { IHappnConfigurationBuilder } from './i-happn-configuration-builder';
/***
 * No membership in this version
 */
export interface IHappnClusterConfigurationBuilder extends ICoreBuilder, IHappnConfigurationBuilder {
    withHealthInterval(interval: number): any;
    withHealthWarmupLimit(limit: number): any;
    withOrchestratorMinimumPeers(minimum: number): any;
    withOrchestratorReplicatePath(path: string): any;
    withOrchestratorStableReportInterval(interval: number): any;
    withOrchestratorStabiliseTimeout(timeout: number): any;
    withProxyAllowSelfSignedCerts(allow: boolean): any;
    withProxyCertPath(path: string): any;
    withProxyHost(host: string, port: number): any;
    withProxyKeyPath(path: string): any;
    withProxyTimeout(timeout: number): any;
    withReplicatorSecurityChangeSetReplicateInterval(interval: number): any;
}
