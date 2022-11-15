const BaseBuilder = require('happn-commons/lib/base-builder');

export class ProxyConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withProxyAllowSelfSignedCerts(allow: boolean): ProxyConfigBuilder {
    this.set(`config.allowSelfSignedCerts`, allow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withProxyCertPath(path: string): ProxyConfigBuilder {
    this.set(`config.certPath`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withProxyHost(host: string): ProxyConfigBuilder {
    this.set(`config.host`, host, BaseBuilder.Types.STRING);
    return this;
  }

  withProxyKeyPath(path: string): ProxyConfigBuilder {
    this.set(`config.keyPath`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withProxyPort(port: number): ProxyConfigBuilder {
    this.set(`config.port`, port, BaseBuilder.Types.INTEGER);
    return this;
  }

  withProxyTimeout(timeout: number): ProxyConfigBuilder {
    this.set(`config.timeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }
}
