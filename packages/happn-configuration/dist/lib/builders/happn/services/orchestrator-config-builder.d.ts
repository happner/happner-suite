declare const BaseBuilder: any;
export declare class OrchestratorConfigBuilder extends BaseBuilder {
    constructor();
    withOrchestratorMinimumPeers(peerCount: number): this;
    withOrchestratorReplicatePath(path: string): this;
    withOrchestratorStableReportInterval(interval: number): this;
    withOrchestratorStabiliseTimeout(timeout: number): this;
    withServiceName(serviceName: string): OrchestratorConfigBuilder;
    withDeploymentName(deployment: string): OrchestratorConfigBuilder;
    withClusterName(clusterName: string): OrchestratorConfigBuilder;
    withClusterConfigItem(fieldName: string, fieldValue: number): OrchestratorConfigBuilder;
    withTiming(memberRefresh: number, keepAlive: number, keepAliveThreshold: number, healthReport: number, stabiliseTimeout: number): OrchestratorConfigBuilder;
}
export {};
