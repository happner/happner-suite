const BaseBuilder = require('happn-commons').BaseBuilder;
module.exports = class ClusterMemberBuilder extends BaseBuilder {
  constructor() {
    super();
  }
  static create() {
    return new ClusterMemberBuilder();
  }
  build() {
    return super.build(require('../objects/cluster-member-object').create());
  }
  withDeploymentId(deploymentId) {
    return this.set('deploymentId', deploymentId, BaseBuilder.Types.STRING);
  }
  withClusterName(clusterName) {
    return this.set('clusterName', clusterName, BaseBuilder.Types.STRING);
  }
  withServiceName(serviceName) {
    return this.set('serviceName', serviceName, BaseBuilder.Types.STRING);
  }
  withMemberName(memberName) {
    return this.set('memberName', memberName, BaseBuilder.Types.STRING);
  }
  withMemberHost(memberHost) {
    return this.set('memberHost', memberHost, BaseBuilder.Types.STRING);
  }
  withMemberPort(memberPort) {
    return this.set('memberPort', memberPort, BaseBuilder.Types.INTEGER);
  }
};
