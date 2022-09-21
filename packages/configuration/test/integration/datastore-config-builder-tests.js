/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const DataStoreConfigBuilder = require('../../lib/builders/datastore-config-builder');

describe(helper.testName(), function () {
  it('builds a data config object', () => {
    const testName = 'testName';
    const testProvider = 'testProvider';
    const testIsDefault = true;
    const testIsFsync = true;
    const testDbFile = '/testDbFile';
    const testFileName = 'testDataFile';

    const builder = new DataStoreConfigBuilder();
    const result = builder
      .withName(testName)
      .withProvider(testProvider)
      .withIsDefault(testIsDefault)
      .withIsFsync(testIsFsync)
      .withDbFile(testDbFile)
      .withFileName(testFileName)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.name).to.equal(testName);
    helper.expect(result.provider).to.equal(testProvider);
    helper.expect(result.isDefault).to.equal(testIsDefault);
    helper.expect(result.settings.fsync).to.equal(testIsFsync);
    helper.expect(result.dbfile).to.equal(testDbFile);
  });
});
