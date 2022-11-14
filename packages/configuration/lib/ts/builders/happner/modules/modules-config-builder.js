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
var _ModuleConfigBuilder_parent, _ModuleCreationBuilder_instances, _ModuleCreationBuilder_parent, _ModuleCreationBuilder_checkParameterType;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleCreationBuilder = exports.ModuleConfigBuilder = exports.ModulesConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const { CREATE_TYPE, PARAMETER_TYPE } = require('../../../../constants/module-constants');
class ModulesConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    beginModule() {
        return new ModuleConfigBuilder(this);
    }
}
exports.ModulesConfigBuilder = ModulesConfigBuilder;
class ModuleConfigBuilder extends BaseBuilder {
    constructor(parent) {
        super();
        _ModuleConfigBuilder_parent.set(this, void 0);
        __classPrivateFieldSet(this, _ModuleConfigBuilder_parent, parent, "f");
    }
    withName(name) {
        __classPrivateFieldGet(this, _ModuleConfigBuilder_parent, "f").set(`${name}`, this, BaseBuilder.Types.OBJECT);
        return this;
    }
    withPath(path) {
        this.set('path', path, BaseBuilder.Types.STRING);
        return this;
    }
    beginConstruct() {
        return new ModuleCreationBuilder(this, CREATE_TYPE.CONSTRUCT);
    }
    beginCreate() {
        return new ModuleCreationBuilder(this, CREATE_TYPE.FACTORY);
    }
    endModule() {
        return __classPrivateFieldGet(this, _ModuleConfigBuilder_parent, "f");
    }
}
exports.ModuleConfigBuilder = ModuleConfigBuilder;
_ModuleConfigBuilder_parent = new WeakMap();
class ModuleCreationBuilder extends BaseBuilder {
    constructor(parent, type) {
        super();
        _ModuleCreationBuilder_instances.add(this);
        _ModuleCreationBuilder_parent.set(this, void 0);
        __classPrivateFieldSet(this, _ModuleCreationBuilder_parent, parent, "f");
        __classPrivateFieldGet(this, _ModuleCreationBuilder_parent, "f").set(type, this, BaseBuilder.Types.OBJECT);
    }
    withName(name) {
        this.set('name', name, BaseBuilder.Types.STRING);
        return this;
    }
    withParameter(name, value, type) {
        __classPrivateFieldGet(this, _ModuleCreationBuilder_instances, "m", _ModuleCreationBuilder_checkParameterType).call(this, type);
        if (type === PARAMETER_TYPE.CALLBACK)
            this.push('parameters', { name, type }, BaseBuilder.Types.OBJECT);
        else
            this.push('parameters', { name, value, type }, BaseBuilder.Types.OBJECT);
        return this;
    }
    withCallbackParameter(name, type) {
        __classPrivateFieldGet(this, _ModuleCreationBuilder_instances, "m", _ModuleCreationBuilder_checkParameterType).call(this, type);
        this.push('callback.parameters', { name, type }, BaseBuilder.Types.OBJECT);
        return this;
    }
    endConstruct() {
        return __classPrivateFieldGet(this, _ModuleCreationBuilder_parent, "f");
    }
    endCreate() {
        return __classPrivateFieldGet(this, _ModuleCreationBuilder_parent, "f");
    }
}
exports.ModuleCreationBuilder = ModuleCreationBuilder;
_ModuleCreationBuilder_parent = new WeakMap(), _ModuleCreationBuilder_instances = new WeakSet(), _ModuleCreationBuilder_checkParameterType = function _ModuleCreationBuilder_checkParameterType(type) {
    if (type) {
        if (!Object.keys(PARAMETER_TYPE).find((key) => PARAMETER_TYPE[key] === type))
            throw new Error('unknown parameter type');
    }
};
//# sourceMappingURL=modules-config-builder.js.map