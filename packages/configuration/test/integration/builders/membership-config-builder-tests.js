/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const MembershipConfigBuilder = require('../../../lib/builders/services/membership-config-builder');

describe(helper.testName(), function () {
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
    helper.expect(result.config.clusterName).to.equal(mockClusterName);
    helper.expect(result.config.disseminationFactor).to.equal(mockDisseminationFactor);
    helper.expect(result.config.host).to.equal(mockHost);
    helper.expect(result.config.joinType).to.equal(mockJoinType);
    helper.expect(result.config.joinTimeout).to.equal(mockJoinTimeout);
    helper.expect(result.config.hosts[0]).to.equal(mockMemberHost);
    helper.expect(result.config.pingInterval).to.equal(mockPingInterval);
    helper.expect(result.config.pingTimeout).to.equal(mockPingTimeout);
    helper.expect(result.config.pingReqTimeout).to.equal(mockPingReqTimeout);
    helper.expect(result.config.pingReqGroupSize).to.equal(mockPingReqGroupSize);
    helper.expect(result.config.port).to.equal(mockPort);
    helper.expect(result.config.randomWait).to.equal(mockRandomWait);
    helper.expect(result.config.seed).to.equal(mockIsSeed);
    helper.expect(result.config.seedWait).to.equal(mockSeedWait);
    helper.expect(result.config.udp.maxDgramSize).to.equal(mockMaxUdpDgramSize);
  });
});
