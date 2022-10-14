/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates full protocol config', () => {
    const validator = new ConfigValidator();
    const config = createValidProtocolConfig();

    const result = validator.validateProtocolConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidProtocolConfig() {
  return {
    config: {
      allowNestedPermissions: true,
      inboundLayers: [null],
      outboundLayers: [null],
      secure: true,
    },
  };
}
