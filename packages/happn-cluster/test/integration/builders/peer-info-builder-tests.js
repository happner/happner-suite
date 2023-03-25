/* eslint-disable no-unused-vars */
require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  const PeerInfoBuilder = require('../../../lib/builders/peer-info-builder');
  it('is to build a peer info pojo', function () {
    const peerInfoPojo = PeerInfoBuilder.create()
      .withDeploymentId('deploymentId')
      .withClusterName('clusterName')
      .withServiceName('serviceName')
      .withMemberName('memberName')
      .withMemberHost('memberHost')
      .withMemberStatus('status')
      .build();
    test.expect(peerInfoPojo).to.eql({
      deploymentId: 'deploymentId',
      clusterName: 'clusterName',
      serviceName: 'serviceName',
      memberName: 'memberName',
      memberHost: 'memberHost',
      memberStatus: 'status',
    });
  });
});
