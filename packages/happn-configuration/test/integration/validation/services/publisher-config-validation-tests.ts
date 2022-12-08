/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('publisher configuration validation tests', function () {
  it('validates full publisher config', () => {
    const validator = new ConfigValidator(mockLogger);
    const config = createValidPublisherConfig();

    const result = validator.validatePublisherConfig(config);

    expect(result.valid).to.equal(true);
  });
});

function createValidPublisherConfig() {
  return {
    config: {
      timeout: 2000,
      publicationOptions: {
        acknowledgeTimeout: 1000,
      },
    },
  };
}
