/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const ProtocolConfigBuilder = require('../../lib/builders/protocol/protocol-config-builder');
const HappnProtocolConfigBuilder = require('../../lib/builders/protocol/happn-protocol-config-builder');

describe(helper.testName(), function () {
  it('builds a protocol config object', () => {
    const protocolConfigBuilder = new ProtocolConfigBuilder();
    const happn1ProtocolConfigBuilder = new HappnProtocolConfigBuilder();
    const happn2ProtocolConfigBuilder = new HappnProtocolConfigBuilder();
    const happn3ProtocolConfigBuilder = new HappnProtocolConfigBuilder();

    happn1ProtocolConfigBuilder.withProtocolVersion(1).withSuccessFunc(() => {
      return 'success on version 1';
    });
    happn2ProtocolConfigBuilder.withProtocolVersion(2).withSuccessFunc(() => {
      return 'success on version 2';
    });
    happn3ProtocolConfigBuilder.withProtocolVersion(3).withSuccessFunc(() => {
      return 'success on version 3';
    });

    const result = protocolConfigBuilder
      .withAllowNestedPermissions(true)
      .withProtocolBuilder(happn1ProtocolConfigBuilder)
      .withProtocolBuilder(happn2ProtocolConfigBuilder)
      .withProtocolBuilder(happn3ProtocolConfigBuilder)
      .build();

    const { protocols } = result.protocol.config;

    helper.expect(protocols.happn_1).to.not.equal(null);
    helper.expect(protocols.happn_1.success()).to.equal('success on version 1');
    helper.expect(protocols.happn_2).to.not.equal(null);
    helper.expect(protocols.happn_2.success()).to.equal('success on version 2');
    helper.expect(protocols.happn_3).to.not.equal(null);
    helper.expect(protocols.happn_3.success()).to.equal('success on version 3');
  });
});
