/* eslint-disable @typescript-eslint/ban-types */
export interface IHappnConfigurationBuilder {
  withCacheStatisticsCheckPointAuthOverride(max: number, maxAge: number);

  withCacheStatisticsCheckPointAuthTokenOverride(max: number, maxAge: number);

  withCacheStatisticsInterval(interval: number);

  withCacheStatisticsSecurityGroupPermissionsOverride(max: number, maxAge: number);

  withCacheStatisticsSecurityGroupsOverride(max: number, maxAge: number);

  withCacheStatisticsSecurityPasswordsOverride(max: number, maxAge: number);

  withCacheStatisticsSecurityUserPermissionsOverride(max: number, maxAge: number);

  withCacheStatisticsSecurityUsersOverride(max: number, maxAge: number);

  withConnectSecurityExclusion(exclusion: string);

  withConnectSecurityForbiddenResponsePath(path: string);

  withConnectSecurityUnauthorizedResponsePath(path: string);

  withDataStore(
    name: string,
    provider: string,
    isDefault: boolean,
    isFsync: boolean,
    dbFile: string,
    fileName: string
  );

  withDataIsSecure(isSecure: boolean);

  withProtocolAllowNestedPermissions(isAllowed: boolean);

  withProtocolInboundLayer(layer: Function);

  withProtocolIsSecure(isSecure: boolean);

  withProtocolOutboundLayer(layer: Function);

  withPublisherAcknowledgeTimeout(acknowledge: boolean);

  withPublisherTimeout(timeout: number);

  withSecurityActivateSessionManagement(activate: boolean);

  withSecurityAccountLockoutEnabled(enabled: boolean);

  withSecurityAccountLockoutAttempts(attempts: number);

  withSecurityAccountLockoutRetryInterval(retryInterval: number);

  withSecurityAdminPassword(password: string);

  withSecurityAdminPublicKey(publicKey: string);

  withSecurityAdminGroupCustomData(description: string);

  withSecurityAdminGroupPermission(permissionKey: string, actionPath: string);

  withSecurityAllowAnonymousAccess(allowAnonymous: boolean);

  withSecurityAuthProvider(name: string, instance: any);

  withSecurityCookie(name: string, domain: string, cookie: string);

  withSecurityLogSessionActivity(shouldLog: boolean);

  withSecurityLockTokenToLoginType(shouldLock: boolean);

  withSecurityLockTokenToUserId(shouldLock: boolean);

  withSecurityPbkdf2Iterations(iterations: number);

  withSecurityProfile(
    name: string,
    sessionKey: string,
    sessionMatchOn: any,
    policyTTL: number,
    policyInactiveThreshold: number
  );

  withSessionActivityTTL(ttl: number);

  withSessionTokenSecret(secret: string);

  withSubscriptionAllowNestedPermissions(shouldAllow: boolean);

  withSubscriptionTreeSearchCacheSize(size: number);

  withSubscriptionTreePermutationCacheSize(size: number);

  withSubscriptionTreeTimeout(timeout: number);

  withSubscriptionTreeFilterFunction(func: Function);

  withSystemName(name: string);

  withTransportCert(cert: string);

  withTransportCertPath(certPath: string);

  withTransportKeepAliveTimout(timeout: number);

  withTransportKey(key: string);

  withTransportKeyPath(keyPath: string);

  withTransportMode(mode: string);
}
