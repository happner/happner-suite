const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class ProxyConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withProxyHost(host) {
    this.set(`config.host`, host, BaseBuilder.Types.STRING);
    return this;
  }

  withProxyPort(port) {
    this.set(`config.port`, port, BaseBuilder.Types.INTEGER);
    return this;
  }

  withProxyAllowSelfSignedCerts(allow) {
    this.set(`config.allowSelfSignedCerts`, allow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withProxyTimeout(timeout) {
    this.set(`config.timeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }

  withProxyKeyPath(path) {
    this.set(`config.keyPath`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withProxyCertPath(path) {
    this.set(`config.certPath`, path, BaseBuilder.Types.STRING);
    return this;
  }
};
