/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class OrchestratorConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withOrchestratorMinimumPeers(peerCount: number): OrchestratorConfigBuilder {
    this.set(`config.minimumPeers`, peerCount, BaseBuilder.Types.INTEGER);
    return this;
  }

  withOrchestratorReplicatePath(path: string): OrchestratorConfigBuilder {
    this.push(`config.replicate`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withOrchestratorStableReportInterval(interval: number): OrchestratorConfigBuilder {
    this.set(`config.stableReportInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout: number): OrchestratorConfigBuilder {
    this.set(`config.stabiliseTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }
}
