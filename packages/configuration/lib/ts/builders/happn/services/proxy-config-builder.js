"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class ProxyConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withProxyAllowSelfSignedCerts(allow) {
        this.set(`config.allowSelfSignedCerts`, allow, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withProxyCertPath(path) {
        this.set(`config.certPath`, path, BaseBuilder.Types.STRING);
        return this;
    }
    withProxyHost(host) {
        this.set(`config.host`, host, BaseBuilder.Types.STRING);
        return this;
    }
    withProxyKeyPath(path) {
        this.set(`config.keyPath`, path, BaseBuilder.Types.STRING);
        return this;
    }
    withProxyPort(port) {
        this.set(`config.port`, port, BaseBuilder.Types.INTEGER);
        return this;
    }
    withProxyTimeout(timeout) {
        this.set(`config.timeout`, timeout, BaseBuilder.Types.INTEGER);
        return this;
    }
}
exports.ProxyConfigBuilder = ProxyConfigBuilder;
//# sourceMappingURL=proxy-config-builder.js.map