/* eslint-disable no-console,@typescript-eslint/no-var-requires */
import { ConfigBuilderFactory } from '../../lib/factories/config-builder-factory';
import { ConfigValidator } from '../../lib/validators/config-validator';
import { expect } from 'chai';

import mockLogger from '../__fixtures/logger';

describe('full configuration tests', function () {
  afterEach('cleanup', () => {
    process.env.CURRENT_CONFIG_TYPE = undefined;
  });

  it('builds a happn configuration object', () => {
    const validator = new ConfigValidator('1.0.0', mockLogger);
    const builder = ConfigBuilderFactory.getBuilder('happn');
    setHappnConfigValues(builder);

    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validationResult = validator.validateHappnConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));

    // TODO - complete assertions
    let testCb1 = (err, result) => {
      expect(result).to.equal('inbound-result');
    };
    result.services.protocol.config.inboundLayers[0]('test', testCb1);
  });

  it('builds a happn-cluster configuration object', () => {
    const validator = new ConfigValidator('2.0.0', mockLogger);
    const builder = ConfigBuilderFactory.getBuilder('happn-cluster');

    setHappnConfigValues(builder);
    setHappnClusterConfigValues(builder);

    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validationResult = validator.validateHappnClusterConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));
  });

  it('builds a happner configuration object', () => {
    const validator = new ConfigValidator('1.0.0', mockLogger);
    const builder = ConfigBuilderFactory.getBuilder('happner');

    setHappnConfigValues(builder);
    setHappnerConfigValues(builder);

    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
    const validationResult = validator.validateHappnerConfig(result);
    if (!validationResult.valid) throw new Error(JSON.stringify(validationResult.errors, null, 2));
  });

  it('builds a happner-cluster configuration object', () => {
    const validator = new ConfigValidator('1.0.0', mockLogger);
    const builder = ConfigBuilderFactory.getBuilder('happner-cluster');

    setHappnConfigValues(builder);
    setHappnClusterConfigValues(builder);
    setHappnerConfigValues(builder);
    setHappnerClusterConfigValues(builder);

    const result = builder.build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // validate
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

      // cache
      .withCacheStatisticsCheckPointAuthOverride(5, 1000)
      .withCacheStatisticsCheckPointAuthTokenOverride(5, 1000)
      .withCacheStatisticsInterval(1)
      .withCacheStatisticsSecurityGroupPermissionsOverride(10, 2000)
      .withCacheStatisticsSecurityGroupsOverride(10, 2000)
      .withCacheStatisticsSecurityPasswordsOverride(15, 20000)
      .withCacheStatisticsSecurityUserPermissionsOverride(15, 20000)
      .withCacheStatisticsSecurityUsersOverride(15, 20000)

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
      .withSecurityAdminGroupCustomData('custom admin group data')
      .withSecurityAllowAnonymousAccess(false)
      .withSecurityAuthProvider('testProvider', new (class TestClass {})())
      .withSecurityLockTokenToLoginType(true)
      .withSecurityLockTokenToUserId(true)
      .withSecurityLogSessionActivity(true)
      .withSecurityPbkdf2Iterations(5)
      .withSecurityProfile('testProfile', 'testKey', 1, 50000, 10000)

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
    .withMembershipClusterName('membership1')
    .withMembershipDisseminationFactor(2)
    .withMembershipHost('192.168.1.22', 4000)
    .withMembershipMemberHost('192.168.1.25')
    .withMembershipMemberHost('192.168.1.26')
    .withMembershipJoinTimeout(20000)
    .withMembershipJoinType('joinType')
    .withMembershipPing(1000, 5000, 1000, 2)
    .withMembershipRandomWait(5)
    .withMembershipIsSeed(true)
    .withMembershipSeedWait(1234)
    .withMembershipUdpMaxDgramSize(1000)
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
