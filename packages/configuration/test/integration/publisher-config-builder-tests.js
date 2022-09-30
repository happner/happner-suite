/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const PublisherConfigBuilder = require('../../lib/builders/publisher/publisher-config-builder');

describe(helper.testName(), function () {
  it('builds a publisher config object', () => {
    const mockTimeout = 2000;
    const mockAcknowledge = true;

    const builder = new PublisherConfigBuilder();
    const result = builder.withTimeout(mockTimeout).withAcknowledgeTimeout(mockAcknowledge).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.timeout).to.equal(mockTimeout);
    helper.expect(result.publicationOptions.acknowledgeTimeout).to.equal(mockAcknowledge);
  });
});
