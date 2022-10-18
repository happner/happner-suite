# Configuration

The `Configuration` package is concerned with providing a more structured and intuitive approach to building `happn`
, `happner`, `happn-cluster` and `happner-cluster` configuration files.

## The Configuration class

A single Typescript class, `Configuration` (found in `configuration.ts`), is the entry point and is used to create a
well-formed configuration file.

Internally, a set of 'builders' are used to construct each section of the full configuration file, and instances of each
builder are injected into the Configuration class via constructor injection, eg:

```javascript
const fieldTypeValidator = new FieldTypeValidator();
const happnConfigBuilder = new HappnConfigBuilder();
const cacheConfigBuilder = new CacheConfigBuilder();
const connectConfigBuilder = new ConnectConfigBuilder();
const dataConfigBuilder = new DataConfigBuilder();
const protocolConfigBuilder = new ProtocolConfigBuilder(fieldTypeValidator);
const publisherConfigBuilder = new PublisherConfigBuilder();
const securityConfigBuilder = new SecurityConfigBuilder();
const subscriptionConfigBuilder = new SubscriptionConfigBuilder();
const systemConfigBuilder = new SystemConfigBuilder();
const transportConfigBuilder = new TransportConfigBuilder();
const configValidator = new ConfigValidator();

const configuration = new Configuration(
  happnConfigBuilder,
  cacheConfigBuilder,
  connectConfigBuilder,
  dataConfigBuilder,
  protocolConfigBuilder,
  publisherConfigBuilder,
  securityConfigBuilder,
  subscriptionConfigBuilder,
  systemConfigBuilder,
  transportConfigBuilder
);
```

NOTE: _Injection can be handled via whatever D.I. framework/approach you prefer._

Instance functions on the `Configuration` class can be found below.

Function names are prefixed with `set`, followed by the service that they are associated with (eg: `cache`, `connect`,
etc.), followed by the specific config field name (eg: `statisticsInterval`):

### Configuration instance functions

|function|related service|description
|--------|-----------|-----------|
|setCacheStatisticsCheckPointAuthOverride(max: number, maxAge: number)| cache |
|setCacheStatisticsCheckPointAuthTokenOverride(max: number, maxAge: number)| cache |
|setCacheStatisticsInterval(interval: number)| cache |
|setCacheStatisticsSecurityGroupPermissionsOverride(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityGroupsOverride(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityPasswordsOverride(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityUserPermissionsOverride(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityUsersOverride(max: number, maxAge: number)| cache |
|setConnectSecurityCookie(name: string, domain: string)| connect |
|setConnectSecurityExclusion(exclusion: string)| connect |
|setConnectSecurityForbiddenResponsePath(path: string)| connect |
|setConnectSecurityUnauthorizedResponsePath(path: string)| connect |
|setDataStore(name: string, provider: string, isDefault: boolean, isFsync: boolean, dbFile: string, fileName: string)| data |
|setDataIsSecure(isSecure: boolean)| data |
|setProtocolAllowNestedPermissions(isAllowed: boolean)| protocol |
|setProtocolInboundLayer(layer: Function)| protocol |
|setProtocolIsSecure(isSecure: boolean)| protocol |
|setProtocolOutboundLayer(layer: Function)| protocol |
|setPublisherAcknowledgeTimeout(acknowledge: boolean)| publisher |
|setPublisherTimeout(timeout: number)| publisher |
|setSecurityActivateSessionManagement(activate: boolean)| security |
|setSecurityAccountLockoutEnabled(enabled: boolean)| security |
|setSecurityAccountLockoutAttempts(attempts: number)| security |
|setSecurityAccountLockoutRetryInterval(retryInterval: number)| security |
|setSecurityAdminUsername(username: string)| security |
|setSecurityAdminPassword(password: string)| security |
|setSecurityAdminPublicKey(publicKey: string)| security |
|setSecurityAdminGroupName(groupName: string)| security |
|setSecurityAdminGroupPermission(permissionKey: string, actionPath: string)| security |
|setSecurityAllowAnonymousAccess(allowAnonymous: boolean)| security |
|setSecurityAuditPath(path: string)| security |
|setSecurityAuthProvider(name: string, instance: any)| security |
|setSecurityCookie(name: string, domain: string, cookie: string)| security |
|setSecurityLogSessionActivity(shouldLog: boolean)| security |
|setSecurityLockTokenToLoginType(shouldLock: boolean)| security |
|setSecurityLockTokenToUserId(shouldLock: boolean)| security |
|setSecurityPbkdf2Iterations(iterations: number)| security |
|setSecurityProfile(  name: string, sessionKey: string, sessionMatchOn: any, policyTTL: number, policyInactiveThreshold: number)| security |
|setSecurityIsSecure(isSecure: boolean)| security |
|setSessionActivityTTL(ttl: number)| session |
|setSessionTokenSecret(secret: string)| session |
|setSubscriptionAllowNestedPermissions(shouldAllow: boolean)| subscription |
|setSubscriptionTreeSearchCacheSize(size: number)| subscription |
|setSubscriptionTreePermutationCacheSize(size: number)| subscription |
|setSubscriptionTreeTimeout(timeout: number)| subscription |
|setSubscriptionTreeFilterFunction(func: Function)| subscription |
|setSystemName(name: string)| system |
|setTransportCert(cert: string)| transport |
|setTransportCertPath(certPath: string)| transport |
|setTransportKeepAliveTimout(timeout: number)| transport |
|setTransportKey(key: string)| transport |
|setTransportKeyPath(keyPath: string)| transport |
|setTransportMode(mode: string)| transport |
|buildHappnConfig| - | builds the Happn config file using values provided in above functions

## Links

- JSON schema conditional validation:
    - https://jsonforms.discourse.group/t/how-to-implement-conditional-required-field-validation/265/2
