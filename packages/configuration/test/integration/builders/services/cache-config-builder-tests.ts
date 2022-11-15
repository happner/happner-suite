/* eslint-disable no-console */
import { expect } from 'chai';
import { CacheConfigBuilder } from '../../../../lib/builders/happn/services/cache-config-builder';

describe('cache configuration builder tests', function () {
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

    // transform array to object
    const reduced = result.config.overrides.reduce((previousValue, currentValue) => {
      let key = Object.keys(currentValue)[0];
      previousValue[key] = currentValue[key];
      return previousValue;
    }, {});

    expect(reduced.cache_security_group_permissions.max).to.equal(
      mockCacheSecurityGroupPermissionMax
    );
    expect(reduced.cache_security_group_permissions.maxAge).to.equal(
      mockCacheSecurityGroupPermissionMaxAge
    );
    expect(reduced.cache_security_groups.max).to.equal(mockCacheSecurityGroupsMax);
    expect(reduced.cache_security_groups.maxAge).to.equal(mockCacheSecurityGroupsMaxAge);
    expect(reduced.cache_security_passwords.max).to.equal(mockCacheSecurityPasswordsOverrideMax);
    expect(reduced.cache_security_passwords.maxAge).to.equal(
      mockCacheSecurityPasswordsOverrideMaxAge
    );
    expect(reduced.cache_security_user_permissions.max).to.equal(
      mockCacheSecurityUserPermissionsOverrideMax
    );
    expect(reduced.cache_security_user_permissions.maxAge).to.equal(
      mockCacheSecurityUserPermissionsOverrideMaxAge
    );
    expect(reduced.cache_security_users.max).to.equal(mockCacheSecurityUsersOverrideMax);
    expect(reduced.cache_security_users.maxAge).to.equal(mockCacheSecurityUsersOverrideMaxAge);
    expect(reduced.checkpoint_cache_authorization.max).to.equal(
      mockCacheCheckPointCacheAuthOverrideMax
    );
    expect(reduced.checkpoint_cache_authorization.maxAge).to.equal(
      mockCacheCheckPointCacheAuthOverrideMaxAge
    );
    expect(reduced.checkpoint_cache_authorization_token.max).to.equal(
      mockCacheCheckPointCacheAuthTokenOverrideMax
    );
    expect(reduced.checkpoint_cache_authorization_token.maxAge).to.equal(
      mockCacheCheckPointCacheAuthTokenOverrideMaxAge
    );
    expect(result.config.statisticsInterval).to.equal(mockStatisticsInterval);
  });
});
