/* eslint-disable no-console */
const { ProxyConfigBuilder } = require('../../../../lib/ts/builders/happn/services/proxy-config-builder');
const helper = require('happn-commons-test/lib/base-test-helper').create();

describe(helper.testName(), function () {
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
    helper.expect(result.config.allowSelfSignedCerts).to.equal(mockAllowSelfSignedCerts);
    helper.expect(result.config.certPath).to.equal(mockCertPath);
    helper.expect(result.config.host).to.equal(mockHost);
    helper.expect(result.config.keyPath).to.equal(mockKeyPath);
    helper.expect(result.config.port).to.equal(mockPort);
    helper.expect(result.config.timeout).to.equal(mockTimeout);
  });
});
