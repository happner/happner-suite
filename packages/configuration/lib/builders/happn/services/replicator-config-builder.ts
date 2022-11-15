const BaseBuilder = require('happn-commons/lib/base-builder');

export class ReplicatorConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withReplicatorSecurityChangeSetReplicateInterval(interval: number): ReplicatorConfigBuilder {
    this.set(`config.securityChangesetReplicateInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }
};
