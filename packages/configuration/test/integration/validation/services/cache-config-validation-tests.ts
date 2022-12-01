/* eslint-disable no-console,no-unused-vars */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

describe('cache configuration validation tests', function () {
  const validator = new ConfigValidator();

  it('validates full cache config', () => {
    const config = createValidCacheConfig();
    const result = validator.validateCacheConfig(config);

    expect(result.valid).to.equal(true);
  });

  /*
  security_group_permissions
   */

  it('validates cache config with missing security_group_permissions.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_group_permissions.max;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing security_group_permissions.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_group_permissions.maxAge;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with invalid security_group_permissions.max', () => {
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides.cache_security_group_permissions.max = null;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(false);
    expect(result.errors[0].instancePath).to.equal(
      '/config/overrides/cache_security_group_permissions/max'
    );
    expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  cache_security_groups
   */

  it('validates cache config with missing cache_security_groups.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_groups.max;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_groups.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_groups.maxAge;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  cache_security_passwords
   */

  it('validates cache config with missing cache_security_passwords.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_passwords.max;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_passwords.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_passwords.maxAge;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  cache_security_user_permissions
   */

  it('validates cache config with missing cache_security_user_permissions.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_user_permissions.max;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_user_permissions.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_user_permissions.maxAge;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  cache_security_users
   */

  it('validates cache config with missing cache_security_users.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_users.max;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing cache_security_users.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.cache_security_users.maxAge;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  checkpoint_cache_authorization
   */

  it('validates cache config with missing checkpoint_cache_authorization.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.checkpoint_cache_authorization.max;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing checkpoint_cache_authorization.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.checkpoint_cache_authorization.maxAge;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  checkpoint_cache_authorization_token
   */

  it('validates cache config with missing checkpoint_cache_authorization_token.max', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.checkpoint_cache_authorization_token.max;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates cache config with missing checkpoint_cache_authorization_token.maxAge', () => {
    const cacheConfig = createValidCacheConfig();
    delete cacheConfig.config.overrides.checkpoint_cache_authorization_token.maxAge;

    const result = validator.validateCacheConfig(cacheConfig);

    expect(result.valid).to.equal(true);
  });
});

function createValidCacheConfig() {
  return {
    config: {
      statisticsInterval: 5000,
      overrides: {
        cache_security_group_permissions: {
          max: 5,
          maxAge: 1000,
        },
        cache_security_groups: {
          max: 6,
          maxAge: 2000,
        },
        cache_security_passwords: {
          max: 7,
          maxAge: 3000,
        },
        cache_security_user_permissions: {
          max: 8,
          maxAge: 4000,
        },
        cache_security_users: {
          max: 9,
          maxAge: 5000,
        },
        checkpoint_cache_authorization: {
          max: 10,
          maxAge: 6000,
        },
        checkpoint_cache_authorization_token: {
          max: 11,
          maxAge: 7000,
        },
      },
    },
  };
}
