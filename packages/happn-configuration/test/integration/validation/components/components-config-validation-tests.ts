/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('components configuration validation tests', function () {
  const validator = new ConfigValidator('1.0.0', mockLogger);

  it('validates full components config', () => {
    const config = createValidComponentsConfig();
    const result = validator.validateComponentsConfig(config);

    console.log(JSON.stringify(result.errors, null, 2));
    expect(result.valid).to.equal(true);
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
