const BaseBuilder = require('happn-commons/lib/base-builder');
const { CREATE_TYPE, PARAMETER_TYPE } = require('../../constants/module-constants');

module.exports = class ModulesConfigBuilder extends BaseBuilder {
  /*
  modules: {
      'class-module': {
        path: '/path/to/module1',
        construct: {  // <------------- versus
          parameters: [
            {value: ''}
          ]
        }
      },
      'factory-module': {
        path: '/path/to/module2',
        create: {     // <------------- versus
          parameters: [
            {value: ''}
          ]
        }
      },
      'module-name': {
        path: '...',
        create: {
          name: 'createObject',
          type: 'async',
          parameters: [
            {name: 'param1', value: 'A'},
            {name: 'param2', value: 'B'},
            {name: 'callback', parameterType: 'callback'}
          ],
          callback: {
            parameters: [
              {name: 'err', parameterType: 'error'},
              {name: 'res', parameterType: 'instance'}
            ]
          }
        }
      }
    }
   */

  constructor() {
    super();
  }

  beginModule() {
    return new this.ModuleConfigBuilder(this);
  }

  ModuleConfigBuilder = class extends BaseBuilder {
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
      return new this.ModuleCreationBuilder(this, CREATE_TYPE.CONSTRUCT);
    }

    beginCreate() {
      return new this.ModuleCreationBuilder(this, CREATE_TYPE.FACTORY);
    }

    endModule() {
      return this.#parent;
    }

    ModuleCreationBuilder = class extends BaseBuilder {
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
        else this.push('parameters', { name, value, type }, BaseBuilder.Types.OBJECT);
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
    };
  };
};
