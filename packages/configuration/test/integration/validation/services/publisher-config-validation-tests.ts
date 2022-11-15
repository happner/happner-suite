/* eslint-disable no-console,no-unused-vars */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

describe('publisher configuration validation tests', function () {
  it('validates full publisher config', () => {
    const validator = new ConfigValidator();
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
        acknowledgeTimeout: true,
      },
    },
  };
}
