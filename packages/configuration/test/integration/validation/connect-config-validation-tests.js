/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates connect config', () => {
    const config = createValidConnectConfig();

    const result = validator.validateConnectConfig(config);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates connect config with missing cookieName', () => {
    const cacheConfig = createValidConnectConfig();
    delete cacheConfig.config.middleware.security.cookieName;

    let result = validator.validateConnectConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates connect config with invalid cookieName', () => {
    const cacheConfig = createValidConnectConfig();
    cacheConfig.config.middleware.security.cookieName = 12312321;

    let result = validator.validateConnectConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });
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
