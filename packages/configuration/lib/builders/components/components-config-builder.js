const BaseBuilder = require('happn-commons/lib/base-builder');
const { LIFECYCLE_TYPE, MODEL_TYPE } = require('../../constants/component-constants');
const { PARAMETER_TYPE } = require('../../constants/module-constants');
module.exports = class ComponentsConfigBuilder extends BaseBuilder {
  /*
{
  components: {
    "name-of-component": {
      module: 'name-of-implementing-module',
      schema: {
        exclusive: true,
        startMethod: 'start',
        initMethod: 'init',
        stopMethod: 'asyncStop',
        shutdownMethod: 'asyncShutdown',
        methods: {
        asyncStop: {
          type: 'async'
        },
        asyncShutdown: {
          type: 'async'
        },
        init: {
            type: 'async',
            parameters: [
              {name: 'opts', required: true, value: {op:'tions'}},
              {name: 'optionalOpts'},
              {name: 'callback', required: true, type: 'callback'}
            ],
            callback: {
              parameters: [
                {name: 'error', type: "error"},
              ]
            }
          },
          start: {
            type: 'async',
            parameters: [
              {name: 'opts', required: true, value: {op:'tions'}},
              {name: 'optionalOpts'},
              {name: 'callback', required: true, type: 'callback'}
            ],
            callback: {
              parameters: [
                {name: 'error', type: "error"},
              ]
            }
          },
          methodName1: {
            alias: 'mn1'
          },
          methodName2: {
            type: 'sync-promise'
          }
        }
      },
      web: {
        routes: {
          method1: 'webMethod1',
          app: 'static',
          // app: ['middleware1', 'middleware2', 'static']
        }
      },
      events: {
        'ping': {},
        'event/with/wildcard/*': {},
      },
      data: {
        routes: {
          'friends/*': 'persist',
          'lovers/*': 'mem',
        }
      }
    }
  }
 }
   */

  constructor() {
    super();
  }

  beginComponent() {
    return new this.ComponentConfigBuilder(this);
  }

  ComponentConfigBuilder = class extends BaseBuilder {
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
      return new this.FunctionBuilder(this);
    }

    endComponent() {
      return this.#parent;
    }

    FunctionBuilder = class extends BaseBuilder {
      #parent;

      constructor(parent) {
        super();
        this.#parent = parent;
      }

      /***
       *
       * @param name (required) the name of the function
       * @param lifeCycleType (optional) valid options: init, start, stop, shutdown
       * @returns {ComponentsConfigBuilder.ComponentConfigBuilder.FunctionBuilder}
       */
      withName(name, lifeCycleType) {
        if (lifeCycleType) {
          this.#parent.set(`schema.${lifeCycleType}Method`, name, BaseBuilder.Types.STRING);
        }
        this.#parent.set(`schema.methods.${name}`, this, BaseBuilder.Types.OBJECT);
        return this;
      }

      /***
       *
       * @param type (required) async, sync, sync-promise
       * @returns {ComponentsConfigBuilder.ComponentConfigBuilder.FunctionBuilder}
       */
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
        else this.push('parameters', { name, value, type, required }, BaseBuilder.Types.OBJECT);
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
    };
  };
};
