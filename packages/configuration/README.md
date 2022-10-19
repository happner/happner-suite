# Configuration

The `Configuration` package is concerned with providing a more structured and intuitive approach to building `happn`
, `happner`, `happn-cluster` and `happner-cluster` configuration files.

## happn services


## happn-cluster services

- data
- membership
- orchestrator
- replicator
- proxy
- health

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

|function|args|related service|description
|--------|-----|------|-----------|
|setCacheStatisticsCheckPointAuthOverride<br/>(max: number, maxAge: number)| cache |
|setCacheStatisticsCheckPointAuthTokenOverride<br/>(max: number, maxAge: number)| cache |
|setCacheStatisticsInterval<br/>(interval: number)| cache |
|setCacheStatisticsSecurityGroupPermissionsOverride<br/>(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityGroupsOverride<br/>(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityPasswordsOverride<br/>(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityUserPermissionsOverride<br/>(max: number, maxAge: number)| cache |
|setCacheStatisticsSecurityUsersOverride<br/>(max: number, maxAge: number)| cache |
|setConnectSecurityCookie<br/>(name: string, domain: string)| connect |
|setConnectSecurityExclusion<br/>(exclusion: string)| connect |
|setConnectSecurityForbiddenResponsePath<br/>(path: string)| connect |
|setConnectSecurityUnauthorizedResponsePath<br/>(path: string)| connect |
|setDataStore<br/>(name: string, provider: string, isDefault: boolean, isFsync: boolean, dbFile: string, fileName: string)| data |
|setDataIsSecure<br/>(isSecure: boolean)| data |
|setProtocolAllowNestedPermissions<br/>(isAllowed: boolean)| protocol |
|setProtocolInboundLayer<br/>(layer: Function)| protocol |
|setProtocolIsSecure<br/>(isSecure: boolean)| protocol |
|setProtocolOutboundLayer<br/>(layer: Function)| protocol |
|setPublisherAcknowledgeTimeout<br/>(acknowledge: boolean)| publisher |
|setPublisherTimeout<br/>(timeout: number)| publisher |
|setSecurityActivateSessionManagement<br/>(activate: boolean)| security |
|setSecurityAccountLockoutEnabled<br/>(enabled: boolean)| security |
|setSecurityAccountLockoutAttempts<br/>(attempts: number)| security |
|setSecurityAccountLockoutRetryInterval<br/>(retryInterval: number)| security |
|setSecurityAdminUsername<br/>(username: string)| security |
|setSecurityAdminPassword<br/>(password: string)| security |
|setSecurityAdminPublicKey<br/>(publicKey: string)| security |
|setSecurityAdminGroupName<br/>(groupName: string)| security |
|setSecurityAdminGroupPermission<br/>(permissionKey: string, actionPath: string)| security |
|setSecurityAllowAnonymousAccess<br/>(allowAnonymous: boolean)| security |
|setSecurityAuditPath<br/>(path: string)| security |
|setSecurityAuthProvider<br/>(name: string, instance: any)| security |
|setSecurityCookie<br/>(name: string, domain: string, cookie: string)| security |
|setSecurityLogSessionActivity<br/>(shouldLog: boolean)| security |
|setSecurityLockTokenToLoginType<br/>(shouldLock: boolean)| security |
|setSecurityLockTokenToUserId<br/>(shouldLock: boolean)| security |
|setSecurityPbkdf2Iterations<br/>(iterations: number)| security |
|setSecurityProfile<br/>(name: string, sessionKey: string, sessionMatchOn: any, policyTTL: number, policyInactiveThreshold: number)| security |
|setSecurityIsSecure<br/>(isSecure: boolean)| security |
|setSessionActivityTTL<br/>(ttl: number)| session |
|setSessionTokenSecret<br/>(secret: string)| session |
|setSubscriptionAllowNestedPermissions<br/>(shouldAllow: boolean)| subscription |
|setSubscriptionTreeSearchCacheSize<br/>(size: number)| subscription |
|setSubscriptionTreePermutationCacheSize<br/>(size: number)| subscription |
|setSubscriptionTreeTimeout<br/>(timeout: number)| subscription |
|setSubscriptionTreeFilterFunction<br/>(func: Function)| subscription |
|setSystemName<br/>(name: string)| system |
|setTransportCert<br/>(cert: string)| transport |
|setTransportCertPath<br/>(certPath: string)| transport |
|setTransportKeepAliveTimout<br/>(timeout: number)| transport |
|setTransportKey<br/>(key: string)| transport |
|setTransportKeyPath<br/>(keyPath: string)| transport |
|setTransportMode<br/>(mode: string)| transport |
|buildHappnConfig| - | builds the Happn config file using values provided in above functions

## Links

- JSON schema conditional validation:
    - https://jsonforms.discourse.group/t/how-to-implement-conditional-required-field-validation/265/2
