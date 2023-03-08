/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('health configuration validation tests', function () {
  const validator = new ConfigValidator(mockLogger);

  it('validates full health config', () => {
    const healthConfig = createValidHealthConfig();
    const result = validator.validateHealthConfig(healthConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates health config with missing warmupLimit', () => {
    const healthConfig = createValidHealthConfig();
    delete healthConfig.config.warmupLimit;

    const result = validator.validateHealthConfig(healthConfig);

    expect(result.valid).to.equal(true);
  });

  // it('invalidates health config with invalid warmupLimit', () => {
  //   const healthConfig = createValidHealthConfig();
  //   healthConfig.config.warmupLimit = 'invalid-limit';
  //
  //   const result = validator.validateHealthConfig(healthConfig);
  //
  //   expect(result.valid).to.equal(false);
  //   expect(result.errors[0].message).to.equal('must be integer');
  // });

  it('validates health config with missing healthInterval', () => {
    const healthConfig = createValidHealthConfig();
    delete healthConfig.config.healthInterval;

    const result = validator.validateHealthConfig(healthConfig);

    expect(result.valid).to.equal(true);
  });

  // it('invalidates health config with invalid healthInterval', () => {
  //   const healthConfig = createValidHealthConfig();
  //   healthConfig.config.healthInterval = 'invalid-interval';
  //
  //   const result = validator.validateHealthConfig(healthConfig);
  //
  //   expect(result.valid).to.equal(false);
  //   expect(result.errors[0].message).to.equal('must be integer');
  // });
});

function createValidHealthConfig() {
  return {
    config: {
      warmupLimit: 1000,
      healthInterval: 5000,
    },
  };
}
