/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates full system config', () => {
    const validator = new ConfigValidator();
    const config = createValidSubscriptionConfig();

    const result = validator.validateSystemConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidSubscriptionConfig() {
  return {
    config: {
      name: 'testName',
    },
  };
}
