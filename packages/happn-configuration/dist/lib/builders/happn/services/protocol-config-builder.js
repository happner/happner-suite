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
var _ProtocolConfigBuilder_fieldTypeValidator;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/ban-types */
const BaseBuilder = require('happn-commons/lib/base-builder');
class ProtocolConfigBuilder extends BaseBuilder {
    constructor(fieldTypeValidator) {
        super();
        _ProtocolConfigBuilder_fieldTypeValidator.set(this, void 0);
        __classPrivateFieldSet(this, _ProtocolConfigBuilder_fieldTypeValidator, fieldTypeValidator, "f");
    }
    withSecure(isSecure) {
        this.set('config.secure', isSecure, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withAllowNestedPermissions(isAllowed) {
        this.set('config.allowNestedPermissions', isAllowed, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withInboundLayer(layerFunc) {
        const isValid = __classPrivateFieldGet(this, _ProtocolConfigBuilder_fieldTypeValidator, "f").validateFunctionArgs(layerFunc, 2).isValid;
        if (!isValid)
            throw new Error('invalid inbound layer function');
        this.push('config.inboundLayers', layerFunc, BaseBuilder.Types.FUNCTION);
        return this;
    }
    //grep -r inboundLayers ./packages/*/test
    withOutboundLayer(layerFunc) {
        const isValid = __classPrivateFieldGet(this, _ProtocolConfigBuilder_fieldTypeValidator, "f").validateFunctionArgs(layerFunc, 2).isValid;
        if (!isValid)
            throw new Error('invalid outbound layer function');
        this.push('config.outboundLayers', layerFunc, BaseBuilder.Types.FUNCTION);
        return this;
    }
}
exports.ProtocolConfigBuilder = ProtocolConfigBuilder;
_ProtocolConfigBuilder_fieldTypeValidator = new WeakMap();
