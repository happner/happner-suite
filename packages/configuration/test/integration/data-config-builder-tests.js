/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const DataConfigBuilder = require('../../lib/builders/data-config-builder');

describe(helper.testName(), function () {
  it('builds a data config object', () => {
    const testSecure = true;
    const testDataStore = {};

    const builder = new DataConfigBuilder();
    const result = builder.withSecure(testSecure).withDataStore(testDataStore).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.data.config.secure).to.equal(testSecure);
    helper.expect(result.data.config.datastores[0]).to.equal(testDataStore);
  });
});
