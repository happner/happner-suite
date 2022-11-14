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
var _HappnerConfigurationBuilder_componentsConfigBuilder, _HappnerConfigurationBuilder_endpointsConfigBuilder, _HappnerConfigurationBuilder_modulesConfigBuilder;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnerConfigurationBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const happn_configuration_builder_1 = require("../happn/happn-configuration-builder");
class HappnerConfigurationBuilder extends happn_configuration_builder_1.HappnConfigurationBuilder {
    constructor(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder, componentsConfigBuilder, endpointsConfigBuilder, modulesConfigBuilder) {
        super(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder);
        _HappnerConfigurationBuilder_componentsConfigBuilder.set(this, void 0);
        _HappnerConfigurationBuilder_endpointsConfigBuilder.set(this, void 0);
        _HappnerConfigurationBuilder_modulesConfigBuilder.set(this, void 0);
        __classPrivateFieldSet(this, _HappnerConfigurationBuilder_componentsConfigBuilder, componentsConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnerConfigurationBuilder_endpointsConfigBuilder, endpointsConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnerConfigurationBuilder_modulesConfigBuilder, modulesConfigBuilder, "f");
    }
    withName(name) {
        this.set('name', name, super.Types.STRING);
        return this;
    }
    withDeferListen(defer) {
        this.set('deferListen', defer, super.Types.BOOLEAN);
        return this;
    }
    withListenFirst(listenFirst) {
        this.set('listenFirst', listenFirst, super.Types.BOOLEAN);
        return this;
    }
    beginComponent() {
        return __classPrivateFieldGet(this, _HappnerConfigurationBuilder_componentsConfigBuilder, "f").beginComponent();
    }
    build() {
        const happnConfig = super.build();
        const happnerBuilder = new BaseBuilder();
        happnerBuilder.set('endpoints', __classPrivateFieldGet(this, _HappnerConfigurationBuilder_endpointsConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        happnerBuilder.set('modules', __classPrivateFieldGet(this, _HappnerConfigurationBuilder_modulesConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        happnerBuilder.set('components', __classPrivateFieldGet(this, _HappnerConfigurationBuilder_componentsConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        const happnerConfig = happnerBuilder.build();
        return Object.assign({ happn: happnConfig }, happnerConfig);
    }
}
exports.HappnerConfigurationBuilder = HappnerConfigurationBuilder;
_HappnerConfigurationBuilder_componentsConfigBuilder = new WeakMap(), _HappnerConfigurationBuilder_endpointsConfigBuilder = new WeakMap(), _HappnerConfigurationBuilder_modulesConfigBuilder = new WeakMap();
//# sourceMappingURL=happner-configuration-builder.js.map