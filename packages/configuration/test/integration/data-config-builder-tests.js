/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const DataConfigBuilder = require('../../lib/builders/data/data-config-builder');
const DataStoreConfigBuilder = require('../../lib/builders/data/datastore-config-builder');

describe(helper.testName(), function () {
  it('builds a data config object with nested datastore', () => {
    const testSecure = true;
    const testName = 'testName';
    const testProvider = 'testProvider';
    const testIsDefault = true;
    const testIsFsync = true;
    const testDbFile = '/testDbFile';
    const testFileName = 'testDataFile';

    const dataConfigBuilder = new DataConfigBuilder();
    const dataStoreConfigBuilder = new DataStoreConfigBuilder();

    const result = dataConfigBuilder
      .withSecure(testSecure)
      .withDataStoreBuilder(
        dataStoreConfigBuilder
          .withName(testName)
          .withProvider(testProvider)
          .withIsDefault(testIsDefault)
          .withIsFsync(testIsFsync)
          .withDbFile(testDbFile)
          .withFileName(testFileName)
      )
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.data.config.secure).to.equal(testSecure);
    helper.expect(result.data.config.datastores[0].name).to.equal(testName);
    helper.expect(result.data.config.datastores[0].provider).to.equal(testProvider);
    helper.expect(result.data.config.datastores[0].isDefault).to.equal(testIsDefault);
    helper.expect(result.data.config.datastores[0].settings.fsync).to.equal(testIsFsync);
    helper.expect(result.data.config.datastores[0].dbfile).to.equal(testDbFile);
  });
});
