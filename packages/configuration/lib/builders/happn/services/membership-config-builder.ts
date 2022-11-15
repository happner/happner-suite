const BaseBuilder = require('happn-commons/lib/base-builder');

export class MembershipConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withMembershipClusterName(name: string): MembershipConfigBuilder {
    this.set(`config.clusterName`, name, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipDisseminationFactor(factor: number): MembershipConfigBuilder {
    this.set(`config.disseminationFactor`, factor, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipHost(host: string): MembershipConfigBuilder {
    this.set(`config.host`, host, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipJoinTimeout(timeout: number): MembershipConfigBuilder {
    this.set(`config.joinTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipJoinType(joinType: string): MembershipConfigBuilder {
    this.set(`config.joinType`, joinType, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipMemberHost(host: string): MembershipConfigBuilder {
    this.push(`config.hosts`, host, BaseBuilder.Types.STRING);
    return this;
  }

  withMembershipPingInterval(interval: number): MembershipConfigBuilder {
    this.set(`config.pingInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPingTimeout(timeout: number): MembershipConfigBuilder {
    this.set(`config.pingTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPingReqTimeout(timeout: number): MembershipConfigBuilder {
    this.set(`config.pingReqTimeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPingReqGroupSize(size: number): MembershipConfigBuilder {
    this.set(`config.pingReqGroupSize`, size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipPort(port: number): MembershipConfigBuilder {
    this.set(`config.port`, port, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipRandomWait(wait: number): MembershipConfigBuilder {
    this.set(`config.randomWait`, wait, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipIsSeed(isSeed: boolean): MembershipConfigBuilder {
    this.set(`config.seed`, isSeed, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withMembershipSeedWait(wait: number): MembershipConfigBuilder {
    this.set(`config.seedWait`, wait, BaseBuilder.Types.INTEGER);
    return this;
  }

  withMembershipUdpMaxDgramSize(size: number): MembershipConfigBuilder {
    this.set(`config.udp.maxDgramSize`, size, BaseBuilder.Types.INTEGER);
    return this;
  }
}
