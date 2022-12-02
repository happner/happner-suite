/* eslint-disable no-console */
import { ComponentsConfigBuilder } from '../../../../lib/builders/happner/components/components-config-builder';
import { expect } from 'chai';

describe('components configuration builder tests', function () {
  it('builds a components config object', () => {
    const mockComponent1Name = 'test1';
    const mockComponent1ModuleName = 'testModule1';
    const mockComponent1SchemaExclusive = true;
    const mockComponent1InitFuncName = 'initFunc';
    const mockComponent1InitFuncLifeCycleType = 'init';
    const mockComponent1InitFuncModelType = 'async';
    const mockComponent1InitFuncParamName = 'testParam';
    const mockComponent1InitFuncParamValue = 213123;
    const mockComponent1InitFuncCallbackParamName = 'err';
    const mockComponent1InitFuncCallbackParamType = 'error';
    const mockComponent1StopFuncName = 'stopFunc';
    const mockComponent1StopFuncLifeCycleType = 'stop';
    const mockComponent1StopFuncModelType = 'async';
    const mockComponent1WebRouteName = 'webRoute1';
    const mockComponent1WebRouteValue = 'webRouteTarget';
    const mockComponent1DataRouteName = 'dataRoute1/*';
    const mockComponent1DataRouteValue = 'dataRouteTarget';
    const mockComponent1EventName = 'event/with/wildcard/*';
    const mockComponent1EventValue = {};

    const mockComponent2Name = 'test2';
    const mockComponent2ModuleName = 'testModule2';
    const mockComponent2SchemaExclusive = true;
    const mockComponent2FuncName = 'nonLifeCycleFunction';
    const mockComponent2FuncAlias = 'widgetFunc';
    const mockComponent2FuncModelType = 'async';
    const mockComponent2FuncParamName = 'testParam';
    const mockComponent2FuncParamValue = 999999;
    const mockComponent2FuncCallbackParamName = 'err';
    const mockComponent2FuncCallbackParamType = 'error';

    const builder = new ComponentsConfigBuilder();

    const result = builder
      .beginComponent()
      .withName(mockComponent1Name)
      .withModuleName(mockComponent1ModuleName)
      .withSchemaExclusive(mockComponent1SchemaExclusive)
      .beginFunction()
      .withName(mockComponent1InitFuncName, mockComponent1InitFuncLifeCycleType)
      .withModelType(mockComponent1InitFuncModelType)
      .withParameter(mockComponent1InitFuncParamName, mockComponent1InitFuncParamValue)
      .withCallbackParameter(
        mockComponent1InitFuncCallbackParamName,
        mockComponent1InitFuncCallbackParamType
      )
      .endFunction()
      .beginFunction()
      .withName(mockComponent1StopFuncName, mockComponent1StopFuncLifeCycleType)
      .withModelType(mockComponent1StopFuncModelType)
      .endFunction()
      .withWebRoute(mockComponent1WebRouteName, mockComponent1WebRouteValue)
      .withDataRoute(mockComponent1DataRouteName, mockComponent1DataRouteValue)
      .withEvent(mockComponent1EventName, mockComponent1EventValue)
      .endComponent()
      .beginComponent()
      .withName(mockComponent2Name)
      .withModuleName(mockComponent2ModuleName)
      .withSchemaExclusive(mockComponent2SchemaExclusive)
      .beginFunction()
      .withName(mockComponent2FuncName)
      .withAlias(mockComponent2FuncAlias)
      .withModelType(mockComponent2FuncModelType)
      .withParameter(mockComponent2FuncParamName, mockComponent2FuncParamValue)
      .withCallbackParameter(
        mockComponent2FuncCallbackParamName,
        mockComponent2FuncCallbackParamType
      )
      .endFunction()
      .endComponent()
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // assertions

    expect(result[mockComponent1Name].module).to.equal(mockComponent1ModuleName);
    expect(result[mockComponent1Name].schema.exclusive).to.equal(mockComponent1SchemaExclusive);
    expect(result[mockComponent1Name].schema.initMethod).to.equal(mockComponent1InitFuncName);
    expect(result[mockComponent1Name].schema.methods[mockComponent1InitFuncName].type).to.equal(
      mockComponent1InitFuncModelType
    );
    expect(
      result[mockComponent1Name].schema.methods[mockComponent1InitFuncName].parameters[0].name
    ).to.equal(mockComponent1InitFuncParamName);
    expect(
      result[mockComponent1Name].schema.methods[mockComponent1InitFuncName].parameters[0].value
    ).to.equal(mockComponent1InitFuncParamValue);
    expect(
      result[mockComponent1Name].schema.methods[mockComponent1InitFuncName].callback.parameters[0]
        .name
    ).to.equal(mockComponent1InitFuncCallbackParamName);
    expect(
      result[mockComponent1Name].schema.methods[mockComponent1InitFuncName].callback.parameters[0]
        .type
    ).to.equal(mockComponent1InitFuncCallbackParamType);
    expect(result[mockComponent1Name].schema.methods[mockComponent1StopFuncName].type).to.equal(
      mockComponent1StopFuncModelType
    );
    expect(result[mockComponent1Name].schema.stopMethod).to.equal(mockComponent1StopFuncName);
    expect(result[mockComponent1Name].web.routes[mockComponent1WebRouteName]).to.equal(
      mockComponent1WebRouteValue
    );
    expect(result[mockComponent1Name].data.routes[mockComponent1DataRouteName]).to.equal(
      mockComponent1DataRouteValue
    );
    expect(result[mockComponent1Name].events[mockComponent1EventName]).to.equal(
      mockComponent1EventValue
    );

    expect(result[mockComponent2Name].module).to.equal(mockComponent2ModuleName);
    expect(result[mockComponent2Name].schema.exclusive).to.equal(mockComponent2SchemaExclusive);
    expect(result[mockComponent2Name].schema.methods[mockComponent2FuncName].alias).to.equal(
      mockComponent2FuncAlias
    );
    expect(result[mockComponent2Name].schema.methods[mockComponent2FuncName].type).to.equal(
      mockComponent2FuncModelType
    );
    expect(
      result[mockComponent2Name].schema.methods[mockComponent2FuncName].parameters[0].name
    ).to.equal(mockComponent2FuncParamName);
    expect(
      result[mockComponent2Name].schema.methods[mockComponent2FuncName].parameters[0].value
    ).to.equal(mockComponent2FuncParamValue);
    expect(
      result[mockComponent2Name].schema.methods[mockComponent2FuncName].callback.parameters[0].name
    ).to.equal(mockComponent2FuncCallbackParamName);
    expect(
      result[mockComponent2Name].schema.methods[mockComponent2FuncName].callback.parameters[0].type
    ).to.equal(mockComponent2FuncCallbackParamType);
  });
});
