/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const TransportConfigBuilder = require('../../lib/builders/transport-config-builder');
const ConfigValidator = require('../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('builds a transport config object', () => {
    const mockMode = 'testMode';
    const mockKey = 'test12af4ed629g';
    const mockCert = 'cert123g123iurf132ui12df3t12';
    const mockCertPath = '/cert/path';
    const mockKeyPath = '/key/path';
    const mockKeepAliveTimeout = 60000;

    const builder = new TransportConfigBuilder();
    const result = builder
      .withMode(mockMode)
      .withKey(mockKey)
      .withCert(mockCert)
      .withKeyPath(mockKeyPath)
      .withCertPath(mockCertPath)
      .withKeepAliveTimeout(mockKeepAliveTimeout)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validator = new ConfigValidator();
    validator.validateTransportConfig(result);

    helper.expect(result.config.mode).to.equal(mockMode);
    helper.expect(result.config.key).to.equal(mockKey);
    helper.expect(result.config.cert).to.equal(mockCert);
    helper.expect(result.config.keyPath).to.equal(mockKeyPath);
    helper.expect(result.config.certPath).to.equal(mockCertPath);
    helper.expect(result.config.keepAliveTimeout).to.equal(mockKeepAliveTimeout);
  });
});
