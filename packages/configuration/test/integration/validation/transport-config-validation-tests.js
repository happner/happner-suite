/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates full system config', () => {
    const validator = new ConfigValidator();
    const config = createValidSubscriptionConfig();

    const result = validator.validateTransportConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidSubscriptionConfig() {
  return {
    config: {
      mode: 'testMode',
      key: 'test12af4ed629g',
      cert: 'cert123g123iurf132ui12df3t12',
      keyPath: '/key/path',
      certPath: '/cert/path',
      keepAliveTimeout: 60000,
    },
  };
}
