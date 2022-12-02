/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class TransportConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withCert(cert: string): TransportConfigBuilder {
    this.set('config.cert', cert, BaseBuilder.Types.STRING);
    return this;
  }

  withCertPath(certPath: string): TransportConfigBuilder {
    this.set('config.certPath', certPath, BaseBuilder.Types.STRING);
    return this;
  }

  withKeepAliveTimeout(timeout: number): TransportConfigBuilder {
    this.set('config.keepAliveTimeout', timeout, BaseBuilder.Types.NUMERIC);
    return this;
  }

  withKey(key: string): TransportConfigBuilder {
    this.set('config.key', key, BaseBuilder.Types.STRING);
    return this;
  }

  withKeyPath(keyPath: string): TransportConfigBuilder {
    this.set('config.keyPath', keyPath, BaseBuilder.Types.STRING);
    return this;
  }

  withMode(mode: string): TransportConfigBuilder {
    this.set('config.mode', mode, BaseBuilder.Types.STRING);
    return this;
  }
}
