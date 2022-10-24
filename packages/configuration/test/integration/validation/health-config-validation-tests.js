/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full health config', () => {
    const healthConfig = createValidHealthConfig();
    const result = validator.validateHealthConfig(healthConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates health config with missing warmupLimit', () => {
    const healthConfig = createValidHealthConfig();
    delete healthConfig.config.warmupLimit;

    const result = validator.validateHealthConfig(healthConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid warmupLimit', () => {
    const healthConfig = createValidHealthConfig();
    healthConfig.config.warmupLimit = 'invalid-limit';

    const result = validator.validateHealthConfig(healthConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('validates health config with missing healthInterval', () => {
    const healthConfig = createValidHealthConfig();
    delete healthConfig.config.healthInterval;

    const result = validator.validateHealthConfig(healthConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid healthInterval', () => {
    const healthConfig = createValidHealthConfig();
    healthConfig.config.healthInterval = 'invalid-interval';

    const result = validator.validateHealthConfig(healthConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });
});

function createValidHealthConfig() {
  return {
    config: {
      warmupLimit: 1000,
      healthInterval: 5000,
    },
  };
}
