/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const { Configuration } = require('../../lib/builders/configuration');
const CacheConfigBuilder = require('../../lib/builders/cache/cache-config-builder');
const ConnectConfigBuilder = require('../../lib/builders/connect/connect-config-builder');
const DataConfigBuilder = require('../../lib/builders/data/data-config-builder');
const ProtocolConfigBuilder = require('../../lib/builders/protocol/protocol-config-builder');
const PublisherConfigBuilder = require('../../lib/builders/publisher/publisher-config-builder');
const SecurityConfigBuilder = require('../../lib/builders/security/security-config-builder');
const HappnConfigBuilder = require('../../lib/builders/happn-config-builder');

describe(helper.testName(), function () {
  it('builds a happn configuration object', () => {
    const happnConfigBuilder = new HappnConfigBuilder();
    const cacheConfigBuilder = new CacheConfigBuilder();
    const connectConfigBuilder = new ConnectConfigBuilder();
    const dataConfigBuilder = new DataConfigBuilder();
    const protocolConfigBuilder = new ProtocolConfigBuilder();
    const publisherConfigBuilder = new PublisherConfigBuilder();
    const securityConfigBuilder = new SecurityConfigBuilder();

    const configuration = new Configuration(
      happnConfigBuilder,
      cacheConfigBuilder,
      connectConfigBuilder,
      dataConfigBuilder,
      protocolConfigBuilder,
      publisherConfigBuilder,
      securityConfigBuilder
    );

    // cache
    configuration.setCacheStatisticsInterval(1);

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
    configuration.setProtocolHappnProtocol(
      1,
      () => {},
      () => {},
      () => {},
      () => {}
    );

    configuration.setPublisherAcknowledgeTimeout(true);
    configuration.setSecurityAdminPublicKey('401be6df11a34');
    configuration.setPublisherTimeout(5000);

    const result = configuration.buildHappnConfig();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // helper.expect(result.cache.config.statisticsInterval).to.equal(mockStatisticsInterval);
  });
});
