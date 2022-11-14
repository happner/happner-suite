/* eslint-disable no-console */
const { ReplicatorConfigBuilder } = require('../../../../lib/ts/builders/happn/services/replicator-config-builder');
const helper = require('happn-commons-test/lib/base-test-helper').create();

describe(helper.testName(), function () {
  it('builds a replicator config object', () => {
    const mockInterval = 5000;

    const builder = new ReplicatorConfigBuilder();
    const result = builder.withReplicatorSecurityChangeSetReplicateInterval(mockInterval).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    helper.expect(result.config.securityChangesetReplicateInterval).to.equal(mockInterval);
  });
});
