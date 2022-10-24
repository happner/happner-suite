const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class CacheConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  // https://github.com/happner/happner-suite/blob/develop/packages/happn-3/docs/services/cache/configuration.md

  /*
  cache: {
            config: {
                statisticsInterval: 2e3, // setting a stats interval in milliseconds will print cache statistics to stdout for the interval
                overrides: {
                  // for LRU caches, these are what you can control in terms of cache sizes, and ttl's
                  // these configurations show the defaults
                  checkpoint_cache_authorization: {
                    // this cache holds authorization results by user session and path, it speeds up authorization lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  checkpoint_cache_authorization_token: {
                    // this cache holds authorization results by user session and path for token based requests, it speeds up authorization lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_groups: {
                    // security groups cache, speeds up group lookups
                    max: 5000,
                    maxAge: 0,
                  },
                  cache_security_users: {
                    // security users cache, speeds up user lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_group_permissions: {
                    // group permissions cache, speeds up group permission lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_user_permissions: {
                    // user permissions cache, speeds up user permission lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_passwords: {
                    // user passwords (hashed) by username cache, speeds up password lookups
                    max: 10000,
                    maxAge: 0,
                  },
                }
            }
        }
   */
  withStatisticsInterval(interval) {
    this.set(`config.statisticsInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withStatisticsCheckoutPointCacheAuthOverride(max, maxAge) {
    let builder = new BaseBuilder();
    builder.set('checkpoint_cache_authorization.max', max, BaseBuilder.Types.INTEGER);
    builder.set('checkpoint_cache_authorization.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    this.push(`config.overrides`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withStatisticsCheckoutPointCacheAuthTokenOverride(max, maxAge) {
    let builder = new BaseBuilder();
    builder.set('checkpoint_cache_authorization_token.max', max, BaseBuilder.Types.INTEGER);
    builder.set('checkpoint_cache_authorization_token.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    this.push(`config.overrides`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withStatisticsCacheSecurityGroupsOverride(max, maxAge) {
    let builder = new BaseBuilder();
    builder.set('cache_security_groups.max', max, BaseBuilder.Types.INTEGER);
    builder.set('cache_security_groups.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    this.push(`config.overrides`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withStatisticsCacheSecurityUsersOverride(max, maxAge) {
    let builder = new BaseBuilder();
    builder.set('cache_security_users.max', max, BaseBuilder.Types.INTEGER);
    builder.set('cache_security_users.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    this.push(`config.overrides`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withStatisticsCacheSecurityGroupPermissionsOverride(max, maxAge) {
    let builder = new BaseBuilder();
    builder.set('cache_security_group_permissions.max', max, BaseBuilder.Types.INTEGER);
    builder.set('cache_security_group_permissions.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    this.push(`config.overrides`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withStatisticsCacheSecurityUserPermissionsOverride(max, maxAge) {
    let builder = new BaseBuilder();
    builder.set('cache_security_user_permissions.max', max, BaseBuilder.Types.INTEGER);
    builder.set('cache_security_user_permissions.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    this.push(`config.overrides`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withStatisticsCacheSecurityPasswordsOverride(max, maxAge) {
    let builder = new BaseBuilder();
    builder.set('cache_security_passwords.max', max, BaseBuilder.Types.INTEGER);
    builder.set('cache_security_passwords.maxAge', maxAge, BaseBuilder.Types.INTEGER);

    this.push(`config.overrides`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }
};
