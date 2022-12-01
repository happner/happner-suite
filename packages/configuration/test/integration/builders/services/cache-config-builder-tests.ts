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

    expect(result.config.overrides.cache_security_group_permissions.max).to.equal(
      mockCacheSecurityGroupPermissionMax
    );
    expect(result.config.overrides.cache_security_group_permissions.maxAge).to.equal(
      mockCacheSecurityGroupPermissionMaxAge
    );
    expect(result.config.overrides.cache_security_groups.max).to.equal(mockCacheSecurityGroupsMax);
    expect(result.config.overrides.cache_security_groups.maxAge).to.equal(mockCacheSecurityGroupsMaxAge);
    expect(result.config.overrides.cache_security_passwords.max).to.equal(
      mockCacheSecurityPasswordsOverrideMax
    );
    expect(result.config.overrides.cache_security_passwords.maxAge).to.equal(
      mockCacheSecurityPasswordsOverrideMaxAge
    );
    expect(result.config.overrides.cache_security_user_permissions.max).to.equal(
      mockCacheSecurityUserPermissionsOverrideMax
    );
    expect(result.config.overrides.cache_security_user_permissions.maxAge).to.equal(
      mockCacheSecurityUserPermissionsOverrideMaxAge
    );
    expect(result.config.overrides.cache_security_users.max).to.equal(mockCacheSecurityUsersOverrideMax);
    expect(result.config.overrides.cache_security_users.maxAge).to.equal(
      mockCacheSecurityUsersOverrideMaxAge
    );
    expect(result.config.overrides.checkpoint_cache_authorization.max).to.equal(
      mockCacheCheckPointCacheAuthOverrideMax
    );
    expect(result.config.overrides.checkpoint_cache_authorization.maxAge).to.equal(
      mockCacheCheckPointCacheAuthOverrideMaxAge
    );
    expect(result.config.overrides.checkpoint_cache_authorization_token.max).to.equal(
      mockCacheCheckPointCacheAuthTokenOverrideMax
    );
    expect(result.config.overrides.checkpoint_cache_authorization_token.maxAge).to.equal(
      mockCacheCheckPointCacheAuthTokenOverrideMaxAge
    );
    expect(result.config.statisticsInterval).to.equal(mockStatisticsInterval);
  });
});
