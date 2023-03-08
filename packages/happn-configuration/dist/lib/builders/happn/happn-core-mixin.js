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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnCoreBuilder = void 0;
/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const BaseBuilder = require('happn-commons/lib/base-builder');
const config_constants_1 = __importDefault(require("../../constants/config-constants"));
const SERVICES_ROOT = config_constants_1.default.HAPPN_SERVICES_ROOT;
function HappnCoreBuilder(Base) {
    var _HappnBuilder_cacheConfigBuilder, _HappnBuilder_connectConfigBuilder, _HappnBuilder_dataConfigBuilder, _HappnBuilder_protocolConfigBuilder, _HappnBuilder_publisherConfigBuilder, _HappnBuilder_securityConfigBuilder, _HappnBuilder_subscriptionConfigBuilder, _HappnBuilder_systemConfigBuilder, _HappnBuilder_transportConfigBuilder, _a;
    return _a = class HappnBuilder extends Base {
            constructor(...args) {
                super(...args);
                _HappnBuilder_cacheConfigBuilder.set(this, void 0);
                _HappnBuilder_connectConfigBuilder.set(this, void 0);
                _HappnBuilder_dataConfigBuilder.set(this, void 0);
                _HappnBuilder_protocolConfigBuilder.set(this, void 0);
                _HappnBuilder_publisherConfigBuilder.set(this, void 0);
                _HappnBuilder_securityConfigBuilder.set(this, void 0);
                _HappnBuilder_subscriptionConfigBuilder.set(this, void 0);
                _HappnBuilder_systemConfigBuilder.set(this, void 0);
                _HappnBuilder_transportConfigBuilder.set(this, void 0);
                const container = args[0];
                __classPrivateFieldSet(this, _HappnBuilder_cacheConfigBuilder, container.cacheConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_connectConfigBuilder, container.connectConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_dataConfigBuilder, container.dataConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_protocolConfigBuilder, container.protocolConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_publisherConfigBuilder, container.publisherConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_securityConfigBuilder, container.securityConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_subscriptionConfigBuilder, container.subscriptionConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_systemConfigBuilder, container.systemConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnBuilder_transportConfigBuilder, container.transportConfigBuilder, "f");
                this.set(`${SERVICES_ROOT}.cache`, __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.connect`, __classPrivateFieldGet(this, _HappnBuilder_connectConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.data`, __classPrivateFieldGet(this, _HappnBuilder_dataConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.protocol`, __classPrivateFieldGet(this, _HappnBuilder_protocolConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.publisher`, __classPrivateFieldGet(this, _HappnBuilder_publisherConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.security`, __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.subscription`, __classPrivateFieldGet(this, _HappnBuilder_subscriptionConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.system`, __classPrivateFieldGet(this, _HappnBuilder_systemConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.transport`, __classPrivateFieldGet(this, _HappnBuilder_transportConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
            }
            build() {
                return super.build();
            }
            withName(name) {
                this.set(`happn.name`, name, BaseBuilder.Types.STRING);
                return this;
            }
            withHost(host) {
                this.set(`happn.host`, host, BaseBuilder.Types.STRING);
                return this;
            }
            withPort(port) {
                this.set(`happn.port`, port, BaseBuilder.Types.NUMERIC);
                return this;
            }
            withSecure(isSecure) {
                this.set(`happn.secure`, isSecure, BaseBuilder.Types.BOOLEAN);
                return this;
            }
            withAllowNestedPermissions(allow) {
                this.set(`happn.allowNestedPermissions`, allow, BaseBuilder.Types.BOOLEAN);
                return this;
            }
            /*
            CACHE
             */
            withCacheCheckPointAuthOverride(max, maxAge) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withCheckoutPointCacheAuthOverride(max, maxAge);
                return this;
            }
            withCacheCheckPointAuthTokenOverride(max, maxAge) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withCheckoutPointCacheAuthTokenOverride(max, maxAge);
                return this;
            }
            withCacheStatisticsInterval(interval) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withStatisticsInterval(interval);
                return this;
            }
            withCacheSecurityGroupPermissionsOverride(max, maxAge) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withCacheSecurityGroupPermissionsOverride(max, maxAge);
                return this;
            }
            withCacheSecurityGroupsOverride(max, maxAge) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withCacheSecurityGroupsOverride(max, maxAge);
                return this;
            }
            withCacheSecurityPasswordsOverride(max, maxAge) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withCacheSecurityPasswordsOverride(max, maxAge);
                return this;
            }
            withCacheSecurityUserPermissionsOverride(max, maxAge) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withCacheSecurityUserPermissionsOverride(max, maxAge);
                return this;
            }
            withCacheSecurityUsersOverride(max, maxAge) {
                __classPrivateFieldGet(this, _HappnBuilder_cacheConfigBuilder, "f").withCacheSecurityUsersOverride(max, maxAge);
                return this;
            }
            /*
            CONNECT
             */
            /***
             * Can be invoked multiple times to add more than 1 exclusion
             * @param exclusion
             */
            withConnectSecurityExclusion(exclusion) {
                __classPrivateFieldGet(this, _HappnBuilder_connectConfigBuilder, "f").withSecurityExclusion(exclusion);
                return this;
            }
            withConnectSecurityForbiddenResponsePath(path) {
                __classPrivateFieldGet(this, _HappnBuilder_connectConfigBuilder, "f").withSecurityForbiddenResponsePath(path);
                return this;
            }
            withConnectSecurityUnauthorizedResponsePath(path) {
                __classPrivateFieldGet(this, _HappnBuilder_connectConfigBuilder, "f").withSecurityUnauthorizedResponsePath(path);
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
                __classPrivateFieldGet(this, _HappnBuilder_dataConfigBuilder, "f").withDataStore(name, provider, isDefault, isFsync, dbFile, fileName);
                return this;
            }
            withDataIsSecure(isSecure) {
                __classPrivateFieldGet(this, _HappnBuilder_dataConfigBuilder, "f").withSecure(isSecure);
                return this;
            }
            /*
            PROTOCOLS
             */
            withProtocolAllowNestedPermissions(isAllowed) {
                __classPrivateFieldGet(this, _HappnBuilder_protocolConfigBuilder, "f").withAllowNestedPermissions(isAllowed);
                return this;
            }
            withProtocolInboundLayer(layer) {
                __classPrivateFieldGet(this, _HappnBuilder_protocolConfigBuilder, "f").withInboundLayer(layer);
                return this;
            }
            withProtocolIsSecure(isSecure) {
                __classPrivateFieldGet(this, _HappnBuilder_protocolConfigBuilder, "f").withSecure(isSecure);
                return this;
            }
            withProtocolOutboundLayer(layer) {
                __classPrivateFieldGet(this, _HappnBuilder_protocolConfigBuilder, "f").withOutboundLayer(layer);
                return this;
            }
            /*
            PUBLISHER
             */
            withPublisherAcknowledgeTimeout(acknowledge) {
                __classPrivateFieldGet(this, _HappnBuilder_publisherConfigBuilder, "f").withAcknowledgeTimeout(acknowledge);
                return this;
            }
            withPublisherTimeout(timeout) {
                __classPrivateFieldGet(this, _HappnBuilder_publisherConfigBuilder, "f").withTimeout(timeout);
                return this;
            }
            /*
            SECURITY
             */
            withSecurityActivateSessionManagement(activate) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withActivateSessionManagement(activate);
                return this;
            }
            withSecurityAccountLockoutEnabled(enabled) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAccountLockoutEnabled(enabled);
                return this;
            }
            withSecurityAccountLockoutAttempts(attempts) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAccountLockoutAttempts(attempts);
                return this;
            }
            withSecurityAccountLockoutRetryInterval(retryInterval) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAccountLockoutRetryInterval(retryInterval);
                return this;
            }
            withSecurityAdminPassword(password) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAdminPassword(password);
                return this;
            }
            withSecurityAdminPublicKey(publicKey) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAdminPublicKey(publicKey);
                return this;
            }
            // repeatable using same key and different path
            withSecurityAdminGroupPermission(permissionKey, actionPath) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAdminGroupPermission(permissionKey, actionPath);
                return this;
            }
            withSecurityAdminGroupCustomData(fieldName, fieldValue) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAdminGroupCustomData(fieldName, fieldValue);
                return this;
            }
            withSecurityAllowAnonymousAccess(allowAnonymous) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAllowAnonymousAccess(allowAnonymous);
                return this;
            }
            withSecurityAuthProvider(name, instance) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withAuthProvider(name, instance);
                return this;
            }
            withSecurityCookie(name, domain) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withHttpsCookie(name, domain, true);
                return this;
            }
            withSecurityLogSessionActivity(shouldLog) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withLogSessionActivity(shouldLog);
                return this;
            }
            withSecurityLockTokenToLoginType(shouldLock) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withLockTokenToLoginType(shouldLock);
                return this;
            }
            withSecurityLockTokenToUserId(shouldLock) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withLockTokenToUserId(shouldLock);
                return this;
            }
            //TODO: lookups
            withSecurityPbkdf2Iterations(iterations) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withPbkdf2Iterations(iterations);
                return this;
            }
            withSecurityProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold);
                return this;
            }
            withSessionActivityTTL(ttl) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withSessionActivityTTL(ttl);
                return this;
            }
            withSessionTokenSecret(secret) {
                __classPrivateFieldGet(this, _HappnBuilder_securityConfigBuilder, "f").withSessionTokenSecret(secret);
                return this;
            }
            /*
            SUBSCRIPTION
             */
            withSubscriptionAllowNestedPermissions(shouldAllow) {
                __classPrivateFieldGet(this, _HappnBuilder_subscriptionConfigBuilder, "f").withAllowNestedPermissions(shouldAllow);
                return this;
            }
            withSubscriptionTreeSearchCacheSize(size) {
                __classPrivateFieldGet(this, _HappnBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreeSearchCacheSize(size);
                return this;
            }
            withSubscriptionTreePermutationCacheSize(size) {
                __classPrivateFieldGet(this, _HappnBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreePermutationCacheSize(size);
                return this;
            }
            withSubscriptionTreeTimeout(timeout) {
                __classPrivateFieldGet(this, _HappnBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreeTimeout(timeout);
                return this;
            }
            withSubscriptionTreeFilterFunction(func) {
                __classPrivateFieldGet(this, _HappnBuilder_subscriptionConfigBuilder, "f").withSubscriptionTreeFilterFunc(func);
                return this;
            }
            /*
            SYSTEM
             */
            withSystemName(name) {
                __classPrivateFieldGet(this, _HappnBuilder_systemConfigBuilder, "f").withName(name);
                return this;
            }
            /*
            TRANSPORT
             */
            withTransportCert(cert) {
                __classPrivateFieldGet(this, _HappnBuilder_transportConfigBuilder, "f").withCert(cert);
                return this;
            }
            withTransportCertPath(certPath) {
                __classPrivateFieldGet(this, _HappnBuilder_transportConfigBuilder, "f").withCertPath(certPath);
                return this;
            }
            withTransportKeepAliveTimout(timeout) {
                __classPrivateFieldGet(this, _HappnBuilder_transportConfigBuilder, "f").withKeepAliveTimeout(timeout);
                return this;
            }
            withTransportKey(key) {
                __classPrivateFieldGet(this, _HappnBuilder_transportConfigBuilder, "f").withKey(key);
                return this;
            }
            withTransportKeyPath(keyPath) {
                __classPrivateFieldGet(this, _HappnBuilder_transportConfigBuilder, "f").withKeyPath(keyPath);
                return this;
            }
            withTransportMode(mode) {
                __classPrivateFieldGet(this, _HappnBuilder_transportConfigBuilder, "f").withMode(mode);
                return this;
            }
        },
        _HappnBuilder_cacheConfigBuilder = new WeakMap(),
        _HappnBuilder_connectConfigBuilder = new WeakMap(),
        _HappnBuilder_dataConfigBuilder = new WeakMap(),
        _HappnBuilder_protocolConfigBuilder = new WeakMap(),
        _HappnBuilder_publisherConfigBuilder = new WeakMap(),
        _HappnBuilder_securityConfigBuilder = new WeakMap(),
        _HappnBuilder_subscriptionConfigBuilder = new WeakMap(),
        _HappnBuilder_systemConfigBuilder = new WeakMap(),
        _HappnBuilder_transportConfigBuilder = new WeakMap(),
        _a;
}
exports.HappnCoreBuilder = HappnCoreBuilder;
