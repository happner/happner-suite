/* eslint-disable no-console */
import { ModulesConfigBuilder } from '../../../../lib/builders/happner/modules/modules-config-builder';
import { expect } from 'chai';

describe('modules configuration builder tests', function () {
  it('builds a modules config object', () => {
    const mockName1 = 'mock-module-1';
    const mockPath1 = 'module1/path';
    const mockConstruct1Name = 'module1Construct';
    const mockConstruct1Param1Name = 'module1ConstructParam1';
    const mockConstruct1Param1Value = 19000;
    const mockConstruct1Param2Name = 'module1ConstructParam2';
    const mockConstruct1Param2Value = 'test';
    const mockConstruct1Param3Name = 'module1ConstructCallback';
    const mockConstruct1Param3Type = 'callback';
    const mockConstruct1CallbackParam1Name = 'err';
    const mockConstruct1CallbackParam1Type = 'error';
    const mockConstruct1CallbackParam2Name = 'res';
    const mockConstruct1CallbackParam2Type = 'instance';

    const mockName2 = 'mock-module-2';
    const mockPath2 = 'module2/path';
    const mockConstruct2Name = 'module2Construct';
    const mockConstruct2Param1Name = 'module2ConstructParam1';
    const mockConstruct2Param1Value = 19000;

    const mockName3 = 'mock-module-3';
    const mockPath3 = 'module3/path';
    const mockCreate3Name = 'module3Create';
    const mockCreate3Param1Name = 'module3CreateParam1';
    const mockCreate3Param1Value = { test: '123' };
    const mockCreate3Param2Name = 'module3CreateCallback';
    const mockCreate3Param2Type = 'callback';
    const mockCreate3CallbackParam1Name = 'err';
    const mockCreate3CallbackParam1Type = 'error';
    const mockCreate3CallbackParam2Name = 'res';
    const mockCreate3CallbackParam2Type = 'instance';

    const builder = new ModulesConfigBuilder();
    const result = builder
      .beginModule()
      .withName(mockName1)
      .withPath(mockPath1)
      .beginConstruct()
      .withName(mockConstruct1Name)
      .withParameter(mockConstruct1Param1Name, mockConstruct1Param1Value)
      .withParameter(mockConstruct1Param2Name, mockConstruct1Param2Value)
      .withParameter(mockConstruct1Param3Name, mockConstruct1Param3Type, 'callback')
      .withCallbackParameter(mockConstruct1CallbackParam1Name, mockConstruct1CallbackParam1Type)
      .withCallbackParameter(mockConstruct1CallbackParam2Name, mockConstruct1CallbackParam2Type)
      .endConstruct()
      .endModule()
      .beginModule()
      .withName(mockName2)
      .withPath(mockPath2)
      .beginConstruct()
      .withName(mockConstruct2Name)
      .withParameter(mockConstruct2Param1Name, mockConstruct2Param1Value)
      .endConstruct()
      .endModule()
      .beginModule()
      .withName(mockName3)
      .withPath(mockPath3)
      .beginCreate()
      .withName(mockCreate3Name)
      .withParameter(mockCreate3Param1Name, mockCreate3Param1Value)
      .withParameter(mockCreate3Param2Name, mockCreate3Param2Type, 'callback')
      .withCallbackParameter(mockCreate3CallbackParam1Name, mockCreate3CallbackParam1Type)
      .withCallbackParameter(mockCreate3CallbackParam2Name, mockCreate3CallbackParam2Type)
      .endCreate()
      .endModule()
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // assertions

    // module 1
    expect(result[mockName1].path).to.equal(mockPath1);
    expect(result[mockName1].construct.name).to.equal(mockConstruct1Name);
    expect(result[mockName1].construct.parameters[0].name).to.equal(mockConstruct1Param1Name);
    expect(result[mockName1].construct.parameters[0].value).to.equal(mockConstruct1Param1Value);
    expect(result[mockName1].construct.parameters[1].name).to.equal(mockConstruct1Param2Name);
    expect(result[mockName1].construct.parameters[1].value).to.equal(mockConstruct1Param2Value);
    expect(result[mockName1].construct.parameters[2].name).to.equal(mockConstruct1Param3Name);
    expect(result[mockName1].construct.parameters[2].type).to.equal(mockConstruct1Param3Type);
    expect(result[mockName1].construct.callback.parameters[0].name).to.equal(
      mockConstruct1CallbackParam1Name
    );
    expect(result[mockName1].construct.callback.parameters[0].type).to.equal(
      mockConstruct1CallbackParam1Type
    );
    expect(result[mockName1].construct.callback.parameters[1].name).to.equal(
      mockConstruct1CallbackParam2Name
    );
    expect(result[mockName1].construct.callback.parameters[1].type).to.equal(
      mockConstruct1CallbackParam2Type
    );

    // module 2
    expect(result[mockName2].path).to.equal(mockPath2);
    expect(result[mockName2].construct.name).to.equal(mockConstruct2Name);
    expect(result[mockName2].construct.parameters[0].name).to.equal(mockConstruct2Param1Name);
    expect(result[mockName2].construct.parameters[0].value).to.equal(mockConstruct2Param1Value);

    // module 3

    expect(result[mockName3].path).to.equal(mockPath3);
    expect(result[mockName3].create.name).to.equal(mockCreate3Name);
    expect(result[mockName3].create.parameters[0].name).to.equal(mockCreate3Param1Name);
    expect(result[mockName3].create.parameters[0].value).to.equal(mockCreate3Param1Value);
    expect(result[mockName3].create.parameters[1].name).to.equal(mockCreate3Param2Name);
    expect(result[mockName3].create.parameters[1].type).to.equal(mockCreate3Param2Type);
    expect(result[mockName3].create.callback.parameters[0].name).to.equal(
      mockCreate3CallbackParam1Name
    );
    expect(result[mockName3].create.callback.parameters[0].type).to.equal(
      mockCreate3CallbackParam1Type
    );
    expect(result[mockName3].create.callback.parameters[1].name).to.equal(
      mockCreate3CallbackParam2Name
    );
    expect(result[mockName3].create.callback.parameters[1].type).to.equal(
      mockCreate3CallbackParam2Type
    );
  });
});
