/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates full publisher config', () => {
    const validator = new ConfigValidator();
    const config = createValidPublisherConfig();

    const result = validator.validatePublisherConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidPublisherConfig() {
  return {
    config: {
      timeout: 2000,
      publicationOptions: {
        acknowledgeTimeout: true,
      },
    },
  };
}
