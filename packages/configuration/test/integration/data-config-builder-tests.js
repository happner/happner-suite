/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const DataConfigBuilder = require('../../lib/builders/data/data-config-builder');
const DataStoreConfigBuilder = require('../../lib/builders/data/datastore-config-builder');

describe(helper.testName(), function () {
  it('builds a data config object with nested datastore', () => {
    const mockSecure = true;
    const mockName = 'testName';
    const mockProvider = 'testProvider';
    const mockIsDefault = true;
    const mockIsFsync = true;
    const mockDbFile = '/testDbFile';
    const mockFileName = 'testDataFile';

    const dataConfigBuilder = new DataConfigBuilder();
    const dataStoreConfigBuilder = new DataStoreConfigBuilder();

    const result = dataConfigBuilder
      .withSecure(mockSecure)
      .withDataStoreBuilder(
        dataStoreConfigBuilder
          .withName(mockName)
          .withProvider(mockProvider)
          .withIsDefault(mockIsDefault)
          .withIsFsync(mockIsFsync)
          .withDbFile(mockDbFile)
          .withFileName(mockFileName)
      )
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.data.config.secure).to.equal(mockSecure);
    helper.expect(result.data.config.datastores[0].name).to.equal(mockName);
    helper.expect(result.data.config.datastores[0].provider).to.equal(mockProvider);
    helper.expect(result.data.config.datastores[0].isDefault).to.equal(mockIsDefault);
    helper.expect(result.data.config.datastores[0].settings.fsync).to.equal(mockIsFsync);
    helper.expect(result.data.config.datastores[0].dbfile).to.equal(mockDbFile);
  });
});
