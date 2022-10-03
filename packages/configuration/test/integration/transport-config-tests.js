/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const TransportConfigBuilder = require('../../lib/builders/transport/transport-config-builder');

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

    helper.expect(result.mode).to.equal(mockMode);
    helper.expect(result.key).to.equal(mockKey);
    helper.expect(result.cert).to.equal(mockCert);
    helper.expect(result.keyPath).to.equal(mockKeyPath);
    helper.expect(result.certPath).to.equal(mockCertPath);
    helper.expect(result.keepAliveTimeout).to.equal(mockKeepAliveTimeout);
  });
});
