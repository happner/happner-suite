/* eslint-disable no-console */
import { EndpointsConfigBuilder } from '../../../../lib/builders/happner/endpoints/endpoints-config-builder';
import { expect } from 'chai';

describe('endpoints configuration builder tests', function () {
  it('builds an endpoints config object', () => {
    const mockName = 'mock-name';
    const mockAllowSelfSignedCerts = true;
    const mockHost = '192.168.1.125';
    const mockPort = 1234;
    const mockUrl = 'https://test.com';
    const mockReconnectMax = 25;
    const mockReconnectRetries = 20;
    const mockUsername = 'user1';
    const mockPassword = 'superSecretPassword';

    const builder = new EndpointsConfigBuilder();
    const result = builder
      .beginEndpoint()
      .withName(mockName)
      .withAllowSelfSignedCerts(mockAllowSelfSignedCerts)
      .withHost(mockHost)
      .withPort(mockPort)
      .withUrl(mockUrl)
      .withUsername(mockUsername)
      .withPassword(mockPassword)
      .withReconnect(mockReconnectMax, mockReconnectRetries)
      .endEndpoint()
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result[mockName].config.allowSelfSignedCerts).to.equal(mockAllowSelfSignedCerts);
    expect(result[mockName].config.host).to.equal(mockHost);
    expect(result[mockName].config.port).to.equal(mockPort);
    expect(result[mockName].config.url).to.equal(mockUrl);
    expect(result[mockName].config.username).to.equal(mockUsername);
    expect(result[mockName].config.password).to.equal(mockPassword);
    expect(result[mockName].reconnect.max).to.equal(mockReconnectMax);
    expect(result[mockName].reconnect.retries).to.equal(mockReconnectRetries);
  });
});
