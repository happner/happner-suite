/* eslint-disable @typescript-eslint/no-var-requires,no-console */
// const expect = require('chai');
import mockLogger from '../../__fixtures/logger';

const { ConfigBuilderFactory, ConfigValidator } = require('../../../dist');

describe('transpiled configuration tests', function () {
  it('creates happn config using transpiled happn-builder', () => {
    const builder = ConfigBuilderFactory.getBuilder('happn');
    const result = builder.build();

    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPN: ', JSON.stringify(result, null, 2));
  });

  it('creates happn-cluster config using transpiled happn-cluster-builder', () => {
    const builder = ConfigBuilderFactory.getHappnClusterBuilder();
    const result = builder.build();

    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnClusterConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPN-CLUSTER: ', JSON.stringify(result, null, 2));
  });

  it('creates happner config using transpiled happner-builder', () => {
    const builder = ConfigBuilderFactory.getHappnerBuilder();
    const result = builder.build();

    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnerConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPNER: ', JSON.stringify(result, null, 2));
  });

  it('creates happner-cluster config using transpiled happner-cluster-builder', () => {
    const builder = ConfigBuilderFactory.getHappnerClusterBuilder();
    const result = builder.build();

    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnerClusterConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    console.log('HAPPNER-CLUSTER: ', JSON.stringify(result, null, 2));
  });
});
