import { OrchestratorConfigBuilder } from './orchestrator-config-builder';
export declare class OrchestratorConfigBuilderV2 extends OrchestratorConfigBuilder {
    constructor();
    withServiceName(serviceName: string): OrchestratorConfigBuilderV2;
    withDeploymentName(deployment: string): OrchestratorConfigBuilderV2;
    withClusterName(clusterName: string): OrchestratorConfigBuilderV2;
    withClusterConfigItem(fieldName: string, fieldValue: number): OrchestratorConfigBuilderV2;
    withTiming(memberRefresh: number, keepAlive: number, keepAliveThreshold: number, healthReport: number, stabiliseTimeout: number): OrchestratorConfigBuilderV2;
}
