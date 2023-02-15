/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('system configuration validation tests', function () {

  it('validates full system config', () => {
    const validator = new ConfigValidator(mockLogger);
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
