"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class TransportConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
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
}
exports.TransportConfigBuilder = TransportConfigBuilder;
//# sourceMappingURL=transport-config-builder.js.map