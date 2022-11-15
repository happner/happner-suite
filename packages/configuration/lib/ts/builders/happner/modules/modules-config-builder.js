"use strict";
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
    #parent;
    constructor(parent) {
        super();
        this.#parent = parent;
    }
    withName(name) {
        this.#parent.set(`${name}`, this, BaseBuilder.Types.OBJECT);
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
        return this.#parent;
    }
}
exports.ModuleConfigBuilder = ModuleConfigBuilder;
class ModuleCreationBuilder extends BaseBuilder {
    #parent;
    constructor(parent, type) {
        super();
        this.#parent = parent;
        this.#parent.set(type, this, BaseBuilder.Types.OBJECT);
    }
    withName(name) {
        this.set('name', name, BaseBuilder.Types.STRING);
        return this;
    }
    withParameter(name, value, type) {
        this.#checkParameterType(type);
        if (type === PARAMETER_TYPE.CALLBACK)
            this.push('parameters', { name, type }, BaseBuilder.Types.OBJECT);
        else
            this.push('parameters', { name, value, type }, BaseBuilder.Types.OBJECT);
        return this;
    }
    withCallbackParameter(name, type) {
        this.#checkParameterType(type);
        this.push('callback.parameters', { name, type }, BaseBuilder.Types.OBJECT);
        return this;
    }
    endConstruct() {
        return this.#parent;
    }
    endCreate() {
        return this.#parent;
    }
    #checkParameterType(type) {
        if (type) {
            if (!Object.keys(PARAMETER_TYPE).find((key) => PARAMETER_TYPE[key] === type))
                throw new Error('unknown parameter type');
        }
    }
}
exports.ModuleCreationBuilder = ModuleCreationBuilder;
