/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('modules configuration validation tests', function () {
  const validator = new ConfigValidator('1.0.0', mockLogger);

  it('validates full modules config', () => {
    const config = createValidModulesConfig();
    const result = validator.validateModulesConfig(config);

    expect(result.valid).to.equal(true);
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
