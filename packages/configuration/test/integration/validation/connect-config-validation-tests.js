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

  it('validates connect config with missing exclusions', () => {
    const cacheConfig = createValidConnectConfig();
    delete cacheConfig.config.middleware.security.exclusions;

    let result = validator.validateConnectConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates connect config with invalid exclusions', () => {
    const cacheConfig = createValidConnectConfig();
    cacheConfig.config.middleware.security.exclusions = '';

    let result = validator.validateConnectConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be array');
  });

  it('validates connect config with missing forbiddenResponsePath', () => {
    const cacheConfig = createValidConnectConfig();
    delete cacheConfig.config.middleware.security.forbiddenResponsePath;

    let result = validator.validateConnectConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates connect config with invalid forbiddenResponsePath', () => {
    const cacheConfig = createValidConnectConfig();
    cacheConfig.config.middleware.security.forbiddenResponsePath = 1243434;

    let result = validator.validateConnectConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  it('validates connect config with missing unauthorizedResponsePath', () => {
    const cacheConfig = createValidConnectConfig();
    delete cacheConfig.config.middleware.security.unauthorizedResponsePath;

    let result = validator.validateConnectConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates connect config with invalid unauthorizedResponsePath', () => {
    const cacheConfig = createValidConnectConfig();
    cacheConfig.config.middleware.security.unauthorizedResponsePath = 1243434;

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
          exclusions: ['/exclusion/path/*'],
          forbiddenResponsePath: '/forbidden',
          unauthorizedResponsePath: '/unauthorized',
        },
      },
    },
  };
}
