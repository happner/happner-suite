/* eslint-disable no-console,@typescript-eslint/no-var-requires */
import { ConfigBuilderFactory } from '../../lib/factories/config-builder-factory';
import { ConfigValidator } from '../../lib/validators/config-validator';
import { expect } from 'chai';

import mockLogger from '../__fixtures/logger';

describe('full configuration tests', function () {
  it('builds a happn configuration object with no version ', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnBuilder();
    setHappnConfigValues(builder);
    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    // TODO - complete assertions
    const testCb1 = (err, result) => {
      expect(result).to.equal('inbound-result');
    };
    result.services.protocol.config.inboundLayers[0]('test', testCb1);
  });

  it('builds a happn-cluster configuration object', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnClusterBuilder();
    setHappnConfigValues(builder);
    setHappnClusterConfigValues(builder);
    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnClusterConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));
  });

  it('builds a happner configuration object', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnerBuilder();
    setHappnConfigValues(builder);

    setHappnerConfigValues(builder);
    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnerConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));
  });

  it('builds a happner-cluster configuration object', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnerClusterBuilder();

    setHappnConfigValues(builder);
    setHappnClusterConfigValues(builder);
    setHappnerConfigValues(builder);
    setHappnerClusterConfigValues(builder);

    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validator = new ConfigValidator(mockLogger);
    const validationResult = validator.validateHappnerClusterConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));
  });
});

function setHappnConfigValues(builder) {
  return (
    builder
      // general
      .withName('test happn')
      .withHost('192.168.1.10')
      .withPort(90)
      .withSecure(true)
      .withAllowNestedPermissions(true)

      // cache
      .withCacheCheckPointAuthOverride(5, 1000)
      .withCacheCheckPointAuthTokenOverride(5, 1000)
      .withCacheStatisticsInterval(1)
      .withCacheSecurityGroupPermissionsOverride(10, 2000)
      .withCacheSecurityGroupsOverride(10, 2000)
      .withCacheSecurityPasswordsOverride(15, 20000)
      .withCacheSecurityUserPermissionsOverride(15, 20000)
      .withCacheSecurityUsersOverride(15, 20000)

      // connect
      .withConnectSecurityExclusion('/test/exclusion')
      .withConnectSecurityForbiddenResponsePath('forbidden/response/path')
      .withConnectSecurityUnauthorizedResponsePath('unauthorized/response/path')

      // data
      .withDataIsSecure(true)
      .withDataStore('testDataStore', 'testProvider', true, true, 'dfile.db', 'myDataFile')

      // protocol
      .withProtocolAllowNestedPermissions(true)
      .withProtocolInboundLayer((msg, cb) => {
        cb(null, 'inbound-result');
      })
      .withProtocolIsSecure(true)
      .withProtocolOutboundLayer((msg, cb) => {
        cb(null, 'outbound-result');
      })
      .withPublisherAcknowledgeTimeout(true)
      .withPublisherTimeout(5000)

      // publisher
      .withPublisherAcknowledgeTimeout(2000)
      .withPublisherTimeout(5000)

      // security
      .withSecurityAccountLockoutAttempts(5)
      .withSecurityAccountLockoutEnabled(true)
      .withSecurityAccountLockoutRetryInterval(1000)
      .withSecurityActivateSessionManagement(true)
      .withSecurityAdminPassword('adminPassword')
      .withSecurityAdminPublicKey('401be6df11a34')
      .withSecurityAdminGroupPermission('permissionKey', 'permissionAction')
      .withSecurityAdminGroupCustomData('customField', 'customValue')
      .withSecurityAllowLogoutOverHttp(true)
      .withSecurityAllowTTL0Revocations(true)
      .withSecurityAllowAnonymousAccess(false)
      .withSecurityAuthProvider('testProvider', new (class TestClass {})())
      .withSecurityCookie('testCookie', 'test.com')
      .withSecurityLockTokenToLoginType(true)
      .withSecurityLockTokenToUserId(true)
      .withSecurityLogSessionActivity(true)
      .withSecurityPbkdf2Iterations(5)
      .withSecurityProfile('testProfile', 'testKey', 1, 50000, 10000)
      .withSessionActivityTTL(5000)
      .withSessionTokenSecret('superSecretPassword')

      // subscription
      .withSubscriptionAllowNestedPermissions(true)
      .withSubscriptionTreeFilterFunction(() => {
        return 'subscription filter function';
      })
      .withSubscriptionTreePermutationCacheSize(5)
      .withSubscriptionTreeSearchCacheSize(200)
      .withSubscriptionTreeTimeout(2500)

      // system
      .withSystemName('testName')

      // transport
      .withTransportCert('testCertificate-2139812931239')
      .withTransportCertPath('test/cert/path')
      .withTransportKeepAliveTimout(25000)
      .withTransportKey('testKey-12313')
      .withTransportKeyPath('test/key/path')
      .withTransportMode('testMode')
  );
}

function setHappnClusterConfigValues(builder) {
  return builder
    .withHealthInterval(1000)
    .withHealthWarmupLimit(50000)
    .withOrchestratorMinimumPeers(3)
    .withOrchestratorReplicatePath('/replicate/path')
    .withOrchestratorStableReportInterval(10000)
    .withOrchestratorStabiliseTimeout(60000)
    .withProxyAllowSelfSignedCerts(true)
    .withProxyCertPath('/cert/path')
    .withProxyHost('192.168.1.50', 2500)
    .withProxyKeyPath('/key/path')
    .withProxyTimeout(25000)
    .withReplicatorSecurityChangeSetReplicateInterval(1000);
}

function setHappnerConfigValues(builder) {
  return builder
    .withName('happner test name')
    .withDeferListen(true)
    .withListenFirst(true)
    .beginComponent()
    .withDataRoute('testRoute', '/data/route')
    .withEvent('testEvent', {})
    .withModuleName('testModuleName')
    .withName('testComponent')
    .withSchemaExclusive(true)
    .withWebRoute('webRoute', 'test')
    .beginFunction()
    .withAlias('function alias')
    .withModelType('async')
    .withName('initFunc', 'init')
    .withParameter('paramName', 123123)
    .endFunction()
    .endComponent();
}

function setHappnerClusterConfigValues(builder) {
  return builder
    .withClusterRequestTimeout(10000)
    .withClusterResponseTimeout(10000)
    .withDomain('test.domain');
}
