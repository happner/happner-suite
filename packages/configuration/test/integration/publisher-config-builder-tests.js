/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const PublisherConfigBuilder = require('../../lib/builders/publisher-config-builder');
const ConfigValidator = require('../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('builds a publisher config object', () => {
    const mockTimeout = 2000;
    const mockAcknowledge = true;

    const builder = new PublisherConfigBuilder();
    const result = builder.withTimeout(mockTimeout).withAcknowledgeTimeout(mockAcknowledge).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validator = new ConfigValidator();
    validator.validatePublisherConfig(result);

    helper.expect(result.config.timeout).to.equal(mockTimeout);
    helper.expect(result.config.publicationOptions.acknowledgeTimeout).to.equal(mockAcknowledge);
  });
});
