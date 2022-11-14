"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class CacheConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
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
}
exports.CacheConfigBuilder = CacheConfigBuilder;
//# sourceMappingURL=cache-config-builder.js.map