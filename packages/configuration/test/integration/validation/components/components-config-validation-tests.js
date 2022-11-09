/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full components config', () => {
    const config = createValidComponentsConfig();
    const result = validator.validateComponentsConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidComponentsConfig() {
  return {
    test1: {
      module: 'testModule1',
      schema: {
        exclusive: true,
        initMethod: 'initFunc',
        methods: {
          initFunc: {
            type: 'async',
            parameters: [
              {
                name: 'testParam',
                value: 213123,
              },
            ],
            callback: {
              parameters: [
                {
                  name: 'err',
                  type: 'error',
                },
              ],
            },
          },
          stopFunc: {
            type: 'async',
          },
        },
        stopMethod: 'stopFunc',
      },
      web: {
        routes: {
          webRoute1: 'webRouteTarget',
        },
      },
      data: {
        routes: {
          'dataRoute1/*': 'dataRouteTarget',
        },
      },
      events: {
        'event/with/wildcard/*': {},
      },
    },
    test2: {
      module: 'testModule2',
      schema: {
        exclusive: true,
        methods: {
          nonLifeCycleFunction: {
            alias: 'widgetFunc',
            type: 'async',
            parameters: [
              {
                name: 'testParam',
                value: 999999,
              },
            ],
            callback: {
              parameters: [
                {
                  name: 'err',
                  type: 'error',
                },
              ],
            },
          },
        },
      },
    },
  };
}
