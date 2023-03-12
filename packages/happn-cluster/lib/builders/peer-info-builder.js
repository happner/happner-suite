const BaseBuilder = require('happn-commons').BaseBuilder;
module.exports = class PeerInfoBuilder extends BaseBuilder {
  constructor() {
    super();
  }
  static create() {
    return new PeerInfoBuilder();
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
  withMemberStatus(memberStatus) {
    return this.set('memberStatus', memberStatus, BaseBuilder.Types.INTEGER);
  }
};
