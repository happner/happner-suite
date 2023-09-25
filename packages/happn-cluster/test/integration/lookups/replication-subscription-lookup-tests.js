require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  it('initializes and tests the event replication lookup', async () => {
    const deploymentId = test.commons.uuid.v4();
    const domain = `DOMAIN`;

    const replicationSubscriptionLookup =
      require('../../../lib/lookups/replication-subscription-lookup').create(deploymentId, domain);

    replicationSubscriptionLookup.addReplicationPaths('origin1', ['test/1/2/3', 'test/1/*']);
    replicationSubscriptionLookup.addReplicationPaths('origin2', [
      'test/1/2/3',
      'test/1/*',
      'test/2/*',
    ]);
    replicationSubscriptionLookup.addReplicationPaths('origin2', [
      'test/1/2/3',
      'test/1/*',
      'test/2/*',
    ]);

    const hashes = Object.keys(replicationSubscriptionLookup.replicationPaths);
    test.expect(hashes.length).to.be(2);

    let lookup = replicationSubscriptionLookup.lookupTopics('test/1/2');
    test
      .expect(lookup.sort())
      .to.eql([
        `${deploymentId}-${domain}-affe5f3f1a51ffd8b208c19c73056077-origin1`,
        `${deploymentId}-${domain}-bf995208370d693d8f7884984e45dde6-origin2`,
      ]);
    // cluster peer goes away
    replicationSubscriptionLookup.removeReplicationPaths('origin1');
    lookup = replicationSubscriptionLookup.lookupTopics('test/1/2');
    test
      .expect(lookup)
      .to.eql([`${deploymentId}-${domain}-bf995208370d693d8f7884984e45dde6-origin2`]);
  });
});
