const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class OrchestratorConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withOrchestratorStableReportInterval(interval) {
    this.set(`config.stableReportInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout) {
    this.set(`config.stabiliseTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withOrchestratorMinimumPeers(peerCount) {
    this.set(`config.minimumPeers`, peerCount, BaseBuilder.Types.INTEGER);
    return this;
  }

  withOrchestratorReplicatePath(path) {
    this.push(`config.replicate`, path, BaseBuilder.Types.STRING);
    return this;
  }
};
