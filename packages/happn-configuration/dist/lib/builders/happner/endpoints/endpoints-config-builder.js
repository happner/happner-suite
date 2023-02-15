"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _EndpointConfigBuilder_parent;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointConfigBuilder = exports.EndpointsConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
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
    constructor(parent) {
        super();
        _EndpointConfigBuilder_parent.set(this, void 0);
        __classPrivateFieldSet(this, _EndpointConfigBuilder_parent, parent, "f");
    }
    withName(name) {
        __classPrivateFieldGet(this, _EndpointConfigBuilder_parent, "f").set(`${name}`, this, BaseBuilder.Types.OBJECT);
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
        return __classPrivateFieldGet(this, _EndpointConfigBuilder_parent, "f");
    }
}
exports.EndpointConfigBuilder = EndpointConfigBuilder;
_EndpointConfigBuilder_parent = new WeakMap();
