"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionBuilder = exports.ComponentConfigBuilder = exports.ComponentsConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const { LIFECYCLE_TYPE, MODEL_TYPE } = require('../../../../constants/component-constants');
const { PARAMETER_TYPE } = require('../../../../constants/module-constants');
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
    #parent;
    constructor(parent) {
        super();
        this.#parent = parent;
    }
    withName(name) {
        this.#parent.set(`${name}`, this, BaseBuilder.Types.OBJECT);
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
        return this.#parent;
    }
}
exports.ComponentConfigBuilder = ComponentConfigBuilder;
class FunctionBuilder extends BaseBuilder {
    #parent;
    constructor(parent) {
        super();
        this.#parent = parent;
    }
    withName(name, lifeCycleType) {
        if (lifeCycleType) {
            this.#parent.set(`schema.${lifeCycleType}Method`, name, BaseBuilder.Types.STRING);
        }
        this.#parent.set(`schema.methods.${name}`, this, BaseBuilder.Types.OBJECT);
        return this;
    }
    withModelType(type) {
        this.#checkModelType(type);
        this.set('type', type, BaseBuilder.Types.STRING);
        return this;
    }
    withAlias(alias) {
        this.set('alias', alias, BaseBuilder.Types.STRING);
        return this;
    }
    withParameter(name, value, type, required) {
        this.#checkParameterType(type);
        if (type === PARAMETER_TYPE.CALLBACK)
            this.push('parameters', { name, type, required }, BaseBuilder.Types.OBJECT);
        else
            this.push('parameters', { name, value, type, required }, BaseBuilder.Types.OBJECT);
        return this;
    }
    withCallbackParameter(name, type) {
        this.#checkParameterType(type);
        this.push('callback.parameters', { name, type }, BaseBuilder.Types.OBJECT);
        return this;
    }
    #checkParameterType(type) {
        if (type) {
            if (!Object.keys(PARAMETER_TYPE).find((key) => PARAMETER_TYPE[key] === type))
                throw new Error('unknown parameter type');
        }
    }
    #checkLifeCycleType(type) {
        if (type) {
            if (!Object.keys(LIFECYCLE_TYPE).find((key) => LIFECYCLE_TYPE[key] === type))
                throw new Error('unknown lifecycle type');
        }
    }
    #checkModelType(type) {
        if (type) {
            if (!Object.keys(MODEL_TYPE).find((key) => MODEL_TYPE[key] === type))
                throw new Error('unknown model type');
        }
    }
    endFunction() {
        return this.#parent;
    }
}
exports.FunctionBuilder = FunctionBuilder;
