import { Constructor } from '../../types/mixin-types';
import { HealthConfigBuilder } from '../happn/services/health-config-builder';
import { OrchestratorConfigBuilder } from '../happn/services/orchestrator-config-builder';
import { ProxyConfigBuilder } from '../happn/services/proxy-config-builder';
import { ReplicatorConfigBuilder } from '../happn/services/replicator-config-builder';
export declare function HappnClusterCoreBuilder<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        "__#4@#healthConfigBuilder": HealthConfigBuilder;
        "__#4@#orchestratorConfigBuilder": OrchestratorConfigBuilder;
        "__#4@#proxyConfigBuilder": ProxyConfigBuilder;
        "__#4@#replicatorConfigBuilder": ReplicatorConfigBuilder;
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
