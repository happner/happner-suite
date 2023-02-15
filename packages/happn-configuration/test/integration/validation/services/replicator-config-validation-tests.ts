/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('replicator configuration validation tests', function () {
  const validator = new ConfigValidator('1.0.0', mockLogger);

  it('validates full replicator config', () => {
    const proxyConfig = createValidReplicatorConfig();
    const result = validator.validateReplicatorConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  securityChangesetReplicateInterval
   */

  it('validates replicator config with missing securityChangesetReplicateInterval', () => {
    const proxyConfig = createValidReplicatorConfig();
    delete proxyConfig.config.securityChangesetReplicateInterval;

    const result = validator.validateReplicatorConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  // it('invalidates replicator config with invalid allowSelfSignedCerts', () => {
  //   const proxyConfig = createValidReplicatorConfig();
  //   proxyConfig.config.securityChangesetReplicateInterval = 'invalid-type';
  //
  //   const result = validator.validateReplicatorConfig(proxyConfig);
  //
  //   expect(result.valid).to.equal(false);
  //   expect(result.errors[0].message).to.equal('must be integer');
  // });
});

function createValidReplicatorConfig() {
  return {
    config: {
      securityChangesetReplicateInterval: 5000,
    },
  };
}
