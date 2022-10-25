/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const EndpointConfigBuilder = require('../../../../lib/builders/endpoints/endpoint-config-builder');

describe(helper.testName(), function () {
  it('builds an endpoint config object', () => {
    const mockName = 'mock-name';
    const mockAllowSelfSignedCerts = true;
    const mockHost = '192.168.1.125';
    const mockPort = 1234;
    const mockUrl = 'https://test.com';
    const mockReconnectMax = 25;
    const mockReconnectRetries = 20;
    const mockUsername = 'user1';
    const mockPassword = 'superSecretPassword';

    const builder = new EndpointConfigBuilder();
    const result = builder
      .withEndpointName(mockName)
      .withAllowSelfSignedCerts(mockAllowSelfSignedCerts)
      .withHost(mockHost)
      .withPort(mockPort)
      .withUrl(mockUrl)
      .withUsername(mockUsername)
      .withPassword(mockPassword)
      .withReconnect(mockReconnectMax, mockReconnectRetries)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    helper.expect(result[mockName].config.allowSelfSignedCerts).to.equal(mockAllowSelfSignedCerts);
    helper.expect(result[mockName].config.host).to.equal(mockHost);
    helper.expect(result[mockName].config.port).to.equal(mockPort);
    helper.expect(result[mockName].config.url).to.equal(mockUrl);
    helper.expect(result[mockName].config.username).to.equal(mockUsername);
    helper.expect(result[mockName].config.password).to.equal(mockPassword);
    helper.expect(result[mockName].reconnect.max).to.equal(mockReconnectMax);
    helper.expect(result[mockName].reconnect.retries).to.equal(mockReconnectRetries);
  });
});
