/* eslint-disable no-console */
import { ProxyConfigBuilder } from '../../../../lib/builders/happn/services/proxy-config-builder';
import { expect } from 'chai';

describe('proxy configuration builder tests', function () {
  it('builds a proxy config object', () => {
    const mockAllowSelfSignedCerts = true;
    const mockCertPath = 'cert/path';
    const mockHost = '192.168.1.25';
    const mockKeyPath = 'key/path';
    const mockPort = 5000;
    const mockTimeout = 2000;

    const builder = new ProxyConfigBuilder();
    const result = builder
      .withProxyAllowSelfSignedCerts(mockAllowSelfSignedCerts)
      .withProxyCertPath(mockCertPath)
      .withProxyHost(mockHost)
      .withProxyKeyPath(mockKeyPath)
      .withProxyPort(mockPort)
      .withProxyTimeout(mockTimeout)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result.config.allowSelfSignedCerts).to.equal(mockAllowSelfSignedCerts);
    expect(result.config.certPath).to.equal(mockCertPath);
    expect(result.config.host).to.equal(mockHost);
    expect(result.config.keyPath).to.equal(mockKeyPath);
    expect(result.config.port).to.equal(mockPort);
    expect(result.config.timeout).to.equal(mockTimeout);
  });
});
