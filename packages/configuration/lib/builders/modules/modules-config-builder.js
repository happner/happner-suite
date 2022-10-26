const BaseBuilder = require('happn-commons/lib/base-builder');
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

    withConstruct(params, name = null) {
      if (name) this.set('construct.name', name, BaseBuilder.Types.ARRAY);

      // validate the param fields
      params.forEach((param) => {
        if (param.value === undefined) throw new Error("missing param field 'value'");
      });

      this.set('construct.parameters', params, BaseBuilder.Types.ARRAY);
      return this;
    }

    withCreateParameters(params) {
      this.set('create.parameters', params, BaseBuilder.Types.ARRAY);
      return this;
    }

    endModule() {
      return this.#parent;
    }
  };
};
