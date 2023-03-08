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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnerCoreBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const BaseBuilder = require('happn-commons/lib/base-builder');
function HappnerCoreBuilder(Base) {
    var _HappnerConfigurationBuilder_componentsConfigBuilder, _HappnerConfigurationBuilder_endpointsConfigBuilder, _HappnerConfigurationBuilder_modulesConfigBuilder, _a;
    return _a = class HappnerConfigurationBuilder extends Base {
            constructor(...args) {
                super(...args);
                _HappnerConfigurationBuilder_componentsConfigBuilder.set(this, void 0);
                _HappnerConfigurationBuilder_endpointsConfigBuilder.set(this, void 0);
                _HappnerConfigurationBuilder_modulesConfigBuilder.set(this, void 0);
                const container = args[0];
                __classPrivateFieldSet(this, _HappnerConfigurationBuilder_componentsConfigBuilder, container.componentsConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnerConfigurationBuilder_endpointsConfigBuilder, container.endpointsConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnerConfigurationBuilder_modulesConfigBuilder, container.modulesConfigBuilder, "f");
                this.set('endpoints', __classPrivateFieldGet(this, _HappnerConfigurationBuilder_endpointsConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set('modules', __classPrivateFieldGet(this, _HappnerConfigurationBuilder_modulesConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set('components', __classPrivateFieldGet(this, _HappnerConfigurationBuilder_componentsConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
            }
            withDeferListen(defer) {
                this.set('deferListen', defer, BaseBuilder.Types.BOOLEAN);
                return this;
            }
            withListenFirst(listenFirst) {
                this.set('listenFirst', listenFirst, BaseBuilder.Types.BOOLEAN);
                return this;
            }
            beginComponent() {
                return __classPrivateFieldGet(this, _HappnerConfigurationBuilder_componentsConfigBuilder, "f").beginComponent();
            }
            beginEndpoint() {
                return __classPrivateFieldGet(this, _HappnerConfigurationBuilder_endpointsConfigBuilder, "f").beginEndpoint();
            }
            beginModule() {
                return __classPrivateFieldGet(this, _HappnerConfigurationBuilder_modulesConfigBuilder, "f").beginModule();
            }
        },
        _HappnerConfigurationBuilder_componentsConfigBuilder = new WeakMap(),
        _HappnerConfigurationBuilder_endpointsConfigBuilder = new WeakMap(),
        _HappnerConfigurationBuilder_modulesConfigBuilder = new WeakMap(),
        _a;
}
exports.HappnerCoreBuilder = HappnerCoreBuilder;
