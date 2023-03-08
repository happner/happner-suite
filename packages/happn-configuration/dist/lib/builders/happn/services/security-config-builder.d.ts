declare const BaseBuilder: any;
export declare class SecurityConfigBuilder extends BaseBuilder {
    constructor();
    withUpdateSubscriptionsOnSecurityDirectoryChanged(shouldUpdate: boolean): SecurityConfigBuilder;
    withDisableDefaultAdminNetworkConnections(shouldDisable: boolean): SecurityConfigBuilder;
    withDefaultNonceTTL(ttl: number): SecurityConfigBuilder;
    withLogSessionActivity(shouldLog: boolean): SecurityConfigBuilder;
    withSessionActivityTTL(ttl: number): SecurityConfigBuilder;
    withPbkdf2Iterations(iterations: number): SecurityConfigBuilder;
    withLockTokenToLoginType(shouldLock: boolean): SecurityConfigBuilder;
    withLockTokenToUserId(shouldLock: boolean): SecurityConfigBuilder;
    withHttpsCookie(name: string, domain: string, cookie: boolean): SecurityConfigBuilder;
    withAllowAnonymousAccess(allow: boolean): SecurityConfigBuilder;
    withLookup(lookup: unknown): SecurityConfigBuilder;
    withSessionTokenSecret(secret: string): SecurityConfigBuilder;
    withActivateSessionManagement(activate: boolean): SecurityConfigBuilder;
    withAccountLockoutEnabled(enabled: boolean): SecurityConfigBuilder;
    withAccountLockoutAttempts(attempts: number): SecurityConfigBuilder;
    withAccountLockoutRetryInterval(interval: number): SecurityConfigBuilder;
    withAdminPassword(password: string): SecurityConfigBuilder;
    withAdminPublicKey(publicKey: string): SecurityConfigBuilder;
    withAdminGroupCustomData(fieldName: string, fieldValue: string): SecurityConfigBuilder;
    withAdminGroupPermission(permissionKey: string, actionPath: string): SecurityConfigBuilder;
    withAuthProvider(providerName: string, providerInstance: unknown): SecurityConfigBuilder;
    withDefaultAuthProvider(providerName: string): SecurityConfigBuilder;
    withProfile(name: string, sessionKey: string, sessionMatchOn: any, policyTTL: number, policyInactiveThreshold: number): SecurityConfigBuilder;
}
export {};
