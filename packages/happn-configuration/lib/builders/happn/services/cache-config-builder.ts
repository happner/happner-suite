/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class CacheConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withStatisticsInterval(interval: number): CacheConfigBuilder {
    this.set(`config.statisticsInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withStatisticsCheckoutPointCacheAuthOverride(max: number, maxAge: number): CacheConfigBuilder {
    this.set('config.overrides.checkpoint_cache_authorization.max', max, BaseBuilder.Types.INTEGER);
    this.set(
      'config.overrides.checkpoint_cache_authorization.maxAge',
      maxAge,
      BaseBuilder.Types.INTEGER
    );

    return this;
  }

  withStatisticsCheckoutPointCacheAuthTokenOverride(
    max: number,
    maxAge: number
  ): CacheConfigBuilder {
    this.set(
      'config.overrides.checkpoint_cache_authorization_token.max',
      max,
      BaseBuilder.Types.INTEGER
    );
    this.set(
      'config.overrides.checkpoint_cache_authorization_token.maxAge',
      maxAge,
      BaseBuilder.Types.INTEGER
    );

    return this;
  }

  withStatisticsCacheSecurityGroupsOverride(max: number, maxAge: number): CacheConfigBuilder {
    this.set('config.overrides.cache_security_groups.max', max, BaseBuilder.Types.INTEGER);
    this.set('config.overrides.cache_security_groups.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    return this;
  }

  withStatisticsCacheSecurityUsersOverride(max: number, maxAge: number): CacheConfigBuilder {
    this.set('config.overrides.cache_security_users.max', max, BaseBuilder.Types.INTEGER);
    this.set('config.overrides.cache_security_users.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    return this;
  }

  withStatisticsCacheSecurityGroupPermissionsOverride(
    max: number,
    maxAge: number
  ): CacheConfigBuilder {
    this.set(
      'config.overrides.cache_security_group_permissions.max',
      max,
      BaseBuilder.Types.INTEGER
    );
    this.set(
      'config.overrides.cache_security_group_permissions.maxAge',
      maxAge,
      BaseBuilder.Types.INTEGER
    );

    return this;
  }

  withStatisticsCacheSecurityUserPermissionsOverride(
    max: number,
    maxAge: number
  ): CacheConfigBuilder {
    this.set(
      'config.overrides.cache_security_user_permissions.max',
      max,
      BaseBuilder.Types.INTEGER
    );
    this.set(
      'config.overrides.cache_security_user_permissions.maxAge',
      maxAge,
      BaseBuilder.Types.INTEGER
    );

    return this;
  }

  withStatisticsCacheSecurityPasswordsOverride(max: number, maxAge: number): CacheConfigBuilder {
    this.set('config.overrides.cache_security_passwords.max', max, BaseBuilder.Types.INTEGER);
    this.set('config.overrides.cache_security_passwords.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    return this;
  }
}