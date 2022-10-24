const BaseBuilder = require('happn-commons/lib/base-builder');
module.exports = class SystemConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  /*
   transport:{
      config:{
        mode:[string],
        key:[string],
        cert:[string],
        keyPath:[string],
        certPath:[string],
        keepAliveTimeout:[int]
      }
    }
   */

  withCert(cert) {
    this.set('config.cert', cert, BaseBuilder.Types.STRING);
    return this;
  }

  withCertPath(certPath) {
    this.set('config.certPath', certPath, BaseBuilder.Types.STRING);
    return this;
  }

  withKeepAliveTimeout(timeout) {
    this.set('config.keepAliveTimeout', timeout, BaseBuilder.Types.NUMERIC);
    return this;
  }

  withKey(key) {
    this.set('config.key', key, BaseBuilder.Types.STRING);
    return this;
  }

  withKeyPath(keyPath) {
    this.set('config.keyPath', keyPath, BaseBuilder.Types.STRING);
    return this;
  }

  withMode(mode) {
    this.set('config.mode', mode, BaseBuilder.Types.STRING);
    return this;
  }
};
