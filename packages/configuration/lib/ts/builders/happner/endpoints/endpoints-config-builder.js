"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointConfigBuilder = exports.EndpointsConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class EndpointsConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    beginEndpoint() {
        return new EndpointConfigBuilder(this);
    }
}
exports.EndpointsConfigBuilder = EndpointsConfigBuilder;
class EndpointConfigBuilder extends BaseBuilder {
    #parent;
    constructor(parent) {
        super();
        this.#parent = parent;
    }
    withName(name) {
        this.#parent.set(`${name}`, this, BaseBuilder.Types.OBJECT);
        return this;
    }
    withAllowSelfSignedCerts(allow) {
        this.set('config.allowSelfSignedCerts', allow, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withHost(host) {
        this.set('config.host', host, BaseBuilder.Types.STRING);
        return this;
    }
    withPassword(password) {
        this.set('config.password', password, BaseBuilder.Types.STRING);
        return this;
    }
    withPort(port) {
        this.set('config.port', port, BaseBuilder.Types.INTEGER);
        return this;
    }
    withReconnect(max, retries) {
        this.set('reconnect.max', max, BaseBuilder.Types.INTEGER);
        this.set('reconnect.retries', retries, BaseBuilder.Types.INTEGER);
        return this;
    }
    withUrl(url) {
        this.set('config.url', url, BaseBuilder.Types.STRING);
        return this;
    }
    withUsername(username) {
        this.set('config.username', username, BaseBuilder.Types.STRING);
        return this;
    }
    endEndpoint() {
        return this.#parent;
    }
}
exports.EndpointConfigBuilder = EndpointConfigBuilder;
