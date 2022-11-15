/* eslint-disable no-console,no-unused-vars */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

describe('subscription configuration validation tests', function () {
  it('validates full subscription config', () => {
    const validator = new ConfigValidator();
    const config = createValidSubscriptionConfig();

    const result = validator.validateSubscriptionConfig(config);

    expect(result.valid).to.equal(true);
  });
});

function createValidSubscriptionConfig() {
  return {
    config: {
      allowNestedPermissions: true,
      subscriptionTree: {
        permutationCache: 5000,
        searchCache: 10000,
        timeout: 20000,
      },
    },
  };
}
