import { Constructor } from '../../types/mixin-types';
import { HealthConfigBuilder } from '../happn/services/health-config-builder';
import { MembershipConfigBuilder } from '../happn/services/membership-config-builder';
import { OrchestratorConfigBuilder } from '../happn/services/orchestrator-config-builder';
import { ProxyConfigBuilder } from '../happn/services/proxy-config-builder';
import { ReplicatorConfigBuilder } from '../happn/services/replicator-config-builder';
export declare function HappnClusterCoreBuilderV2<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        "__#6@#healthConfigBuilder": HealthConfigBuilder;
        "__#6@#membershipConfigBuilder": MembershipConfigBuilder;
        "__#6@#orchestratorConfigBuilder": OrchestratorConfigBuilder;
        "__#6@#proxyConfigBuilder": ProxyConfigBuilder;
        "__#6@#replicatorConfigBuilder": ReplicatorConfigBuilder;
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
    };
} & TBase;
