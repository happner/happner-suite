/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ModuleConfigBuilder = require('../../../lib/builders/modules/modules-config-builder');

describe(helper.testName(), function () {
  it('builds a modules config object', () => {
    const mockName1 = 'mock-module-1';
    const mockName2 = 'mock-module-2';
    const mockName3 = 'mock-module-3';
    const mockPath1 = 'module1/path';
    const mockPath2 = 'module2/path';
    const mockPath3 = 'module3/path';
    const mockConstructParams1 = [{ value: 12345 }, { value: 'param2' }];
    const mockConstructParams2 = [{ value: 'hello' }, { value: 'world' }];
    const mockCreateParams1 = [
      { value: 123 },
      { value: '2nd parameter' },
      { parameterType: `callback` },
    ];

    const builder = new ModuleConfigBuilder();
    const result = builder
      .beginModule()
      .withName(mockName1)
      .withPath(mockPath1)
      .withConstruct(mockConstructParams1)
      .endModule()
      .beginModule()
      .withName(mockName2)
      .withPath(mockPath2)
      .withConstruct(mockConstructParams2)
      .endModule()
      .beginModule()
      .withName(mockName3)
      .withPath(mockPath3)
      .withCreateParameters(mockCreateParams1)
      .endModule()
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    // helper.expect(result[mockName].config.allowSelfSignedCerts).to.equal(mockAllowSelfSignedCerts);
  });
});
