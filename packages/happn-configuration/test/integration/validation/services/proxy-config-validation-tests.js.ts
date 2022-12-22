/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('proxy configuration validation tests', function () {
  const validator = new ConfigValidator(mockLogger);

  it('validates full proxy config', () => {
    const proxyConfig = createValidProxyConfig();
    const result = validator.validateProxyConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  allowSelfSignedCerts
   */

  it('validates proxy config with missing allowSelfSignedCerts', () => {
    const proxyConfig = createValidProxyConfig();
    delete proxyConfig.config.allowSelfSignedCerts;

    const result = validator.validateProxyConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  certPath
   */

  it('validates proxy config with missing certPath', () => {
    const proxyConfig = createValidProxyConfig();
    delete proxyConfig.config.certPath;

    const result = validator.validateProxyConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  host
   */

  it('validates proxy config with missing host', () => {
    const proxyConfig = createValidProxyConfig();
    delete proxyConfig.config.host;

    const result = validator.validateProxyConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  keyPath
   */

  it('validates proxy config with missing keyPath', () => {
    const proxyConfig = createValidProxyConfig();
    delete proxyConfig.config.keyPath;

    const result = validator.validateProxyConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  port
   */

  it('validates proxy config with missing port', () => {
    const proxyConfig = createValidProxyConfig();
    delete proxyConfig.config.port;

    const result = validator.validateProxyConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  timeout
   */

  it('validates proxy config with missing timeout', () => {
    const proxyConfig = createValidProxyConfig();
    delete proxyConfig.config.timeout;

    const result = validator.validateProxyConfig(proxyConfig);

    expect(result.valid).to.equal(true);
  });
});

function createValidProxyConfig() {
  return {
    config: {
      allowSelfSignedCerts: true,
      certPath: 'cert/path',
      host: '192.168.1.25',
      keyPath: 'key/path',
      port: 5000,
      timeout: 2000,
    },
  };
}
