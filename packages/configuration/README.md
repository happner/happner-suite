# Configuration

The `Configuration` package is concerned with providing a more structured and intuitive approach to building `happn`, `happner`, `happn-cluster` and `happner-cluster` configuration files. 

## The Configuration class

A single Typescript class, `Configuration` (found in `configuration.ts`), is the entry point and is used to create a well-formed configuration file.

Internally, a set of 'builders' are used to construct each section of the full configuration file, and instances of each builder are injected into the Configuration
class via constructor injection, eg:

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

Function names are prefixed with `set`, followed by the service that they are associated with (eg: `cache`, `connect`, etc.), followed by the specific config field name (eg: `statisticsInterval`):

### Configuration instance functions

|function|related service|description
|--------|-----------|-----------|
|setCacheStatisticsCheckPointAuthOverride| cache |
|setCacheStatisticsCheckPointAuthTokenOverride| cache |
|setCacheStatisticsInterval| cache |
|setCacheStatisticsSecurityGroupPermissionsOverride| cache |
|setCacheStatisticsSecurityGroupsOverride| cache |
|setCacheStatisticsSecurityPasswordsOverride| cache |
|setCacheStatisticsSecurityUserPermissionsOverride| cache |
|setCacheStatisticsSecurityUsersOverride| cache |
|setConnectSecurityCookie| connect |
|setConnectSecurityExclusion| connect |
|setConnectSecurityForbiddenResponsePath| connect |
|setConnectSecurityUnauthorizedResponsePath| connect |
|setDataStore| data |
|setDataIsSecure| data |
|setProtocolAllowNestedPermissions| protocol |
|setProtocolInboundLayer| protocol |
|setProtocolIsSecure| protocol |
|setProtocolOutboundLayer| protocol |
|setPublisherAcknowledgeTimeout| publisher |
|setPublisherTimeout| publisher |
|setSecurityActivateSessionManagement| security |
|setSecurityAccountLockoutEnabled| security |
|setSecurityAccountLockoutAttempts| security |
|setSecurityAccountLockoutRetryInterval| security |
|setSecurityAdminUsername| security |
|setSecurityAdminPassword| security |
|setSecurityAdminPublicKey| security |
|setSecurityAdminGroupName| security |
|setSecurityAdminGroupPermission| security |
|setSecurityAllowAnonymousAccess| security |
|setSecurityAuditPath| security |
|setSecurityAuthProvider| security |
|setSecurityCookie| security |
|setSecurityLogSessionActivity| security |
|setSecurityLockTokenToLoginType| security |
|setSecurityLockTokenToUserId| security |
|setSecurityPbkdf2Iterations| security |
|setSecurityProfile| security |
|setSecurityIsSecure| security |
|setSessionActivityTTL| session |
|setSessionTokenSecret| session |
|setSubscriptionAllowNestedPermissions| subscription |
|setSubscriptionTreeSearchCacheSize| subscription |
|setSubscriptionTreePermutationCacheSize| subscription |
|setSubscriptionTreeTimeout| subscription |
|setSubscriptionTreeFilterFunction| subscription |
|setSystemName| system |
|setTransportCert| transport |
|setTransportCertPath| transport |
|setTransportKeepAliveTimout| transport |
|setTransportKey| transport |
|setTransportKeyPath| transport |
|setTransportMode| transport |
|buildHappnConfig| - | builds the Happn config file using values provided in above functions

## Links
- JSON schema conditional validation:
  - https://jsonforms.discourse.group/t/how-to-implement-conditional-required-field-validation/265/2
