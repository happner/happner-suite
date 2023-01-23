/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('data configuration validation tests', function () {
  const validator = new ConfigValidator('1.0.0', mockLogger);

  it('validates full data config', () => {
    const config = createValidDataConfig();

    const result = validator.validateDataConfig(config);

    console.log(JSON.stringify(result.errors, null, 2));

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing secure', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.secure;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing datastore name', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].name;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing data provider', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].provider;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing default', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].isDefault;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing settings', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].settings;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing settings.fsync', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].settings.fsync;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing dbfile path', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].dbfile;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates data config with missing file name', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].settings.filename;

    const result = validator.validateDataConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });
});

function createValidDataConfig() {
  return {
    config: {
      secure: true,
      datastores: [
        {
          name: 'testName',
          provider: 'happn-db-provider-nedb',
          isDefault: true,
          settings: {
            fsync: true,
            filename: 'testDataFile',
          },
          dbfile: '/testDbFile',
        },
      ],
    },
  };
}
