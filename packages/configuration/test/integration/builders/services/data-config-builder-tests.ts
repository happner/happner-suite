/* eslint-disable no-console */
import { DataConfigBuilder } from '../../../../lib/builders/happn/services/data-config-builder';
import { expect } from 'chai';

describe('data configuration builder tests', function () {
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

    expect(result.config.secure).to.equal(mockSecure);
    expect(result.config.datastores[0].name).to.equal(mockName);
    expect(result.config.datastores[0].provider).to.equal(mockProvider);
    expect(result.config.datastores[0].isDefault).to.equal(mockIsDefault);
    expect(result.config.datastores[0].settings.fsync).to.equal(mockIsFsync);
    expect(result.config.datastores[0].dbfile).to.equal(mockDbFile);
  });
});
