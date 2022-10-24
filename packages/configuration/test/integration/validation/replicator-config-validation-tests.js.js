/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full replicator config', () => {
    const proxyConfig = createValidReplicatorConfig();
    const result = validator.validateReplicatorConfig(proxyConfig);

    helper.expect(result.valid).to.equal(true);
  });

  /*
  securityChangesetReplicateInterval
   */

  it('validates replicator config with missing securityChangesetReplicateInterval', () => {
    const proxyConfig = createValidReplicatorConfig();
    delete proxyConfig.config.securityChangesetReplicateInterval;

    const result = validator.validateReplicatorConfig(proxyConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates replicator config with invalid allowSelfSignedCerts', () => {
    const proxyConfig = createValidReplicatorConfig();
    proxyConfig.config.securityChangesetReplicateInterval = 'invalid-type';

    const result = validator.validateReplicatorConfig(proxyConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });
});

function createValidReplicatorConfig() {
  return {
    config: {
      securityChangesetReplicateInterval: 5000,
    },
  };
}
