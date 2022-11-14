"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _HappnConfigurationBuilder_cacheConfigBuilder, _HappnConfigurationBuilder_connectConfigBuilder, _HappnConfigurationBuilder_dataConfigBuilder, _HappnConfigurationBuilder_protocolConfigBuilder, _HappnConfigurationBuilder_publisherConfigBuilder, _HappnConfigurationBuilder_securityConfigBuilder, _HappnConfigurationBuilder_subscriptionConfigBuilder, _HappnConfigurationBuilder_systemConfigBuilder, _HappnConfigurationBuilder_transportConfigBuilder;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnConfigurationBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = require('../../../constants/config-constants').HAPPN_SERVICES_ROOT;
class HappnConfigurationBuilder extends BaseBuilder {
    constructor(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder) {
        super();
        _HappnConfigurationBuilder_cacheConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_connectConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_dataConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_protocolConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_publisherConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_securityConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_subscriptionConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_systemConfigBuilder.set(this, void 0);
        _HappnConfigurationBuilder_transportConfigBuilder.set(this, void 0);
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_cacheConfigBuilder, cacheConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_connectConfigBuilder, connectConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_dataConfigBuilder, dataConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_protocolConfigBuilder, protocolConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_publisherConfigBuilder, publisherConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_securityConfigBuilder, securityConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_subscriptionConfigBuilder, subscriptionConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_systemConfigBuilder, systemConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnConfigurationBuilder_transportConfigBuilder, transportConfigBuilder, "f");
    }
    /*
    CACHE
     */
    withCacheStatisticsCheckPointAuthOverride(max, maxAge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsCheckoutPointCacheAuthOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsCheckPointAuthTokenOverride(max, maxAge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsCheckoutPointCacheAuthTokenOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsInterval(interval) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsInterval(interval);
        return this;
    }
    withCacheStatisticsSecurityGroupPermissionsOverride(max, maxAge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsCacheSecurityGroupPermissionsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityGroupsOverride(max, maxAge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsCacheSecurityGroupsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityPasswordsOverride(max, maxAge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsCacheSecurityPasswordsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityUserPermissionsOverride(max, maxAge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsCacheSecurityUserPermissionsOverride(max, maxAge);
        return this;
    }
    withCacheStatisticsSecurityUsersOverride(max, maxAge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f").withStatisticsCacheSecurityUsersOverride(max, maxAge);
        return this;
    }
    /*
    CONNECT
     */
    withConnectSecurityCookie(name, domain) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_connectConfigBuilder, "f").withSecurityCookieDomain(domain).withSecurityCookieName(name);
        return this;
    }
    /***
     * Can be invoked multiple times to add more than 1 exclusion
     * @param exclusion
     */
    withConnectSecurityExclusion(exclusion) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_connectConfigBuilder, "f").withSecurityExclusion(exclusion);
        return this;
    }
    withConnectSecurityForbiddenResponsePath(path) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_connectConfigBuilder, "f").withSecurityForbiddenResponsePath(path);
        return this;
    }
    withConnectSecurityUnauthorizedResponsePath(path) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_connectConfigBuilder, "f").withSecurityUnauthorizedResponsePath(path);
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
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_dataConfigBuilder, "f").withDataStore(name, provider, isDefault, isFsync, dbFile, fileName);
        return this;
    }
    withDataIsSecure(isSecure) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_dataConfigBuilder, "f").withSecure(isSecure);
        return this;
    }
    /*
    PROTOCOLS
     */
    withProtocolAllowNestedPermissions(isAllowed) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_protocolConfigBuilder, "f").withAllowNestedPermissions(isAllowed);
        return this;
    }
    withProtocolInboundLayer(layer) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_protocolConfigBuilder, "f").withInboundLayer(layer);
        return this;
    }
    withProtocolIsSecure(isSecure) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_protocolConfigBuilder, "f").withSecure(isSecure);
        return this;
    }
    withProtocolOutboundLayer(layer) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_protocolConfigBuilder, "f").withOutboundLayer(layer);
        return this;
    }
    /*
    PUBLISHER
     */
    withPublisherAcknowledgeTimeout(acknowledge) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_publisherConfigBuilder, "f").withAcknowledgeTimeout(acknowledge);
        return this;
    }
    withPublisherTimeout(timeout) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_publisherConfigBuilder, "f").withTimeout(timeout);
        return this;
    }
    /*
    SECURITY
     */
    withSecurityActivateSessionManagement(activate) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withActivateSessionManagement(activate);
        return this;
    }
    withSecurityAccountLockoutEnabled(enabled) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAccountLockoutEnabled(enabled);
        return this;
    }
    withSecurityAccountLockoutAttempts(attempts) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAccountLockoutAttempts(attempts);
        return this;
    }
    withSecurityAccountLockoutRetryInterval(retryInterval) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAccountLockoutRetryInterval(retryInterval);
        return this;
    }
    withSecurityAdminUsername(username) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAdminUsername(username);
        return this;
    }
    withSecurityAdminPassword(password) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAdminPassword(password);
        return this;
    }
    withSecurityAdminPublicKey(publicKey) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAdminPublicKey(publicKey);
        return this;
    }
    withSecurityAdminGroupName(groupName) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAdminGroupName(groupName);
        return this;
    }
    // repeatable using same key and different path
    withSecurityAdminGroupPermission(permissionKey, actionPath) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAdminGroupPermission(permissionKey, actionPath);
        return this;
    }
    withSecurityAllowAnonymousAccess(allowAnonymous) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAllowAnonymousAccess(allowAnonymous);
        return this;
    }
    withSecurityAuditPath(path) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAuditPath(path);
        return this;
    }
    withSecurityAuthProvider(name, instance) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withAuthProvider(name, instance);
        return this;
    }
    withSecurityCookie(name, domain, cookie) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withHttpsCookie(name, domain, cookie);
        return this;
    }
    withSecurityLogSessionActivity(shouldLog) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withLogSessionActivity(shouldLog);
        return this;
    }
    withSecurityLockTokenToLoginType(shouldLock) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withLockTokenToLoginType(shouldLock);
        return this;
    }
    withSecurityLockTokenToUserId(shouldLock) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withLockTokenToUserId(shouldLock);
        return this;
    }
    //TODO: lookups
    withSecurityPbkdf2Iterations(iterations) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withPbkdf2Iterations(iterations);
        return this;
    }
    withSecurityProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold);
        return this;
    }
    withSecurityIsSecure(isSecure) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withSecure(isSecure);
        return this;
    }
    withSessionActivityTTL(ttl) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withSessionActivityTTL(ttl);
        return this;
    }
    withSessionTokenSecret(secret) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f").withSessionTokenSecret(secret);
        return this;
    }
    /*
    SUBSCRIPTION
     */
    withSubscriptionAllowNestedPermissions(shouldAllow) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_subscriptionConfigBuilder, "f").withAllowNestedPermissions(shouldAllow);
        return this;
    }
    withSubscriptionTreeSearchCacheSize(size) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreeSearchCacheSize(size);
        return this;
    }
    withSubscriptionTreePermutationCacheSize(size) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreePermutationCacheSize(size);
        return this;
    }
    withSubscriptionTreeTimeout(timeout) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreeTimeout(timeout);
        return this;
    }
    withSubscriptionTreeFilterFunction(func) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreeFilterFunc(func);
        return this;
    }
    /*
    SYSTEM
     */
    withSystemName(name) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_systemConfigBuilder, "f").withName(name);
        return this;
    }
    /*
    TRANSPORT
     */
    withTransportCert(cert) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_transportConfigBuilder, "f").withCert(cert);
        return this;
    }
    withTransportCertPath(certPath) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_transportConfigBuilder, "f").withCertPath(certPath);
        return this;
    }
    withTransportKeepAliveTimout(timeout) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_transportConfigBuilder, "f").withKeepAliveTimeout(timeout);
        return this;
    }
    withTransportKey(key) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_transportConfigBuilder, "f").withKey(key);
        return this;
    }
    withTransportKeyPath(keyPath) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_transportConfigBuilder, "f").withKeyPath(keyPath);
        return this;
    }
    withTransportMode(mode) {
        __classPrivateFieldGet(this, _HappnConfigurationBuilder_transportConfigBuilder, "f").withMode(mode);
        return this;
    }
    /*
    HAPPN
     */
    build() {
        this.set(`${ROOT}.cache`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_cacheConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.connect`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_connectConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.data`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_dataConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.protocol`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_protocolConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.publisher`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_publisherConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.security`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_securityConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.subscription`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_subscriptionConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.system`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_systemConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        this.set(`${ROOT}.transport`, __classPrivateFieldGet(this, _HappnConfigurationBuilder_transportConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        return super.build();
    }
}
exports.HappnConfigurationBuilder = HappnConfigurationBuilder;
_HappnConfigurationBuilder_cacheConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_connectConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_dataConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_protocolConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_publisherConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_securityConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_subscriptionConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_systemConfigBuilder = new WeakMap(), _HappnConfigurationBuilder_transportConfigBuilder = new WeakMap();
//# sourceMappingURL=happn-configuration-builder.js.map