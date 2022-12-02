/* eslint-disable no-console,no-unused-vars */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

describe('system configuration validation tests', function () {
  it('validates full system config', () => {
    const validator = new ConfigValidator();
    const config = createValidSubscriptionConfig();

    const result = validator.validateSystemConfig(config);

    expect(result.valid).to.equal(true);
  });
});

function createValidSubscriptionConfig() {
  return {
    config: {
      name: 'testName',
    },
  };
}
