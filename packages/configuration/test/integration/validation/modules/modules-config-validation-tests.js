/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full modules config', () => {
    const config = createValidModulesConfig();
    const result = validator.validateModulesConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidModulesConfig() {
  return {
    'mock-module-1': {
      path: 'module1/path',
      construct: {
        name: 'module1Construct',
        parameters: [
          {
            name: 'module1ConstructParam1',
            value: 19000,
          },
          {
            name: 'module1ConstructParam2',
            value: 'test',
          },
          {
            name: 'module1ConstructCallback',
            type: 'callback',
          },
        ],
        callback: {
          parameters: [
            {
              name: 'err',
              type: 'error',
            },
            {
              name: 'res',
              type: 'instance',
            },
          ],
        },
      },
    },
    'mock-module-2': {
      path: 'module2/path',
      construct: {
        name: 'module2Construct',
        parameters: [
          {
            name: 'module2ConstructParam1',
            value: 19000,
          },
        ],
      },
    },
    'mock-module-3': {
      path: 'module3/path',
      create: {
        name: 'module3Create',
        parameters: [
          {
            name: 'module3CreateParam1',
            value: {
              test: '123',
            },
          },
          {
            name: 'module3CreateCallback',
            type: 'callback',
          },
        ],
        callback: {
          parameters: [
            {
              name: 'err',
              type: 'error',
            },
            {
              name: 'res',
              type: 'instance',
            },
          ],
        },
      },
    },
  };
}
