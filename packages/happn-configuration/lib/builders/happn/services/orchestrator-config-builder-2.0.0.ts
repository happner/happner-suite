/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
import { OrchestratorConfigBuilder as OrchestratorConfigBuilderV1 } from './orchestrator-config-builder';
interface ClusterConfig {
  [key: string]: number;
}
type TimingConfig = {
  memberRefresh?: number;
  keepAlive?: number;
  keepAliveThreshold?: number;
  healthReport?: number;
  stabiliseTimeout?: number;
};
export class OrchestratorConfigBuilder extends OrchestratorConfigBuilderV1 {
  constructor() {
    super();
  }

  withServiceName(serviceName: string): OrchestratorConfigBuilder {
    this.set(`config.serviceName`, serviceName, BaseBuilder.Types.STRING);
    return this;
  }

  withDeploymentName(deployment: string): OrchestratorConfigBuilder {
    this.ser(`config.deployment`, deployment, BaseBuilder.Types.STRING);
    return this;
  }

  withClusterName(clusterName: string): OrchestratorConfigBuilder {
    this.set(`config.clusterName`, clusterName, BaseBuilder.Types.STRING);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout: number): OrchestratorConfigBuilder {
    this.set(`config.timing.stabiliseTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withClusterConfig(config: ClusterConfig): OrchestratorConfigBuilder {
    this.set(`config.cluster`, config, BaseBuilder.Types.OBJECT);
    return this;
  }

  withTiming(timing: TimingConfig): OrchestratorConfigBuilder {
    const builder = new BaseBuilder();
    builder.set('memberRefresh', timing.memberRefresh, BaseBuilder.Types.INTEGER);
    builder.set('keepAlive', timing.keepAlive, BaseBuilder.Types.INTEGER);
    builder.set('keepAliveThreshold', timing.keepAliveThreshold, BaseBuilder.Types.INTEGER);
    builder.set('healthReport', timing.healthReport, BaseBuilder.Types.INTEGER);
    if (timing.stabiliseTimeout || this.config.stabiliseTimeout)
      builder.set(
        'healtstabiliseTimeouthReport',
        timing.stabiliseTimeout || this.config.timing.stabiliseTimeout,
        BaseBuilder.Types.INTEGER
      );
    this.set(`config.timing`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }
}
