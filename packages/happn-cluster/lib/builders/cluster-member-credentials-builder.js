const CredentialsBuilder = require('./credentials-builder');
module.exports = class ClusterMemberCredentialsBuilder extends CredentialsBuilder {
  constructor() {
    super();
  }
  static create() {
    return new ClusterMemberCredentialsBuilder();
  }
  build() {
    return super.build(require('../pojos/cluster-member-credentials-pojo').create());
  }
  withClusterMemberInfo(info) {
    return this.set('info', info, ClusterMemberCredentialsBuilder.Types.OBJECT);
  }
};
