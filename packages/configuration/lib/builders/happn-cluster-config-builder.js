const BaseBuilder = require('happn-commons/lib/base-builder');
const HappnConfigBuilder = require('./happn-config-builder');

module.exports = class HappnClusterConfigBuilder extends HappnConfigBuilder {
  constructor() {
    super();
  }

  withHealthConfigBuilder(healthBuilder) {
    this.set(`health`, healthBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withMembershipConfigBuilder(membershipBuilder) {
    this.set(`membership`, membershipBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withOrchestratorConfigBuilder(orchestratorBuilder) {
    this.set(`orchestrator`, orchestratorBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withProxyConfigBuilder(proxyBuilder) {
    this.set(`proxy`, proxyBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withReplicatorConfigBuilder(replicatorBuilder) {
    this.set(`replicator`, replicatorBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }
};
