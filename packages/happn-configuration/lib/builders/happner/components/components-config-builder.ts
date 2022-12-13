/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
import ComponentConstants from '../../../constants/component-constants';
import ModuleConstants from '../../../constants/module-constants';

const { LIFECYCLE_TYPE, MODEL_TYPE } = ComponentConstants;
const { PARAMETER_TYPE } = ModuleConstants;

export class ComponentsConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  beginComponent() {
    return new ComponentConfigBuilder(this);
  }
}

export class ComponentConfigBuilder extends BaseBuilder {
  #parent;

  constructor(parent: ComponentsConfigBuilder) {
    super();
    this.#parent = parent;
  }

  withName(name: string): ComponentConfigBuilder {
    this.#parent.set(`${name}`, this, BaseBuilder.Types.OBJECT);
    return this;
  }

  withModuleName(name: string): ComponentConfigBuilder {
    this.set('module', name, BaseBuilder.Types.STRING);
    return this;
  }

  withSchemaExclusive(isExclusive: boolean): ComponentConfigBuilder {
    this.set('schema.exclusive', isExclusive, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withWebRoute(name: string, value: string): ComponentConfigBuilder {
    this.set(`web.routes.${name}`, value, BaseBuilder.Types.STRING);
    return this;
  }

  withDataRoute(name: string, value: string): ComponentConfigBuilder {
    this.set(`data.routes.${name}`, value, BaseBuilder.Types.STRING);
    return this;
  }

  withEvent(name: string, value: unknown): ComponentConfigBuilder {
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

export class FunctionBuilder extends BaseBuilder {
  #parent;

  constructor(parent: ComponentConfigBuilder) {
    super();
    this.#parent = parent;
  }

  withName(name: string, lifeCycleType: string): FunctionBuilder {
    if (lifeCycleType) {
      this.#parent.set(`schema.${lifeCycleType}Method`, name, BaseBuilder.Types.STRING);
    }
    this.#parent.set(`schema.methods.${name}`, this, BaseBuilder.Types.OBJECT);
    return this;
  }

  withModelType(type: string): FunctionBuilder {
    this.#checkModelType(type);
    this.set('type', type, BaseBuilder.Types.STRING);
    return this;
  }

  withAlias(alias: string): FunctionBuilder {
    this.set('alias', alias, BaseBuilder.Types.STRING);
    return this;
  }

  withParameter(name: string, value: any, type?: string, required?: boolean): FunctionBuilder {
    this.#checkParameterType(type);

    const obj = { name: name };

    if (type) obj['type'] = type;
    if (required) obj['required'] = required;

    if (type !== PARAMETER_TYPE.CALLBACK) if (value) obj['value'] = value;

    this.push('parameters', obj, BaseBuilder.Types.OBJECT);
    return this;
  }

  withCallbackParameter(name: string, type: string): FunctionBuilder {
    this.#checkParameterType(type);
    this.push('callback.parameters', { name, type }, BaseBuilder.Types.OBJECT);
    return this;
  }

  #checkParameterType(type: string) {
    if (type) {
      if (!Object.keys(PARAMETER_TYPE).find((key) => PARAMETER_TYPE[key] === type))
        throw new Error('unknown parameter type');
    }
  }

  #checkLifeCycleType(type: string) {
    if (type) {
      if (!Object.keys(LIFECYCLE_TYPE).find((key) => LIFECYCLE_TYPE[key] === type))
        throw new Error('unknown lifecycle type');
    }
  }

  #checkModelType(type: string) {
    if (type) {
      if (!Object.keys(MODEL_TYPE).find((key) => MODEL_TYPE[key] === type))
        throw new Error('unknown model type');
    }
  }

  endFunction() {
    return this.#parent;
  }
}
