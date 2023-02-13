/* eslint-disable @typescript-eslint/no-var-requires,no-console */
// const expect = require('chai');
const mockLogger = require('../../__fixtures/logger');
const { ConfigBuilderFactory, ConfigValidator } = require('../../../dist');

describe('transpiled configuration tests', function () {
  it('creates happn config using transpiled happn-builder', async () => {
    const context = { happn: '1.0.0' };
    const builderFactory = new ConfigBuilderFactory(context);
    const builder = builderFactory.getHappnBuilder();
    const result = builder.build();

    const validator = new ConfigValidator('1.0.0', mockLogger);
    const validationResult = validator.validateHappnConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPN: ', JSON.stringify(result, null, 2));
  });

  it('creates happn-cluster config using transpiled happn-cluster-builder', async () => {
    const context = { happn: '1.0.0', happnCluster: '2.0.0' };
    const builderFactory = new ConfigBuilderFactory(context);
    const builder = builderFactory.getHappnClusterBuilder();
    const result = builder.build();

    const validator = new ConfigValidator('1.0.0', mockLogger);
    const validationResult = validator.validateHappnClusterConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPN-CLUSTER: ', JSON.stringify(result, null, 2));
  });

  it('creates happner config using transpiled happner-builder', async () => {
    const context = { happn: '1.0.0', happner: '2.0.0' };
    const builderFactory = new ConfigBuilderFactory(context);
    const builder = builderFactory.getHappnerBuilder();
    const result = builder.build();

    const validator = new ConfigValidator('1.0.0', mockLogger);
    const validationResult = validator.validateHappnerConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPNER: ', JSON.stringify(result, null, 2));
  });

  it('creates happner-cluster config using transpiled happner-cluster-builder', async () => {
    const context = {
      happn: '1.0.0',
      happnCluster: '2.0.0',
      happner: '12.0.0',
      happnerCluster: '11.0.0',
    };
    const builderFactory = new ConfigBuilderFactory(context);
    const builder = builderFactory.getHappnerClusterBuilder();
    const result = builder.build();

    const validator = new ConfigValidator('1.0.0', mockLogger);
    const validationResult = validator.validateHappnerClusterConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPNER-CLUSTER: ', JSON.stringify(result, null, 2));
  });
});
