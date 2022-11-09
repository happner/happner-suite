/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full endpoints config', () => {
    const config = createValidEndpointsConfig();
    const result = validator.validateEndpointsConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidEndpointsConfig() {
  return {
    'mock-name': {
      config: {
        allowSelfSignedCerts: true,
        host: '192.168.1.125',
        port: 1234,
        url: 'https://test.com',
        username: 'user1',
        password: 'superSecretPassword',
      },
      reconnect: {
        max: 25,
        retries: 20,
      },
    },
  };
}
