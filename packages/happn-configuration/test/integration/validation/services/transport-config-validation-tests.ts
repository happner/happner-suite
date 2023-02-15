/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('transport configuration validation tests', function () {
  it('validates full system config', () => {
    const validator = new ConfigValidator('1.0.0', mockLogger);
    const config = createValidSubscriptionConfig();

    const result = validator.validateTransportConfig(config);

    expect(result.valid).to.equal(true);
  });
});

function createValidSubscriptionConfig() {
  return {
    config: {
      mode: 'testMode',
      key: 'test12af4ed629g',
      cert: 'cert123g123iurf132ui12df3t12',
      keyPath: '/key/path',
      certPath: '/cert/path',
      keepAliveTimeout: 60000,
    },
  };
}
