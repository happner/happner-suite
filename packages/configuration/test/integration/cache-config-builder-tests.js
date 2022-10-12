/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const CacheConfigBuilder = require('../../lib/builders/cache/cache-config-builder');
const ConfigValidator = require('../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('builds a cache config object', () => {
    const mockCacheSecurityGroupPermissionMax = 5;
    const mockCacheSecurityGroupPermissionMaxAge = 1000;

    const mockCacheSecurityGroupsMax = 6;
    const mockCacheSecurityGroupsMaxAge = 2000;

    const mockCacheSecurityPasswordsOverrideMax = 7;
    const mockCacheSecurityPasswordsOverrideMaxAge = 3000;

    const mockCacheSecurityUserPermissionsOverrideMax = 8;
    const mockCacheSecurityUserPermissionsOverrideMaxAge = 4000;

    const mockCacheSecurityUsersOverrideMax = 9;
    const mockCacheSecurityUsersOverrideMaxAge = 5000;

    const mockCacheCheckPointCacheAuthOverrideMax = 10;
    const mockCacheCheckPointCacheAuthOverrideMaxAge = 6000;

    const mockCacheCheckPointCacheAuthTokenOverrideMax = 11;
    const mockCacheCheckPointCacheAuthTokenOverrideMaxAge = 7000;

    const mockStatisticsInterval = 5000;

    const builder = new CacheConfigBuilder();
    const result = builder
      .withStatisticsCacheSecurityGroupPermissionsOverride(
        mockCacheSecurityGroupPermissionMax,
        mockCacheSecurityGroupPermissionMaxAge
      )
      .withStatisticsCacheSecurityGroupsOverride(
        mockCacheSecurityGroupsMax,
        mockCacheSecurityGroupsMaxAge
      )
      .withStatisticsCacheSecurityPasswordsOverride(
        mockCacheSecurityPasswordsOverrideMax,
        mockCacheSecurityPasswordsOverrideMaxAge
      )
      .withStatisticsCacheSecurityUserPermissionsOverride(
        mockCacheSecurityUserPermissionsOverrideMax,
        mockCacheSecurityUserPermissionsOverrideMaxAge
      )
      .withStatisticsCacheSecurityUsersOverride(
        mockCacheSecurityUsersOverrideMax,
        mockCacheSecurityUsersOverrideMaxAge
      )
      .withStatisticsCheckoutPointCacheAuthOverride(
        mockCacheCheckPointCacheAuthOverrideMax,
        mockCacheCheckPointCacheAuthOverrideMaxAge
      )
      .withStatisticsCheckoutPointCacheAuthTokenOverride(
        mockCacheCheckPointCacheAuthTokenOverrideMax,
        mockCacheCheckPointCacheAuthTokenOverrideMaxAge
      )
      .withStatisticsInterval(mockStatisticsInterval)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validator = new ConfigValidator();
    validator.validateCacheConfig(result);

    // transform array to object
    const reduced = result.config.overrides.reduce((previousValue, currentValue) => {
      let key = Object.keys(currentValue)[0];
      previousValue[key] = currentValue[key];
      return previousValue;
    }, {});

    helper
      .expect(reduced.cache_security_group_permissions.max)
      .to.equal(mockCacheSecurityGroupPermissionMax);
    helper
      .expect(reduced.cache_security_group_permissions.maxAge)
      .to.equal(mockCacheSecurityGroupPermissionMaxAge);
    helper.expect(reduced.cache_security_groups.max).to.equal(mockCacheSecurityGroupsMax);
    helper.expect(reduced.cache_security_groups.maxAge).to.equal(mockCacheSecurityGroupsMaxAge);
    helper
      .expect(reduced.cache_security_passwords.max)
      .to.equal(mockCacheSecurityPasswordsOverrideMax);
    helper
      .expect(reduced.cache_security_passwords.maxAge)
      .to.equal(mockCacheSecurityPasswordsOverrideMaxAge);
    helper
      .expect(reduced.cache_security_user_permissions.max)
      .to.equal(mockCacheSecurityUserPermissionsOverrideMax);
    helper
      .expect(reduced.cache_security_user_permissions.maxAge)
      .to.equal(mockCacheSecurityUserPermissionsOverrideMaxAge);
    helper.expect(reduced.cache_security_users.max).to.equal(mockCacheSecurityUsersOverrideMax);
    helper
      .expect(reduced.cache_security_users.maxAge)
      .to.equal(mockCacheSecurityUsersOverrideMaxAge);
    helper
      .expect(reduced.checkpoint_cache_authorization.max)
      .to.equal(mockCacheCheckPointCacheAuthOverrideMax);
    helper
      .expect(reduced.checkpoint_cache_authorization.maxAge)
      .to.equal(mockCacheCheckPointCacheAuthOverrideMaxAge);
    helper
      .expect(reduced.checkpoint_cache_authorization_token.max)
      .to.equal(mockCacheCheckPointCacheAuthTokenOverrideMax);
    helper
      .expect(reduced.checkpoint_cache_authorization_token.maxAge)
      .to.equal(mockCacheCheckPointCacheAuthTokenOverrideMaxAge);
    helper.expect(result.config.statisticsInterval).to.equal(mockStatisticsInterval);
  });
});
