import { Constructor } from '../../types/mixin-types';
import { CacheConfigBuilder } from './services/cache-config-builder';
import { ConnectConfigBuilder } from './services/connect-config-builder';
import { DataConfigBuilder } from './services/data-config-builder';
import { ProtocolConfigBuilder } from './services/protocol-config-builder';
import { PublisherConfigBuilder } from './services/publisher-config-builder';
import { SecurityConfigBuilder } from './services/security-config-builder';
import { SubscriptionConfigBuilder } from './services/subscription-config-builder';
import { SystemConfigBuilder } from './services/system-config-builder';
import { TransportConfigBuilder } from './services/transport-config-builder';
export declare function HappnCoreBuilder<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        "__#2@#cacheConfigBuilder": CacheConfigBuilder;
        "__#2@#connectConfigBuilder": ConnectConfigBuilder;
        "__#2@#dataConfigBuilder": DataConfigBuilder;
        "__#2@#protocolConfigBuilder": ProtocolConfigBuilder;
        "__#2@#publisherConfigBuilder": PublisherConfigBuilder;
        "__#2@#securityConfigBuilder": SecurityConfigBuilder;
        "__#2@#subscriptionConfigBuilder": SubscriptionConfigBuilder;
        "__#2@#systemConfigBuilder": SystemConfigBuilder;
        "__#2@#transportConfigBuilder": TransportConfigBuilder;
        build(): any;
        withName(name: string): any;
        withHost(host: string): any;
        withPort(port: number): any;
        withSecure(isSecure: boolean): any;
        withAllowNestedPermissions(allow: boolean): any;
        withCacheCheckPointAuthOverride(max: number, maxAge: number): any;
        withCacheCheckPointAuthTokenOverride(max: number, maxAge: number): any;
        withCacheStatisticsInterval(interval: number): any;
        withCacheSecurityGroupPermissionsOverride(max: number, maxAge: number): any;
        withCacheSecurityGroupsOverride(max: number, maxAge: number): any;
        withCacheSecurityPasswordsOverride(max: number, maxAge: number): any;
        withCacheSecurityUserPermissionsOverride(max: number, maxAge: number): any;
        withCacheSecurityUsersOverride(max: number, maxAge: number): any;
        /***
         * Can be invoked multiple times to add more than 1 exclusion
         * @param exclusion
         */
        withConnectSecurityExclusion(exclusion: string): any;
        withConnectSecurityForbiddenResponsePath(path: string): any;
        withConnectSecurityUnauthorizedResponsePath(path: string): any;
        /***
         * Adds a new datastore - can be invoked multiple times, if more than one datastore is to be configured.
         * @param name
         * @param provider
         * @param isDefault
         * @param isFsync
         * @param dbFile
         * @param fileName
         */
        withDataStore(name: string, provider: string, isDefault: boolean, isFsync: boolean, dbFile: string, fileName: string): any;
        withDataIsSecure(isSecure: boolean): any;
        withProtocolAllowNestedPermissions(isAllowed: boolean): any;
        withProtocolInboundLayer(layer: Function): any;
        withProtocolIsSecure(isSecure: boolean): any;
        withProtocolOutboundLayer(layer: Function): any;
        withPublisherAcknowledgeTimeout(acknowledge: number): any;
        withPublisherTimeout(timeout: number): any;
        withSecurityActivateSessionManagement(activate: boolean): any;
        withSecurityAccountLockoutEnabled(enabled: boolean): any;
        withSecurityAccountLockoutAttempts(attempts: number): any;
        withSecurityAccountLockoutRetryInterval(retryInterval: number): any;
        withSecurityAdminPassword(password: string): any;
        withSecurityAdminPublicKey(publicKey: string): any;
        withSecurityAdminGroupPermission(permissionKey: string, actionPath: string): any;
        withSecurityAdminGroupCustomData(fieldName: string, fieldValue: string): any;
        withSecurityAllowAnonymousAccess(allowAnonymous: boolean): any;
        withSecurityAuthProvider(name: string, instance: any): any;
        withSecurityCookie(name: string, domain: string): any;
        withSecurityLogSessionActivity(shouldLog: boolean): any;
        withSecurityLockTokenToLoginType(shouldLock: boolean): any;
        withSecurityLockTokenToUserId(shouldLock: boolean): any;
        withSecurityPbkdf2Iterations(iterations: number): any;
        withSecurityProfile(name: string, sessionKey: string, sessionMatchOn: any, policyTTL: number, policyInactiveThreshold: number): any;
        withSessionActivityTTL(ttl: number): any;
        withSessionTokenSecret(secret: string): any;
        withSubscriptionAllowNestedPermissions(shouldAllow: boolean): any;
        withSubscriptionTreeSearchCacheSize(size: number): any;
        withSubscriptionTreePermutationCacheSize(size: number): any;
        withSubscriptionTreeTimeout(timeout: number): any;
        withSubscriptionTreeFilterFunction(func: Function): any;
        withSystemName(name: string): any;
        withTransportCert(cert: string): any;
        withTransportCertPath(certPath: string): any;
        withTransportKeepAliveTimout(timeout: number): any;
        withTransportKey(key: string): any;
        withTransportKeyPath(keyPath: string): any;
        withTransportMode(mode: string): any;
    };
} & TBase;
