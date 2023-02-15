/* eslint-disable no-console */
import { MembershipConfigBuilder } from '../../../../lib/builders/happn/services/membership-config-builder';
import { expect } from 'chai';

describe('membership configuration builder tests', function () {
  it('builds a membership config object', () => {
    const mockClusterName = 'mock-cluster';
    const mockDisseminationFactor = 2;
    const mockHost = '192.168.1.30';
    const mockJoinType = 'testType';
    const mockJoinTimeout = 2000;
    const mockMemberHost = '192.168.1.20';
    const mockPingInterval = 1000;
    const mockPingTimeout = 1000;
    const mockPingReqTimeout = 2000;
    const mockPingReqGroupSize = 10;
    const mockPort = 5200;
    const mockRandomWait = 2500;
    const mockIsSeed = true;
    const mockSeedWait = 5000;
    const mockMaxUdpDgramSize = 20;

    const builder = new MembershipConfigBuilder();
    const result = builder
      .withMembershipClusterName(mockClusterName)
      .withMembershipDisseminationFactor(mockDisseminationFactor)
      .withMembershipHost(mockHost)
      .withMembershipJoinType(mockJoinType)
      .withMembershipJoinTimeout(mockJoinTimeout)
      .withMembershipMemberHost(mockMemberHost)
      .withMembershipPingInterval(mockPingInterval)
      .withMembershipPingTimeout(mockPingTimeout)
      .withMembershipPingReqTimeout(mockPingReqTimeout)
      .withMembershipPingReqGroupSize(mockPingReqGroupSize)
      .withMembershipPort(mockPort)
      .withMembershipRandomWait(mockRandomWait)
      .withMembershipIsSeed(mockIsSeed)
      .withMembershipSeedWait(mockSeedWait)
      .withMembershipUdpMaxDgramSize(mockMaxUdpDgramSize)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result.config.clusterName).to.equal(mockClusterName);
    expect(result.config.disseminationFactor).to.equal(mockDisseminationFactor);
    expect(result.config.host).to.equal(mockHost);
    expect(result.config.joinType).to.equal(mockJoinType);
    expect(result.config.joinTimeout).to.equal(mockJoinTimeout);
    expect(result.config.hosts[0]).to.equal(mockMemberHost);
    expect(result.config.pingInterval).to.equal(mockPingInterval);
    expect(result.config.pingTimeout).to.equal(mockPingTimeout);
    expect(result.config.pingReqTimeout).to.equal(mockPingReqTimeout);
    expect(result.config.pingReqGroupSize).to.equal(mockPingReqGroupSize);
    expect(result.config.port).to.equal(mockPort);
    expect(result.config.randomWait).to.equal(mockRandomWait);
    expect(result.config.seed).to.equal(mockIsSeed);
    expect(result.config.seedWait).to.equal(mockSeedWait);
    expect(result.config.udp.maxDgramSize).to.equal(mockMaxUdpDgramSize);
  });

  it('builds a membership config object with minimal ping parameters', () => {
    const mockClusterName = 'mock-cluster';
    const mockDisseminationFactor = 2;
    const mockHost = '192.168.1.30';
    const mockJoinType = 'testType';
    const mockJoinTimeout = 2000;
    const mockMemberHost = '192.168.1.20';
    const mockPingInterval = 1000;
    const mockPort = 5200;
    const mockRandomWait = 2500;
    const mockIsSeed = true;
    const mockSeedWait = 5000;
    const mockMaxUdpDgramSize = 20;

    const builder = new MembershipConfigBuilder();
    const result = builder
      .withMembershipClusterName(mockClusterName)
      .withMembershipDisseminationFactor(mockDisseminationFactor)
      .withMembershipHost(mockHost)
      .withMembershipJoinType(mockJoinType)
      .withMembershipJoinTimeout(mockJoinTimeout)
      .withMembershipMemberHost(mockMemberHost)
      .withMembershipPingInterval(mockPingInterval)
      .withMembershipPort(mockPort)
      .withMembershipRandomWait(mockRandomWait)
      .withMembershipIsSeed(mockIsSeed)
      .withMembershipSeedWait(mockSeedWait)
      .withMembershipUdpMaxDgramSize(mockMaxUdpDgramSize)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result.config.clusterName).to.equal(mockClusterName);
    expect(result.config.disseminationFactor).to.equal(mockDisseminationFactor);
    expect(result.config.host).to.equal(mockHost);
    expect(result.config.joinType).to.equal(mockJoinType);
    expect(result.config.joinTimeout).to.equal(mockJoinTimeout);
    expect(result.config.hosts[0]).to.equal(mockMemberHost);
    expect(result.config.pingInterval).to.equal(mockPingInterval);
    expect(result.config.port).to.equal(mockPort);
    expect(result.config.randomWait).to.equal(mockRandomWait);
    expect(result.config.seed).to.equal(mockIsSeed);
    expect(result.config.seedWait).to.equal(mockSeedWait);
    expect(result.config.udp.maxDgramSize).to.equal(mockMaxUdpDgramSize);
  });
});
