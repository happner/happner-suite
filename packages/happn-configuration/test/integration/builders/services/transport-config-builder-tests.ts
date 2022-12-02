/* eslint-disable no-console */
import { TransportConfigBuilder } from '../../../../lib/builders/happn/services/transport-config-builder';
import { expect } from 'chai';

describe('transport configuration builder tests', function () {
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

    expect(result.config.mode).to.equal(mockMode);
    expect(result.config.key).to.equal(mockKey);
    expect(result.config.cert).to.equal(mockCert);
    expect(result.config.keyPath).to.equal(mockKeyPath);
    expect(result.config.certPath).to.equal(mockCertPath);
    expect(result.config.keepAliveTimeout).to.equal(mockKeepAliveTimeout);
  });
});
