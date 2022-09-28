/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const DataStoreConfigBuilder = require('../../lib/builders/data/datastore-config-builder');

describe(helper.testName(), function () {
  it('builds a data config object', () => {
    const mockName = 'testName';
    const mockProvider = 'testProvider';
    const mockIsDefault = true;
    const mockIsFsync = true;
    const mockDbFile = '/testDbFile';
    const mockFileName = 'testDataFile';

    const builder = new DataStoreConfigBuilder();
    const result = builder
      .withName(mockName)
      .withProvider(mockProvider)
      .withIsDefault(mockIsDefault)
      .withIsFsync(mockIsFsync)
      .withDbFile(mockDbFile)
      .withFileName(mockFileName)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.name).to.equal(mockName);
    helper.expect(result.provider).to.equal(mockProvider);
    helper.expect(result.isDefault).to.equal(mockIsDefault);
    helper.expect(result.settings.fsync).to.equal(mockIsFsync);
    helper.expect(result.dbfile).to.equal(mockDbFile);
  });
});
