/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('endpoints configuration validation tests', function () {
  const validator = new ConfigValidator(mockLogger);

  it('validates full endpoints config', () => {
    const config = createValidEndpointsConfig();
    const result = validator.validateEndpointsConfig(config);

    expect(result.valid).to.equal(true);
  });
});

function createValidEndpointsConfig() {
  return {
    'mock-name': {
      config: {
        allowSelfSignedCerts: true,
        host: '192.168.1.125',
        port: 1234,
        url: 'https://test.com',
        username: 'user1',
        password: 'superSecretPassword',
      },
      reconnect: {
        max: 25,
        retries: 20,
      },
    },
  };
}
