const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class ReplicatorConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withReplicatorSecurityChangeSetReplicateInterval(interval) {
    this.set(`config.securityChangesetReplicateInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }
};
