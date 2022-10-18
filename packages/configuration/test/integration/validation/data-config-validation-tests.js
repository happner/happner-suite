/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full data config', () => {
    const config = createValidDataConfig();

    const result = validator.validateDataConfig(config);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates data config with missing secure', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.secure;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates data config with invalid secure', () => {
    const cacheConfig = createValidDataConfig();
    cacheConfig.config.secure = 12312321;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be boolean');
  });

  it('validates data config with missing datastore name', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].name;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates data config with invalid datastore name', () => {
    const cacheConfig = createValidDataConfig();
    cacheConfig.config.datastores[0].name = 390412034723894;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  it('invalidates data config with missing data provider', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].provider;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal("must have required property 'provider'");
  });

  it('invalidates data config with invalid data provider', () => {
    const cacheConfig = createValidDataConfig();
    cacheConfig.config.datastores[0].provider = 'invalid-provider';

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].message)
      .to.equal(
        'must match pattern "(happn-db-provider-elasticsearch|happn-db-provider-loki|happn-db-provider-mongo|happn-db-provider-nedb)"'
      );
  });

  it('validates data config with missing default', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].isDefault;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates data config with invalid default', () => {
    const cacheConfig = createValidDataConfig();
    cacheConfig.config.datastores[0].isDefault = 'should-be-boolean';

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be boolean');
  });

  it('validates data config with missing settings', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].settings;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates data config with missing settings.fsync', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].settings.fsync;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates data config with invalid settings.fsync', () => {
    const cacheConfig = createValidDataConfig();
    cacheConfig.config.datastores[0].settings.fsync = 'should-be-boolean';

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be boolean');
  });

  it('validates data config with missing dbfile path', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].dbfile;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates data config with invalid dbfile path', () => {
    const cacheConfig = createValidDataConfig();
    cacheConfig.config.datastores[0].dbfile = 8923791283;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  it('validates data config with missing file name', () => {
    const cacheConfig = createValidDataConfig();
    delete cacheConfig.config.datastores[0].filename;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates data config with invalid file name', () => {
    const cacheConfig = createValidDataConfig();
    cacheConfig.config.datastores[0].filename = 8923791283;

    let result = validator.validateDataConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
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
          },
          dbfile: '/testDbFile',
          filename: 'testDataFile',
        },
      ],
    },
  };
}
