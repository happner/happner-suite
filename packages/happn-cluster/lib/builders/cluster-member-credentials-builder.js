const BaseBuilder = require('happn-commons').BaseBuilder;
module.exports = class ClusterMemberCredentialsBuilder extends BaseBuilder {
  constructor() {
    super();
    this.set('username', '_ADMIN', ClusterMemberCredentialsBuilder.Types.STRING);
    this.set('password', 'happn', ClusterMemberCredentialsBuilder.Types.STRING);
  }
  static create() {
    return new ClusterMemberCredentialsBuilder();
  }
  build() {
    return super.build(require('../pojos/cluster-member-credentials-pojo').create());
  }
  withUsername(username) {
    return this.set('username', username, ClusterMemberCredentialsBuilder.Types.STRING);
  }
  withPassword(password) {
    return this.set('password', password, ClusterMemberCredentialsBuilder.Types.STRING);
  }
  withClusterMemberInfo(info) {
    return this.set('info', info, ClusterMemberCredentialsBuilder.Types.OBJECT);
  }
};
