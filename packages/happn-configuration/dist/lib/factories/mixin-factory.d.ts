import { CoreBuilder } from '../builders/core-builder';
export declare class MixinFactory {
    getMixin(type: string): {
        new (...args: any[]): {
            [x: string]: any;
            "__#2@#cacheConfigBuilder": import("../builders/builders").CacheConfigBuilder;
            "__#2@#connectConfigBuilder": import("../builders/builders").ConnectConfigBuilder;
            "__#2@#dataConfigBuilder": import("../builders/builders").DataConfigBuilder;
            "__#2@#protocolConfigBuilder": import("../builders/builders").ProtocolConfigBuilder;
            "__#2@#publisherConfigBuilder": import("../builders/builders").PublisherConfigBuilder;
            "__#2@#securityConfigBuilder": import("../builders/builders").SecurityConfigBuilder;
            "__#2@#subscriptionConfigBuilder": import("../builders/builders").SubscriptionConfigBuilder;
            "__#2@#systemConfigBuilder": import("../builders/builders").SystemConfigBuilder;
            "__#2@#transportConfigBuilder": import("../builders/builders").TransportConfigBuilder;
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
            withConnectSecurityExclusion(exclusion: string): any;
            withConnectSecurityForbiddenResponsePath(path: string): any;
            withConnectSecurityUnauthorizedResponsePath(path: string): any;
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
    } & typeof CoreBuilder;
}
