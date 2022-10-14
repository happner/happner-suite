/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full cache config', () => {
    const config = createValidCacheConfig();
    const result = validator.validateCacheConfig(config);

    helper.expect(result.valid).to.equal(true);
  });

  /*
  security_group_permissions
   */

  it('validates cache config with missing security_group_permissions.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[0].cache_security_group_permissions.max;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing security_group_permissions.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[0].cache_security_group_permissions.maxAge;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid security_group_permissions.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[0].cache_security_group_permissions.max = null;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/0/cache_security_group_permissions/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid security_group_permissions.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[0].cache_security_group_permissions.maxAge = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/0/cache_security_group_permissions/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  cache_security_groups
   */

  it('validates cache config with missing cache_security_groups.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[1].cache_security_groups.max;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_groups.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[1].cache_security_groups.maxAge;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid cache_security_groups.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[1].cache_security_groups.max = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/1/cache_security_groups/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid cache_security_groups.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[1].cache_security_groups.maxAge = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/1/cache_security_groups/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  cache_security_passwords
   */

  it('validates cache config with missing cache_security_passwords.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[2].cache_security_passwords.max;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_passwords.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[2].cache_security_passwords.maxAge;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid cache_security_passwords.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[2].cache_security_passwords.max = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/2/cache_security_passwords/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid cache_security_passwords.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[2].cache_security_passwords.maxAge = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/2/cache_security_passwords/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  cache_security_user_permissions
   */

  it('validates cache config with missing cache_security_user_permissions.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[3].cache_security_user_permissions.max;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_user_permissions.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[3].cache_security_user_permissions.maxAge;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid cache_security_user_permissions.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[3].cache_security_user_permissions.max = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/3/cache_security_user_permissions/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid cache_security_user_permissions.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[3].cache_security_user_permissions.maxAge = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/3/cache_security_user_permissions/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  cache_security_users
   */

  it('validates cache config with missing cache_security_users.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[4].cache_security_users.max;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_users.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[4].cache_security_users.maxAge;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid cache_security_users.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[4].cache_security_users.max = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/4/cache_security_users/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid cache_security_users.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[4].cache_security_users.maxAge = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/4/cache_security_users/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  checkpoint_cache_authorization
   */

  it('validates cache config with missing checkpoint_cache_authorization.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[5].checkpoint_cache_authorization.max;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing checkpoint_cache_authorization.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[5].checkpoint_cache_authorization.maxAge;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid checkpoint_cache_authorization.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[5].checkpoint_cache_authorization.max = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/5/checkpoint_cache_authorization/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid checkpoint_cache_authorization.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[5].checkpoint_cache_authorization.maxAge = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/5/checkpoint_cache_authorization/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  checkpoint_cache_authorization_token
   */

  it('validates cache config with missing checkpoint_cache_authorization_token.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[6].checkpoint_cache_authorization_token.max;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing checkpoint_cache_authorization_token.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides[6].checkpoint_cache_authorization_token.maxAge;

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid checkpoint_cache_authorization_token.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[6].checkpoint_cache_authorization_token.max = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/6/checkpoint_cache_authorization_token/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid checkpoint_cache_authorization_token.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[6].checkpoint_cache_authorization_token.maxAge = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/6/checkpoint_cache_authorization_token/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  it('invalidates cache config with invalid statisticsInterval', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.statisticsInterval = 'invalid type';

    let result = validator.validateCacheConfig(cacheConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].instancePath).to.equal('/config/statisticsInterval');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });
});

function createValidCacheConfig() {
  return {
    config: {
      overrides: [
        {
          cache_security_group_permissions: {
            max: 5,
            maxAge: 1000,
          },
        },
        {
          cache_security_groups: {
            max: 6,
            maxAge: 2000,
          },
        },
        {
          cache_security_passwords: {
            max: 7,
            maxAge: 3000,
          },
        },
        {
          cache_security_user_permissions: {
            max: 8,
            maxAge: 4000,
          },
        },
        {
          cache_security_users: {
            max: 9,
            maxAge: 5000,
          },
        },
        {
          checkpoint_cache_authorization: {
            max: 10,
            maxAge: 6000,
          },
        },
        {
          checkpoint_cache_authorization_token: {
            max: 11,
            maxAge: 7000,
          },
        },
      ],
      statisticsInterval: 5000,
    },
  };
}
