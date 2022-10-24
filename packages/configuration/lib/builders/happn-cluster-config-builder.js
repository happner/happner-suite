const HappnConfigBuilder = require('./happn-config-builder');
const ROOT = require('../constants/config-constants').HAPPN_CONFIG_ROOT;

module.exports = class HappnConfigBuilder extends HappnConfigBuilder {
  constructor() {
    super();
  }

  withHealthConfigBuilder(healthBuilder) {
    this.set(`${ROOT}.health`, healthBuilder, HappnConfigBuilder.Types.OBJECT);
    return this;
  }

  withMembershipConfigBuilder(membershipBuilder) {
    this.set(`${ROOT}.membership`, membershipBuilder, HappnConfigBuilder.Types.OBJECT);
    return this;
  }

  withOrchestratorConfigBuilder(orchestratorBuilder) {
    this.set(`${ROOT}.orchestrator`, orchestratorBuilder, HappnConfigBuilder.Types.OBJECT);
    return this;
  }

  withProxyConfigBuilder(proxyBuilder) {
    this.set(`${ROOT}.proxy`, proxyBuilder, HappnConfigBuilder.Types.OBJECT);
    return this;
  }

  withReplicatorConfigBuilder(replicatorBuilder) {
    this.set(`${ROOT}.replicator`, replicatorBuilder, HappnConfigBuilder.Types.OBJECT);
    return this;
  }
};
