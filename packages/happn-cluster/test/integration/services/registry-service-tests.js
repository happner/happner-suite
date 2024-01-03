/* eslint-disable no-unused-vars */
const ClusterPeerBuilder = require('../../../lib/builders/cluster-peer-builder');
require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  const deploymentId = test.commons.uuid.v4();
  const clusterName = 'testClusterName';
  const MemberStatuses = require('../../../lib/constants/member-statuses');
  it('is able to scan the membership registry and find, new or missing members, and check the dependencies have been satisfied', async () => {
    const registryService = require('../../../lib/services/registry-service').create(
      {},
      mockRegistryRepository([
        [
          mockMemberEntry('goldService1', 'goldMember1', MemberStatuses.STABLE),
          mockMemberEntry('goldService2', 'goldMember2', MemberStatuses.STABLE),
          mockMemberEntry('goldService3', 'goldMember3', MemberStatuses.STABLE),
          mockMemberEntry('goldService4', 'goldMember4', MemberStatuses.STABLE),
        ],
        [
          mockMemberEntry('goldService1', 'goldMember1', MemberStatuses.STABLE),
          mockMemberEntry('goldService2', 'goldMember2', MemberStatuses.UNSTABLE),
          mockMemberEntry('goldService3', 'goldMember3', MemberStatuses.STABLE),
          mockMemberEntry('goldService5', 'goldMember5', MemberStatuses.STABLE),
        ],
      ]),
      test.mockLogger()
    );
    const dependencies = {
      goldService2: 1,
      goldService4: 1,
    };

    const scanResults1 = await registryService.scan(
      deploymentId,
      clusterName,
      dependencies,
      'goldMember1',
      [MemberStatuses.STABLE]
    );

    test.expect(scanResults1.dependenciesFulfilled).to.equal(true);

    const scanResults2 = await registryService.scan(
      deploymentId,
      clusterName,
      dependencies,
      'goldMember1',
      [MemberStatuses.STABLE]
    );

    test.expect(scanResults2.dependenciesFulfilled).to.equal(false);
    test.expect(scanResults2.newMembers.length).to.equal(1);
    test.expect(scanResults2.missingSinceLastMembers.length).to.equal(2);
  });

  let port = 55e3;

  function mockMemberEntry(serviceName, memberName, status) {
    return {
      path: `${deploymentId}/${clusterName}/${serviceName}/${memberName}`,
      memberName,
      memberHost: '127.0.0.1',
      memberPort: port++,
      status,
      timestamp: Date.now(),
    };
  }

  function mockRegistryRepository(itemsToReturn) {
    class MockRepository extends require('../../../lib/repositories/base-repository') {
      async get() {
        return itemsToReturn.shift();
      }
    }
    return new MockRepository();
  }
});
