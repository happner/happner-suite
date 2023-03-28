module.exports = class ClusterPeerBuilder extends require('./cluster-member-builder') {
  constructor() {
    super();
  }
  static create() {
    return new ClusterPeerBuilder();
  }
  build() {
    return super.build(require('../pojos/cluster-peer-pojo').create());
  }
  withMemberStatus(memberStatus) {
    return this.set('memberStatus', memberStatus, ClusterPeerBuilder.Types.INTEGER);
  }
  withTimestamp(timestamp) {
    return this.set('timestamp', timestamp, ClusterPeerBuilder.Types.INTEGER);
  }
  withMembershipPath(membershipPath) {
    return this.set('membershipPath', membershipPath, ClusterPeerBuilder.Types.STRING);
  }
};
