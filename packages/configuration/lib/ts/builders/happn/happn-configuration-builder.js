"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnConfigurationBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = require('../../../constants/config-constants').HAPPN_SERVICES_ROOT;
class HappnConfigurationBuilder extends BaseBuilder {
    #cacheConfigBuilder;
    #connectConfigBuilder;
    #dataConfigBuilder;
    #protocolConfigBuilder;
    #publisherConfigBuilder;
    #securityConfigBuilder;
    #subscriptionConfigBuilder;
    #systemConfigBuilder;
    #transportConfigBuilder;
    constructor(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder) {
        super();
        this.#cacheConfigBuilder = cacheConfigBuilder;
        this.#connectConfigBuilder = connectConfigBuilder;
        this.#dataConfigBuilder = dataConfigBuilder;
        this.#protocolConfigBuilder = protocolConfigBuilder;
        this.#publisherConfigBuilder = publisherConfigBuilder;
        this.#securityConfigBuilder = securityConfigBuilder;
        this.#subscriptionConfigBuilder = subscriptionConfigBuilder;
        this.#systemConfigBuilder = systemConfigBuilder;
        this.#transportConfigBuilder = transportConfigBuilder;
    }
    /*
    CACHE
     */
    withCacheStatisticsCheckPointAuthOverride(max, maxAge) {
        this.#cacheConfigBuilder.withStatisticsCheckoutPointCacheAuthOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsCheckPointAuthTokenOverride(max, maxAge) {
        this.#cacheConfigBuilder.withStatisticsCheckoutPointCacheAuthTokenOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsInterval(interval) {
        this.#cacheConfigBuilder.withStatisticsInterval(interval);
        return this;
    }
    withCacheStatisticsSecurityGroupPermissionsOverride(max, maxAge) {
        this.#cacheConfigBuilder.withStatisticsCacheSecurityGroupPermissionsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityGroupsOverride(max, maxAge) {
        this.#cacheConfigBuilder.withStatisticsCacheSecurityGroupsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityPasswordsOverride(max, maxAge) {
        this.#cacheConfigBuilder.withStatisticsCacheSecurityPasswordsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityUserPermissionsOverride(max, maxAge) {
        this.#cacheConfigBuilder.withStatisticsCacheSecurityUserPermissionsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityUsersOverride(max, maxAge) {
        this.#cacheConfigBuilder.withStatisticsCacheSecurityUsersOverride(max, maxAge);
        return this;
    }
    /*
    CONNECT
     */
    withConnectSecurityCookie(name, domain) {
        this.#connectConfigBuilder.withSecurityCookieDomain(domain).withSecurityCookieName(name);
        return this;
    }
    /***
     * Can be invoked multiple times to add more than 1 exclusion
     * @param exclusion
     */
    withConnectSecurityExclusion(exclusion) {
        this.#connectConfigBuilder.withSecurityExclusion(exclusion);
        return this;
    }
    withConnectSecurityForbiddenResponsePath(path) {
        this.#connectConfigBuilder.withSecurityForbiddenResponsePath(path);
        return this;
    }
    withConnectSecurityUnauthorizedResponsePath(path) {
        this.#connectConfigBuilder.withSecurityUnauthorizedResponsePath(path);
        return this;
    }
    /*
    DATA
     */
    /***
     * Adds a new datastore - can be invoked multiple times, if more than one datastore is to be configured.
     * @param name
     * @param provider
     * @param isDefault
     * @param isFsync
     * @param dbFile
     * @param fileName
     */
    withDataStore(name, provider, isDefault, isFsync, dbFile, fileName) {
        this.#dataConfigBuilder.withDataStore(name, provider, isDefault, isFsync, dbFile, fileName);
        return this;
    }
    withDataIsSecure(isSecure) {
        this.#dataConfigBuilder.withSecure(isSecure);
        return this;
    }
    /*
    PROTOCOLS
     */
    withProtocolAllowNestedPermissions(isAllowed) {
        this.#protocolConfigBuilder.withAllowNestedPermissions(isAllowed);
        return this;
    }
    withProtocolInboundLayer(layer) {
        this.#protocolConfigBuilder.withInboundLayer(layer);
        return this;
    }
    withProtocolIsSecure(isSecure) {
        this.#protocolConfigBuilder.withSecure(isSecure);
        return this;
    }
    withProtocolOutboundLayer(layer) {
        this.#protocolConfigBuilder.withOutboundLayer(layer);
        return this;
    }
    /*
    PUBLISHER
     */
    withPublisherAcknowledgeTimeout(acknowledge) {
        this.#publisherConfigBuilder.withAcknowledgeTimeout(acknowledge);
        return this;
    }
    withPublisherTimeout(timeout) {
        this.#publisherConfigBuilder.withTimeout(timeout);
        return this;
    }
    /*
    SECURITY
     */
    withSecurityActivateSessionManagement(activate) {
        this.#securityConfigBuilder.withActivateSessionManagement(activate);
        return this;
    }
    withSecurityAccountLockoutEnabled(enabled) {
        this.#securityConfigBuilder.withAccountLockoutEnabled(enabled);
        return this;
    }
    withSecurityAccountLockoutAttempts(attempts) {
        this.#securityConfigBuilder.withAccountLockoutAttempts(attempts);
        return this;
    }
    withSecurityAccountLockoutRetryInterval(retryInterval) {
        this.#securityConfigBuilder.withAccountLockoutRetryInterval(retryInterval);
        return this;
    }
    withSecurityAdminUsername(username) {
        this.#securityConfigBuilder.withAdminUsername(username);
        return this;
    }
    withSecurityAdminPassword(password) {
        this.#securityConfigBuilder.withAdminPassword(password);
        return this;
    }
    withSecurityAdminPublicKey(publicKey) {
        this.#securityConfigBuilder.withAdminPublicKey(publicKey);
        return this;
    }
    withSecurityAdminGroupName(groupName) {
        this.#securityConfigBuilder.withAdminGroupName(groupName);
        return this;
    }
    // repeatable using same key and different path
    withSecurityAdminGroupPermission(permissionKey, actionPath) {
        this.#securityConfigBuilder.withAdminGroupPermission(permissionKey, actionPath);
        return this;
    }
    withSecurityAllowAnonymousAccess(allowAnonymous) {
        this.#securityConfigBuilder.withAllowAnonymousAccess(allowAnonymous);
        return this;
    }
    withSecurityAuditPath(path) {
        this.#securityConfigBuilder.withAuditPath(path);
        return this;
    }
    withSecurityAuthProvider(name, instance) {
        this.#securityConfigBuilder.withAuthProvider(name, instance);
        return this;
    }
    withSecurityCookie(name, domain, cookie) {
        this.#securityConfigBuilder.withHttpsCookie(name, domain, cookie);
        return this;
    }
    withSecurityLogSessionActivity(shouldLog) {
        this.#securityConfigBuilder.withLogSessionActivity(shouldLog);
        return this;
    }
    withSecurityLockTokenToLoginType(shouldLock) {
        this.#securityConfigBuilder.withLockTokenToLoginType(shouldLock);
        return this;
    }
    withSecurityLockTokenToUserId(shouldLock) {
        this.#securityConfigBuilder.withLockTokenToUserId(shouldLock);
        return this;
    }
    //TODO: lookups
    withSecurityPbkdf2Iterations(iterations) {
        this.#securityConfigBuilder.withPbkdf2Iterations(iterations);
        return this;
    }
    withSecurityProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold) {
        this.#securityConfigBuilder.withProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold);
        return this;
    }
    withSecurityIsSecure(isSecure) {
        this.#securityConfigBuilder.withSecure(isSecure);
        return this;
    }
    withSessionActivityTTL(ttl) {
        this.#securityConfigBuilder.withSessionActivityTTL(ttl);
        return this;
    }
    withSessionTokenSecret(secret) {
        this.#securityConfigBuilder.withSessionTokenSecret(secret);
        return this;
    }
    /*
    SUBSCRIPTION
     */
    withSubscriptionAllowNestedPermissions(shouldAllow) {
        this.#subscriptionConfigBuilder.withAllowNestedPermissions(shouldAllow);
        return this;
    }
    withSubscriptionTreeSearchCacheSize(size) {
        this.#subscriptionConfigBuilder.withSubscriptionTreeSearchCacheSize(size);
        return this;
    }
    withSubscriptionTreePermutationCacheSize(size) {
        this.#subscriptionConfigBuilder.withSubscriptionTreePermutationCacheSize(size);
        return this;
    }
    withSubscriptionTreeTimeout(timeout) {
        this.#subscriptionConfigBuilder.withSubscriptionTreeTimeout(timeout);
        return this;
    }
    withSubscriptionTreeFilterFunction(func) {
        this.#subscriptionConfigBuilder.withSubscriptionTreeFilterFunc(func);
        return this;
    }
    /*
    SYSTEM
     */
    withSystemName(name) {
        this.#systemConfigBuilder.withName(name);
        return this;
    }
    /*
    TRANSPORT
     */
    withTransportCert(cert) {
        this.#transportConfigBuilder.withCert(cert);
        return this;
    }
    withTransportCertPath(certPath) {
        this.#transportConfigBuilder.withCertPath(certPath);
        return this;
    }
    withTransportKeepAliveTimout(timeout) {
        this.#transportConfigBuilder.withKeepAliveTimeout(timeout);
        return this;
    }
    withTransportKey(key) {
        this.#transportConfigBuilder.withKey(key);
        return this;
    }
    withTransportKeyPath(keyPath) {
        this.#transportConfigBuilder.withKeyPath(keyPath);
        return this;
    }
    withTransportMode(mode) {
        this.#transportConfigBuilder.withMode(mode);
        return this;
    }
    /*
    HAPPN
     */
    build() {
        this.set(`${ROOT}.cache`, this.#cacheConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.connect`, this.#connectConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.data`, this.#dataConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.protocol`, this.#protocolConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.publisher`, this.#publisherConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.security`, this.#securityConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.subscription`, this.#subscriptionConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.system`, this.#systemConfigBuilder, BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.transport`, this.#transportConfigBuilder, BaseBuilder.Types.OBJECT);
        return super.build();
    }
}
exports.HappnConfigurationBuilder = HappnConfigurationBuilder;
