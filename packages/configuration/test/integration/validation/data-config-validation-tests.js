/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates full data config', () => {
    const validator = new ConfigValidator();
    const config = createValidDataConfig();

    const result = validator.validateDataConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidDataConfig() {
  return {
    config: {
      secure: true,
      datastores: [
        {
          name: 'testName',
          provider: 'testProvider',
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
