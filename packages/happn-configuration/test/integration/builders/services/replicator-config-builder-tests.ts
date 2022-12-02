/* eslint-disable no-console */
import { ReplicatorConfigBuilder } from '../../../../lib/builders/happn/services/replicator-config-builder';
import { expect } from 'chai';

describe('replicator configuration builder tests', function () {
  it('builds a replicator config object', () => {
    const mockInterval = 5000;

    const builder = new ReplicatorConfigBuilder();
    const result = builder.withReplicatorSecurityChangeSetReplicateInterval(mockInterval).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result.config.securityChangesetReplicateInterval).to.equal(mockInterval);
  });
});
