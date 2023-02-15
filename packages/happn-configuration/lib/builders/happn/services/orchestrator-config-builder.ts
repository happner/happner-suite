/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class OrchestratorConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withOrchestratorMinimumPeers(peerCount: number) {
    this.set(`config.minimumPeers`, peerCount, BaseBuilder.Types.INTEGER);
    return this;
  }

  withOrchestratorReplicatePath(path: string) {
    this.push(`config.replicate`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withOrchestratorStableReportInterval(interval: number) {
    this.set(`config.stableReportInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout: number) {
    this.set(`config.stabiliseTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withServiceName(serviceName: string): OrchestratorConfigBuilder {
    this.set(`config.serviceName`, serviceName, BaseBuilder.Types.STRING);
    return this;
  }

  withDeploymentName(deployment: string): OrchestratorConfigBuilder {
    this.set(`config.deployment`, deployment, BaseBuilder.Types.STRING);
    return this;
  }

  withClusterName(clusterName: string): OrchestratorConfigBuilder {
    this.set(`config.clusterName`, clusterName, BaseBuilder.Types.STRING);
    return this;
  }

  withClusterConfigItem(fieldName: string, fieldValue: number): OrchestratorConfigBuilder {
    this.set(`config.cluster.${fieldName}`, fieldValue, BaseBuilder.Types.INTEGER);
    return this;
  }

  withTiming(
    memberRefresh: number,
    keepAlive: number,
    keepAliveThreshold: number,
    healthReport: number,
    stabiliseTimeout: number
  ): OrchestratorConfigBuilder {
    const builder = new BaseBuilder();
    builder.set('memberRefresh', memberRefresh, BaseBuilder.Types.INTEGER);
    builder.set('keepAlive', keepAlive, BaseBuilder.Types.INTEGER);
    builder.set('keepAliveThreshold', keepAliveThreshold, BaseBuilder.Types.INTEGER);
    builder.set('healthReport', healthReport, BaseBuilder.Types.INTEGER);
    if (stabiliseTimeout || this.config.stabiliseTimeout)
      builder.set(
        'healthStabiliseTimeoutReport',
        stabiliseTimeout || this.config.timing.stabiliseTimeout,
        BaseBuilder.Types.INTEGER
      );
    this.set(`config.timing`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }
}
