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
var _Configuration_happnConfigBuilder, _Configuration_cacheConfigBuilder, _Configuration_connectConfigBuilder, _Configuration_dataConfigBuilder, _Configuration_protocolConfigBuilder, _Configuration_publisherConfigBuilder, _Configuration_securityConfigBuilder, _Configuration_subscriptionConfigBuilder, _Configuration_systemConfigBuilder, _Configuration_transportConfigBuilder;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configuration = void 0;
class Configuration {
    constructor(happnConfigBuilder, cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder) {
        _Configuration_happnConfigBuilder.set(this, void 0);
        _Configuration_cacheConfigBuilder.set(this, void 0);
        _Configuration_connectConfigBuilder.set(this, void 0);
        _Configuration_dataConfigBuilder.set(this, void 0);
        _Configuration_protocolConfigBuilder.set(this, void 0);
        _Configuration_publisherConfigBuilder.set(this, void 0);
        _Configuration_securityConfigBuilder.set(this, void 0);
        _Configuration_subscriptionConfigBuilder.set(this, void 0);
        _Configuration_systemConfigBuilder.set(this, void 0);
        _Configuration_transportConfigBuilder.set(this, void 0);
        __classPrivateFieldSet(this, _Configuration_happnConfigBuilder, happnConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_cacheConfigBuilder, cacheConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_connectConfigBuilder, connectConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_dataConfigBuilder, dataConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_protocolConfigBuilder, protocolConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_publisherConfigBuilder, publisherConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_securityConfigBuilder, securityConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_subscriptionConfigBuilder, subscriptionConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_systemConfigBuilder, systemConfigBuilder, "f");
        __classPrivateFieldSet(this, _Configuration_transportConfigBuilder, transportConfigBuilder, "f");
    }
    /*
    CACHE - TODO: COMPLETE THIS AND BUILDERS BASED ON NEW FIELDS
     */
    setCacheStatisticsInterval(interval) {
        __classPrivateFieldGet(this, _Configuration_cacheConfigBuilder, "f").withStatisticsInterval(interval);
    }
    /*
    CONNECT
     */
    setConnectSecurityCookie(name, domain) {
        __classPrivateFieldGet(this, _Configuration_connectConfigBuilder, "f").withSecurityCookieName(domain).withSecurityCookieName(name);
    }
    /***
     * Can be invoked multiple times to add more than 1 exclusion
     * @param exclusion
     */
    setConnectSecurityExclusion(exclusion) {
        __classPrivateFieldGet(this, _Configuration_connectConfigBuilder, "f").withSecurityExclusion(exclusion);
    }
    setConnectSecurityForbiddenResponsePath(path) {
        __classPrivateFieldGet(this, _Configuration_connectConfigBuilder, "f").withSecurityForbiddenResponsePath(path);
    }
    setConnectSecurityUnauthorizedResponsePath(path) {
        __classPrivateFieldGet(this, _Configuration_connectConfigBuilder, "f").withSecurityUnauthorizedResponsePath(path);
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
    setDataStore(name, provider, isDefault, isFsync, dbFile, fileName) {
        __classPrivateFieldGet(this, _Configuration_dataConfigBuilder, "f").withDataStore(name, provider, isDefault, isFsync, dbFile, fileName);
    }
    setDataIsSecure(isSecure) {
        __classPrivateFieldGet(this, _Configuration_dataConfigBuilder, "f").withSecure(isSecure);
    }
    /*
    PROTOCOLS
     */
    setProtocolAllowNestedPermissions(isAllowed) {
        __classPrivateFieldGet(this, _Configuration_protocolConfigBuilder, "f").withAllowNestedPermissions(isAllowed);
    }
    setProtocolHappnProtocol(version, successFunc, transformOutFunc, transformSystemFunc, emitFunc) {
        __classPrivateFieldGet(this, _Configuration_protocolConfigBuilder, "f").withHappnProtocol(version, successFunc, transformOutFunc, transformSystemFunc, emitFunc);
    }
    setProtocolInboundLayer(layer) {
        __classPrivateFieldGet(this, _Configuration_protocolConfigBuilder, "f").withInboundLayer(layer);
    }
    setProtocolIsSecure(isSecure) {
        __classPrivateFieldGet(this, _Configuration_protocolConfigBuilder, "f").withSecure(isSecure);
    }
    setProtocolOutboundLayer(layer) {
        __classPrivateFieldGet(this, _Configuration_protocolConfigBuilder, "f").withOutboundLayer(layer);
    }
    /*
    PUBLISHER
     */
    setPublisherAcknowledgeTimeout(acknowledge) {
        __classPrivateFieldGet(this, _Configuration_publisherConfigBuilder, "f").withAcknowledgeTimeout(acknowledge);
    }
    setPublisherTimeout(timeout) {
        __classPrivateFieldGet(this, _Configuration_publisherConfigBuilder, "f").withTimeout(timeout);
    }
    /*
    SECURITY
     */
    setSecurityActivateSessionManagement(activate) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withActivateSessionManagement(activate);
    }
    setSecurityAccountLockoutEnabled(enabled) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAccountLockoutEnabled(enabled);
    }
    setSecurityAccountLockoutAttempts(attempts) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAccountLockoutAttempts(attempts);
    }
    setSecurityAccountLockoutRetryInterval(retryInterval) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAccountLockoutRetryInterval(retryInterval);
    }
    setSecurityAdminUsername(username) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAdminUsername(username);
    }
    setSecurityAdminPassword(password) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAdminPassword(password);
    }
    setSecurityAdminPublicKey(publicKey) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAdminPublicKey(publicKey);
    }
    setSecurityAdminGroupName(groupName) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAdminGroupName(groupName);
    }
    // repeatable using same key and different path
    setSecurityAdminGroupPermission(permissionKey, actionPath) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAdminGroupPermission(permissionKey, actionPath);
    }
    setSecurityAllowAnonymousAccess(allowAnonymous) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAllowAnonymousAccess(allowAnonymous);
    }
    setSecurityAuditPath(path) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAuditPath(path);
    }
    setSecurityAuthProvider(name, instance) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withAuthProvider(name, instance);
    }
    setSecurityCookie(name, domain, cookie) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withHttpsCookie(name, domain, cookie);
    }
    setSecurityLogSessionActivity(shouldLog) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withLogSessionActivity(shouldLog);
    }
    setSecurityLockTokenToLoginType(shouldLock) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withLockTokenToLoginType(shouldLock);
    }
    setSecurityLockTokenToUserId(shouldLock) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withLockTokenToUserId(shouldLock);
    }
    //TODO: lookups
    setSecurityPbkdf2Iterations(iterations) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withPbkdf2Iterations(iterations);
    }
    setSecurityProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold);
    }
    setSecurityIsSecure(isSecure) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withSecure(isSecure);
    }
    setSessionActivityTTL(ttl) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withSessionActivityTTL(ttl);
    }
    setSessionTokenSecret(secret) {
        __classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f").withSessionTokenSecret(secret);
    }
    /*
    SUBSCRIPTION
     */
    setSubscriptionAllowNestedPermissions(shouldAllow) {
        __classPrivateFieldGet(this, _Configuration_subscriptionConfigBuilder, "f").withAllowNestedPermissions(shouldAllow);
    }
    setSubscriptionTreeSearchCacheSize(size) {
        __classPrivateFieldGet(this, _Configuration_subscriptionConfigBuilder, "f").withSubscriptionTreeSearchCacheSize(size);
    }
    setSubscriptionTreePermutationCacheSize(size) {
        __classPrivateFieldGet(this, _Configuration_subscriptionConfigBuilder, "f").withSubscriptionTreePermutationCacheSize(size);
    }
    setSubscriptionTreeTimeout(timeout) {
        __classPrivateFieldGet(this, _Configuration_subscriptionConfigBuilder, "f").withSubscriptionTreeTimeout(timeout);
    }
    setSubscriptionTreeFilterFunction(func) {
        __classPrivateFieldGet(this, _Configuration_subscriptionConfigBuilder, "f").withSubscriptionTreeFilterFunc(func);
    }
    /*
    SYSTEM
     */
    setSystemName(name) {
        __classPrivateFieldGet(this, _Configuration_systemConfigBuilder, "f").withName(name);
    }
    /*
    TRANSPORT
     */
    setTransportCert(cert) {
        __classPrivateFieldGet(this, _Configuration_transportConfigBuilder, "f").withCert(cert);
    }
    setTransportCertPath(certPath) {
        __classPrivateFieldGet(this, _Configuration_transportConfigBuilder, "f").withCertPath(certPath);
    }
    setTransportKeepAliveTimout(timeout) {
        __classPrivateFieldGet(this, _Configuration_transportConfigBuilder, "f").withKeepAliveTimeout(timeout);
    }
    setTransportKey(key) {
        __classPrivateFieldGet(this, _Configuration_transportConfigBuilder, "f").withKey(key);
    }
    setTransportKeyPath(keyPath) {
        __classPrivateFieldGet(this, _Configuration_transportConfigBuilder, "f").withKeyPath(keyPath);
    }
    setTransportMode(mode) {
        __classPrivateFieldGet(this, _Configuration_transportConfigBuilder, "f").withKeyPath(mode);
    }
    /*
    HAPPN
     */
    buildHappnConfig() {
        return __classPrivateFieldGet(this, _Configuration_happnConfigBuilder, "f")
            .withCacheConfigBuilder(__classPrivateFieldGet(this, _Configuration_cacheConfigBuilder, "f"))
            .withConnectConfigBuilder(__classPrivateFieldGet(this, _Configuration_connectConfigBuilder, "f"))
            .withDataConfigBuilder(__classPrivateFieldGet(this, _Configuration_dataConfigBuilder, "f"))
            .withProtocolConfigBuilder(__classPrivateFieldGet(this, _Configuration_protocolConfigBuilder, "f"))
            .withPublisherConfigBuilder(__classPrivateFieldGet(this, _Configuration_publisherConfigBuilder, "f"))
            .withSecurityConfigBuilder(__classPrivateFieldGet(this, _Configuration_securityConfigBuilder, "f"))
            .withSubscriptionConfigBuilder(__classPrivateFieldGet(this, _Configuration_subscriptionConfigBuilder, "f"))
            .withSystemConfigBuilder(__classPrivateFieldGet(this, _Configuration_systemConfigBuilder, "f"))
            .withTransportConfigBuilder(__classPrivateFieldGet(this, _Configuration_transportConfigBuilder, "f"))
            .build();
    }
}
exports.Configuration = Configuration;
_Configuration_happnConfigBuilder = new WeakMap(), _Configuration_cacheConfigBuilder = new WeakMap(), _Configuration_connectConfigBuilder = new WeakMap(), _Configuration_dataConfigBuilder = new WeakMap(), _Configuration_protocolConfigBuilder = new WeakMap(), _Configuration_publisherConfigBuilder = new WeakMap(), _Configuration_securityConfigBuilder = new WeakMap(), _Configuration_subscriptionConfigBuilder = new WeakMap(), _Configuration_systemConfigBuilder = new WeakMap(), _Configuration_transportConfigBuilder = new WeakMap();
//# sourceMappingURL=configuration.js.map