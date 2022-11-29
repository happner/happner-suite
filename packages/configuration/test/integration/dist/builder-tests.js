/* eslint-disable @typescript-eslint/no-var-requires,no-console */
const expect = require('chai');
const BuilderFactory = require('../../../dist').ConfigBuilderFactory;

describe('transpiled configuration tests', function () {
  it('creates happn config using transpiled happn-builder', () => {
    const builder = BuilderFactory.getBuilder('happn');
    const result = builder.build();

    console.log('HAPPN: ', JSON.stringify(result, null, 2));
  });

  it('creates happn-cluster config using transpiled happn-cluster-builder', () => {
    const builder = BuilderFactory.getHappnClusterBuilder();
    const result = builder.build();

    console.log('HAPPN-CLUSTER: ', JSON.stringify(result, null, 2));
  });

  it('creates happner config using transpiled happner-builder', () => {
    const builder = BuilderFactory.getHappnerBuilder();
    const result = builder.build();

    console.log('HAPPNER: ', JSON.stringify(result, null, 2));
  });

  it('creates happner-cluster config using transpiled happner-cluster-builder', () => {
    const builder = BuilderFactory.getHappnerClusterBuilder();
    const result = builder.build();

    console.log('HAPPNER-CLUSTER: ', JSON.stringify(result, null, 2));
  });
});
