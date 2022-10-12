/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const { Configuration } = require('../../lib/configuration');
const CacheConfigBuilder = require('../../lib/builders/cache-config-builder');
const ConnectConfigBuilder = require('../../lib/builders/connect-config-builder');
const DataConfigBuilder = require('../../lib/builders/data-config-builder');
const ProtocolConfigBuilder = require('../../lib/builders/protocol-config-builder');
const PublisherConfigBuilder = require('../../lib/builders/publisher-config-builder');
const SecurityConfigBuilder = require('../../lib/builders/security-config-builder');
const SubscriptionConfigBuilder = require('../../lib/builders/subscription-config-builder');
const SystemConfigBuilder = require('../../lib/builders/system-config-builder');
const TransportConfigBuilder = require('../../lib/builders/transport-config-builder');
const HappnConfigBuilder = require('../../lib/builders/happn-config-builder');
const ConfigValidator = require('../../lib/validators/config-validator');
const FieldTypeValidator = require('../../lib/validators/field-type-validator');

describe(helper.testName(), function () {
  it('builds a happn configuration object', () => {
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

    // cache
    configuration.setCacheStatisticsCheckPointAuthOverride(5, 1000);
    configuration.setCacheStatisticsCheckPointAuthTokenOverride(5, 1000);
    configuration.setCacheStatisticsInterval(1);
    configuration.setCacheStatisticsSecurityGroupPermissionsOverride(10, 2000);
    configuration.setCacheStatisticsSecurityGroupsOverride(10, 2000);
    configuration.setCacheStatisticsSecurityPasswordsOverride(15, 20000);
    configuration.setCacheStatisticsSecurityUserPermissionsOverride(15, 20000);
    configuration.setCacheStatisticsSecurityUsersOverride(15, 20000);

    // connect
    configuration.setConnectSecurityCookie('testCookie', 'test.domain');
    configuration.setConnectSecurityExclusion('/test/exclusion');
    configuration.setConnectSecurityForbiddenResponsePath('forbidden/response/path');
    configuration.setConnectSecurityUnauthorizedResponsePath('unauthorized/response/path');

    // data
    configuration.setDataIsSecure(true);
    configuration.setDataStore(
      'testDataStore',
      'testProvider',
      true,
      true,
      'dfile.db',
      'myDataFile'
    );

    // protocol
    configuration.setProtocolAllowNestedPermissions(true);
    configuration.setProtocolInboundLayer((msg, cb) => {
      cb(null, 'inbound-result');
    });
    configuration.setProtocolIsSecure(true);
    configuration.setProtocolOutboundLayer((msg, cb) => {
      cb(null, 'outbound-result');
    });
    configuration.setPublisherAcknowledgeTimeout(true);
    configuration.setPublisherTimeout(5000);

    // publisher
    configuration.setPublisherAcknowledgeTimeout(true);
    configuration.setPublisherTimeout(5000);

    // security
    configuration.setSecurityAccountLockoutAttempts(5);
    configuration.setSecurityAccountLockoutEnabled(true);
    configuration.setSecurityAccountLockoutRetryInterval(1000);
    configuration.setSecurityActivateSessionManagement(true);
    configuration.setSecurityAdminGroupName('testGroup');
    configuration.setSecurityAdminGroupPermission('testKey', 'test/path');
    configuration.setSecurityAdminPassword('adminPassword');
    configuration.setSecurityAdminPublicKey('401be6df11a34');
    configuration.setSecurityAdminUsername('adminUserName');
    configuration.setSecurityAllowAnonymousAccess(false);
    configuration.setSecurityAuditPath('test/audit/path');
    configuration.setSecurityAuthProvider('testProvider', new (class TestClass {})());
    configuration.setSecurityCookie('testCookie123', 'test.domain', 'asdhgvausdgasuygdfash');
    configuration.setSecurityIsSecure(true);
    configuration.setSecurityLockTokenToLoginType(true);
    configuration.setSecurityLockTokenToUserId(true);
    configuration.setSecurityLogSessionActivity(true);
    configuration.setSecurityPbkdf2Iterations(5);
    configuration.setSecurityProfile('testProfile', 'testKey', 1, 50000, 10000);

    // subscription
    configuration.setSubscriptionAllowNestedPermissions(true);
    configuration.setSubscriptionTreeFilterFunction(() => {
      return 'subscription filter function';
    });
    configuration.setSubscriptionTreePermutationCacheSize(5);
    configuration.setSubscriptionTreeSearchCacheSize(200);
    configuration.setSubscriptionTreeTimeout(2500);

    // system
    configuration.setSystemName('testName');

    // transport
    configuration.setTransportCert('testCertificate-2139812931239');
    configuration.setTransportCertPath('test/cert/path');
    configuration.setTransportKeepAliveTimout(25000);
    configuration.setTransportKey('testKey-12313');
    configuration.setTransportKeyPath('test/key/path');
    configuration.setTransportMode('testMode');

    const result = configuration.buildHappnConfig();
    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const isValid = configValidator.validateHappnConfig(result);
    helper.expect(isValid).to.equal(true);

    // TODO - complete assertions
    let testCb1 = (err, result) => {
      helper.expect(result).to.equal('inbound-result');
    };
    result.happn.services.protocol.config.inboundLayers[0]('test', testCb1);
  });
});
