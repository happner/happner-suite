require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  it('initializes and tests the event replication cache', async () => {
    const deploymentId = test.commons.uuid.v4();
    const domain = `DOMAIN`;

    const replicationSubscriptionCache =
      require('../../../lib/caches/replication-subscription-cache').create(deploymentId, domain);

    replicationSubscriptionCache.addReplicationPaths('origin1', ['test/1/2/3', 'test/1/*']);
    replicationSubscriptionCache.addReplicationPaths('origin2', [
      'test/1/2/3',
      'test/1/*',
      'test/2/*',
    ]);
    replicationSubscriptionCache.addReplicationPaths('origin2', [
      'test/1/2/3',
      'test/1/*',
      'test/2/*',
    ]);

    const hashes = Object.keys(replicationSubscriptionCache.replicationPaths);
    test.expect(hashes.length).to.be(2);

    let lookup = replicationSubscriptionCache.lookupTopics('test/1/2');
    test
      .expect(lookup.sort())
      .to.eql([
        `${deploymentId}-${domain}-affe5f3f1a51ffd8b208c19c73056077`,
        `${deploymentId}-${domain}-bf995208370d693d8f7884984e45dde6`,
      ]);
    // cluster peer goes away
    replicationSubscriptionCache.removeReplicationPaths('origin1');
    lookup = replicationSubscriptionCache.lookupTopics('test/1/2');
    test.expect(lookup).to.eql([`${deploymentId}-${domain}-bf995208370d693d8f7884984e45dde6`]);
  });
});
