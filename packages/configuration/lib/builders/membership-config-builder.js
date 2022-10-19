const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class MembershipConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withMembershipClusterName(name) {
    this.set(`config.clusterName`, name, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipSeed(isSeed) {
    this.set(`config.seed`, isSeed, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withMembershipSeedWait(wait) {
    this.set(`config.seedWait`, wait, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipRandomWait(wait) {
    this.set(`config.randomWait`, wait, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipJoinType(joinType) {
    this.set(`config.joinType`, joinType, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipHost(host) {
    this.set(`config.host`, host, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipMemberHost(host) {
    this.push(`config.hosts`, host, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipPort(host) {
    this.set(`config.port`, host, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipJoinTimeout(timeout) {
    this.set(`config.joinTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPingInterval(interval) {
    this.set(`config.pingInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPingTimeout(timeout) {
    this.set(`config.pingTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPingReqTimeout(timeout) {
    this.set(`config.pingReqTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPingReqGroupSize(size) {
    this.set(`config.pingReqGroupSize`, size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipUdpMaxDgramSize(size) {
    this.set(`config.udp.maxDgramSize`, size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipDisseminationFactor(factor) {
    this.set(`config.disseminationFactor`, factor, BaseBuilder.Types.INTEGER);
    return this;
  }
};
