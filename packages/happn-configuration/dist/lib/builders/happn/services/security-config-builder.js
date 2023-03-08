"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const BaseBuilder = require('happn-commons/lib/base-builder');
class SecurityConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withUpdateSubscriptionsOnSecurityDirectoryChanged(shouldUpdate) {
        this.set('config.updateSubscriptionsOnSecurityDirectoryChanged', shouldUpdate, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withDisableDefaultAdminNetworkConnections(shouldDisable) {
        this.set('config.disableDefaultAdminNetworkConnections', shouldDisable, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withDefaultNonceTTL(ttl) {
        this.set('config.defaultNonceTTL', ttl, BaseBuilder.Types.INTEGER);
        return this;
    }
    withLogSessionActivity(shouldLog) {
        this.set('config.logSessionActivity', shouldLog, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withSessionActivityTTL(ttl) {
        this.set('config.sessionActivityTTL', ttl, BaseBuilder.Types.INTEGER);
        return this;
    }
    withPbkdf2Iterations(iterations) {
        this.set('config.pbkdf2Iterations', iterations, BaseBuilder.Types.INTEGER);
        return this;
    }
    withLockTokenToLoginType(shouldLock) {
        this.set('config.lockTokenToLoginType', shouldLock, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withLockTokenToUserId(shouldLock) {
        this.set('config.lockTokenToUserId', shouldLock, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withHttpsCookie(name, domain, cookie) {
        this.set('config.cookieName', name, BaseBuilder.Types.STRING);
        this.set('config.cookieDomain', domain, BaseBuilder.Types.STRING);
        this.set('config.httpsCookie', cookie, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withAllowAnonymousAccess(allow) {
        this.set('config.allowAnonymousAccess', allow, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    // TODO: do we need a builder here?
    withLookup(lookup) {
        this.set('config.lookup', lookup, BaseBuilder.Types.OBJECT);
        return this;
    }
    withSessionTokenSecret(secret) {
        this.set('config.sessionTokenSecret', secret, BaseBuilder.Types.STRING);
        return this;
    }
    withActivateSessionManagement(activate) {
        this.set('config.activateSessionManagement', activate, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withAccountLockoutEnabled(enabled) {
        this.set('config.accountLockout.enabled', enabled, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withAccountLockoutAttempts(attempts) {
        this.set('config.accountLockout.attempts', attempts, BaseBuilder.Types.INTEGER);
        return this;
    }
    withAccountLockoutRetryInterval(interval) {
        this.set('config.accountLockout.retryInterval', interval, BaseBuilder.Types.INTEGER);
        return this;
    }
    withAdminPassword(password) {
        this.set('config.adminUser.password', password, BaseBuilder.Types.STRING);
        return this;
    }
    withAdminPublicKey(publicKey) {
        this.set('config.adminUser.publicKey', publicKey, BaseBuilder.Types.STRING);
        return this;
    }
    withAdminGroupCustomData(fieldName, fieldValue) {
        this.set(`config.adminGroup.custom_data.${fieldName}`, fieldValue, BaseBuilder.Types.STRING);
        return this;
    }
    withAdminGroupPermission(permissionKey, actionPath) {
        const builder = new BaseBuilder();
        builder.push('actions', actionPath);
        this.set(`config.adminGroup.permissions.${permissionKey}`, builder, BaseBuilder.Types.OBJECT);
        return this;
    }
    withAuthProvider(providerName, providerInstance) {
        this.set(`config.authProviders.${providerName}`, providerInstance, BaseBuilder.Types.OBJECT);
        return this;
    }
    withDefaultAuthProvider(providerName) {
        this.set('config.defaultAuthProvider', providerName, BaseBuilder.Types.String);
        return this;
    }
    withProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold) {
        const builder = new BaseBuilder();
        builder.set('name', name, BaseBuilder.Types.STRING);
        builder.set('policy.ttl', policyTTL, BaseBuilder.Types.INTEGER);
        builder.set('policy.inactivity_threshold', policyInactiveThreshold, BaseBuilder.Types.NUMERIC);
        let matchType;
        switch (typeof sessionMatchOn) {
            case 'boolean':
                matchType = BaseBuilder.Types.BOOLEAN;
                break;
            case 'string':
                matchType = BaseBuilder.Types.STRING;
                break;
            case 'number':
                matchType = BaseBuilder.Types.NUMERIC;
                break;
            default:
        }
        builder.set(`session.${sessionKey}.$eq`, sessionMatchOn, matchType);
        this.push(`config.profiles`, builder, BaseBuilder.Types.OBJECT);
        return this;
    }
}
exports.SecurityConfigBuilder = SecurityConfigBuilder;
