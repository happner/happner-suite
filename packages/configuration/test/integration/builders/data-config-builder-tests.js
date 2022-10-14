/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const DataConfigBuilder = require('../../../lib/builders/data-config-builder');
const ConfigValidator = require('../../../lib/validators/config-validator');

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

    const result = dataConfigBuilder
      .withSecure(mockSecure)
      .withDataStore(mockName, mockProvider, mockIsDefault, mockIsFsync, mockDbFile, mockFileName)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.config.secure).to.equal(mockSecure);
    helper.expect(result.config.datastores[0].name).to.equal(mockName);
    helper.expect(result.config.datastores[0].provider).to.equal(mockProvider);
    helper.expect(result.config.datastores[0].isDefault).to.equal(mockIsDefault);
    helper.expect(result.config.datastores[0].settings.fsync).to.equal(mockIsFsync);
    helper.expect(result.config.datastores[0].dbfile).to.equal(mockDbFile);
  });
});
