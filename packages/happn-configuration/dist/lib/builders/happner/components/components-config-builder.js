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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ComponentConfigBuilder_parent, _FunctionBuilder_instances, _FunctionBuilder_parent, _FunctionBuilder_checkParameterType, _FunctionBuilder_checkLifeCycleType, _FunctionBuilder_checkModelType;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionBuilder = exports.ComponentConfigBuilder = exports.ComponentsConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
const component_constants_1 = __importDefault(require("../../../constants/component-constants"));
const module_constants_1 = __importDefault(require("../../../constants/module-constants"));
const { LIFECYCLE_TYPE, MODEL_TYPE } = component_constants_1.default;
const { PARAMETER_TYPE } = module_constants_1.default;
class ComponentsConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    beginComponent() {
        return new ComponentConfigBuilder(this);
    }
}
exports.ComponentsConfigBuilder = ComponentsConfigBuilder;
class ComponentConfigBuilder extends BaseBuilder {
    constructor(parent) {
        super();
        _ComponentConfigBuilder_parent.set(this, void 0);
        __classPrivateFieldSet(this, _ComponentConfigBuilder_parent, parent, "f");
    }
    withName(name) {
        __classPrivateFieldGet(this, _ComponentConfigBuilder_parent, "f").set(`${name}`, this, BaseBuilder.Types.OBJECT);
        return this;
    }
    withModuleName(name) {
        this.set('module', name, BaseBuilder.Types.STRING);
        return this;
    }
    withSchemaExclusive(isExclusive) {
        this.set('schema.exclusive', isExclusive, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withWebRoute(name, value) {
        this.set(`web.routes.${name}`, value, BaseBuilder.Types.STRING);
        return this;
    }
    withDataRoute(name, value) {
        this.set(`data.routes.${name}`, value, BaseBuilder.Types.STRING);
        return this;
    }
    withEvent(name, value) {
        this.set(`events.${name}`, value, BaseBuilder.Types.OBJECT);
        return this;
    }
    beginFunction() {
        return new FunctionBuilder(this);
    }
    endComponent() {
        return __classPrivateFieldGet(this, _ComponentConfigBuilder_parent, "f");
    }
}
exports.ComponentConfigBuilder = ComponentConfigBuilder;
_ComponentConfigBuilder_parent = new WeakMap();
class FunctionBuilder extends BaseBuilder {
    constructor(parent) {
        super();
        _FunctionBuilder_instances.add(this);
        _FunctionBuilder_parent.set(this, void 0);
        __classPrivateFieldSet(this, _FunctionBuilder_parent, parent, "f");
    }
    withName(name, lifeCycleType) {
        if (lifeCycleType) {
            __classPrivateFieldGet(this, _FunctionBuilder_parent, "f").set(`schema.${lifeCycleType}Method`, name, BaseBuilder.Types.STRING);
        }
        __classPrivateFieldGet(this, _FunctionBuilder_parent, "f").set(`schema.methods.${name}`, this, BaseBuilder.Types.OBJECT);
        return this;
    }
    withModelType(type) {
        __classPrivateFieldGet(this, _FunctionBuilder_instances, "m", _FunctionBuilder_checkModelType).call(this, type);
        this.set('type', type, BaseBuilder.Types.STRING);
        return this;
    }
    withAlias(alias) {
        this.set('alias', alias, BaseBuilder.Types.STRING);
        return this;
    }
    withParameter(name, value, type, required) {
        __classPrivateFieldGet(this, _FunctionBuilder_instances, "m", _FunctionBuilder_checkParameterType).call(this, type);
        const obj = { name: name };
        if (type)
            obj['type'] = type;
        if (required)
            obj['required'] = required;
        if (type !== PARAMETER_TYPE.CALLBACK && value)
            obj['value'] = value;
        this.push('parameters', obj, BaseBuilder.Types.OBJECT);
        return this;
    }
    withCallbackParameter(name, type) {
        __classPrivateFieldGet(this, _FunctionBuilder_instances, "m", _FunctionBuilder_checkParameterType).call(this, type);
        this.push('callback.parameters', { name, type }, BaseBuilder.Types.OBJECT);
        return this;
    }
    endFunction() {
        return __classPrivateFieldGet(this, _FunctionBuilder_parent, "f");
    }
}
exports.FunctionBuilder = FunctionBuilder;
_FunctionBuilder_parent = new WeakMap(), _FunctionBuilder_instances = new WeakSet(), _FunctionBuilder_checkParameterType = function _FunctionBuilder_checkParameterType(type) {
    if (type) {
        if (!Object.keys(PARAMETER_TYPE).find((key) => PARAMETER_TYPE[key] === type))
            throw new Error('unknown parameter type');
    }
}, _FunctionBuilder_checkLifeCycleType = function _FunctionBuilder_checkLifeCycleType(type) {
    if (type) {
        if (!Object.keys(LIFECYCLE_TYPE).find((key) => LIFECYCLE_TYPE[key] === type))
            throw new Error('unknown lifecycle type');
    }
}, _FunctionBuilder_checkModelType = function _FunctionBuilder_checkModelType(type) {
    if (type) {
        if (!Object.keys(MODEL_TYPE).find((key) => MODEL_TYPE[key] === type))
            throw new Error('unknown model type');
    }
};
