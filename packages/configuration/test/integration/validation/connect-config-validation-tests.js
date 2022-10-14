/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates connect config', () => {
    const validator = new ConfigValidator();
    const config = createValidConnectConfig();

    const result = validator.validateConnectConfig(config);

    helper.expect(result.valid).to.equal(true);
  });

  // TODO: negative cases
});

function createValidConnectConfig() {
  return {
    config: {
      middleware: {
        security: {
          cookieName: 'testCookie',
          cookieDomain: 'test.domain',
          exclusions: ['/exclusion/path/*'],
          forbiddenResponsePath: '/forbidden',
          unauthorizedResponsePath: '/unauthorized',
        },
      },
    },
  };
}
