/* eslint-disable @typescript-eslint/no-var-requires */
// noinspection JSDeprecatedSymbols

import { OrchestratorConfigBuilder } from './orchestrator-config-builder';

const BaseBuilder = require('happn-commons/lib/base-builder');

export class OrchestratorConfigBuilderV2 extends OrchestratorConfigBuilder {
  constructor() {
    super();
  }

  withServiceName(serviceName: string): OrchestratorConfigBuilderV2 {
    this.set(`config.serviceName`, serviceName, BaseBuilder.Types.STRING);
    return this;
  }

  withDeploymentName(deployment: string): OrchestratorConfigBuilderV2 {
    this.set(`config.deployment`, deployment, BaseBuilder.Types.STRING);
    return this;
  }

  withClusterName(clusterName: string): OrchestratorConfigBuilderV2 {
    this.set(`config.clusterName`, clusterName, BaseBuilder.Types.STRING);
    return this;
  }

  withClusterConfigItem(fieldName: string, fieldValue: number): OrchestratorConfigBuilderV2 {
    this.set(`config.cluster.${fieldName}`, fieldValue, BaseBuilder.Types.INTEGER);
    return this;
  }

  withTiming(
    memberRefresh: number,
    keepAlive: number,
    keepAliveThreshold: number,
    healthReport: number,
    stabiliseTimeout: number
  ): OrchestratorConfigBuilderV2 {
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
