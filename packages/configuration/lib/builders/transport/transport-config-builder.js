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
    this.set('cert', cert, BaseBuilder.Types.STRING);
    return this;
  }

  withCertPath(certPath) {
    this.set('certPath', certPath, BaseBuilder.Types.STRING);
    return this;
  }

  withKeepAliveTimeout(timeout) {
    this.set('keepAliveTimeout', timeout, BaseBuilder.Types.NUMERIC);
    return this;
  }

  withKey(key) {
    this.set('key', key, BaseBuilder.Types.STRING);
    return this;
  }

  withKeyPath(keyPath) {
    this.set('keyPath', keyPath, BaseBuilder.Types.STRING);
    return this;
  }

  withMode(mode) {
    this.set('mode', mode, BaseBuilder.Types.STRING);
    return this;
  }
};
