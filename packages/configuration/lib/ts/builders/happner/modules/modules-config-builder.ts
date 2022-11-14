const BaseBuilder = require('happn-commons/lib/base-builder');
const { CREATE_TYPE, PARAMETER_TYPE } = require('../../../../constants/module-constants');

export class ModulesConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  beginModule() {
    return new ModuleConfigBuilder(this);
  }
}

export class ModuleConfigBuilder extends BaseBuilder {
  #parent;

  constructor(parent) {
    super();
    this.#parent = parent;
  }

  withName(name: string): ModuleConfigBuilder {
    this.#parent.set(`${name}`, this, BaseBuilder.Types.OBJECT);
    return this;
  }

  withPath(path: string): ModuleConfigBuilder {
    this.set('path', path, BaseBuilder.Types.STRING);
    return this;
  }

  beginConstruct(): ModuleCreationBuilder {
    return new ModuleCreationBuilder(this, CREATE_TYPE.CONSTRUCT);
  }

  beginCreate(): ModuleCreationBuilder {
    return new ModuleCreationBuilder(this, CREATE_TYPE.FACTORY);
  }

  endModule(): ModulesConfigBuilder {
    return this.#parent;
  }
}

export class ModuleCreationBuilder extends BaseBuilder {
  #parent;

  constructor(parent: ModuleConfigBuilder, type: string) {
    super();
    this.#parent = parent;
    this.#parent.set(type, this, BaseBuilder.Types.OBJECT);
  }

  withName(name: string): ModuleCreationBuilder {
    this.set('name', name, BaseBuilder.Types.STRING);
    return this;
  }

  withParameter(name: string, value: any, type: string): ModuleCreationBuilder {
    this.#checkParameterType(type);
    if (type === PARAMETER_TYPE.CALLBACK)
      this.push('parameters', { name, type }, BaseBuilder.Types.OBJECT);
    else this.push('parameters', { name, value, type }, BaseBuilder.Types.OBJECT);
    return this;
  }

  withCallbackParameter(name: string, type: string): ModuleCreationBuilder {
    this.#checkParameterType(type);
    this.push('callback.parameters', { name, type }, BaseBuilder.Types.OBJECT);
    return this;
  }

  endConstruct(): ModuleConfigBuilder {
    return this.#parent;
  }

  endCreate(): ModuleConfigBuilder {
    return this.#parent;
  }

  #checkParameterType(type: string) {
    if (type) {
      if (!Object.keys(PARAMETER_TYPE).find((key) => PARAMETER_TYPE[key] === type))
        throw new Error('unknown parameter type');
    }
  }
}
