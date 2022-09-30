/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const ProtocolConfigBuilder = require('../../lib/builders/protocol/protocol-config-builder');

describe(helper.testName(), function () {
  it('builds a protocol config object', () => {
    const protocolConfigBuilder = new ProtocolConfigBuilder();

    let successFunc1 = () => {
      return 'success on version 1';
    };

    let transformOutFunc1 = () => {
      return 'transformOut on version 1';
    };

    let transformSystemFunc1 = () => {
      return 'transformSystem on version 1';
    };

    let emitFunc1 = () => {
      return 'emit on version 1';
    };

    protocolConfigBuilder.withHappnProtocol(
      1,
      successFunc1,
      transformOutFunc1,
      transformSystemFunc1,
      emitFunc1
    );

    const result = protocolConfigBuilder.build();
    const { protocols } = result;

    helper.expect(protocols.happn_1).to.not.equal(null);
    helper.expect(protocols.happn_1.success()).to.equal('success on version 1');
    helper.expect(protocols.happn_1).to.not.equal(null);
    helper.expect(protocols.happn_1.transformOut()).to.equal('transformOut on version 1');
    helper.expect(protocols.happn_1).to.not.equal(null);
    helper.expect(protocols.happn_1.transformSystem()).to.equal('transformSystem on version 1');
  });
});
