/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates full protocol config', () => {
    const validator = new ConfigValidator();
    const protocolConfig = createValidProtocolConfig();

    const result = validator.validateProtocolConfig(protocolConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates protocol config with valid inbound layer function', () => {
    const validator = new ConfigValidator();
    const protocolConfig = createValidProtocolConfig();

    const inboundFunc = (arg1, cb) => {};

    protocolConfig.config.inboundLayers.push(inboundFunc);

    const result = validator.validateProtocolConfig(protocolConfig);
    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates protocol config with invalid inbound layer function', () => {
    const validator = new ConfigValidator();
    const protocolConfig = createValidProtocolConfig();

    // single arg
    const inboundFunc = (arg1) => {};

    protocolConfig.config.inboundLayers.push(inboundFunc);

    const result = validator.validateProtocolConfig(protocolConfig);
    helper.expect(result.valid).to.equal(false);
  });
});

function createValidProtocolConfig() {
  return {
    config: {
      allowNestedPermissions: true,
      inboundLayers: [],
      outboundLayers: [],
    },
  };
}
