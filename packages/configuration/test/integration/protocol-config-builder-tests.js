/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const ProtocolConfigBuilder = require('../../lib/builders/protocol/protocol-config-builder');

describe(helper.testName(), function () {
  it('builds a protocol config object with protocol functions', () => {
    const protocolConfigBuilder = new ProtocolConfigBuilder();

    let mockAllowNestedPermissions = true;
    let mockSecure = true;
    let mockInboundLayer = 'test-inbound-layer';
    let mockOutboundLayer = 'test-outbound-layer';

    let mockSuccessFunc1 = () => {
      return 'success on version 1';
    };

    let mockTransformOutFunc1 = () => {
      return 'transformOut on version 1';
    };

    let mockTransformSystemFunc1 = () => {
      return 'transformSystem on version 1';
    };

    let mockEmitFunc1 = () => {
      return 'emit on version 1';
    };

    protocolConfigBuilder
      .withAllowNestedPermissions(mockAllowNestedPermissions)
      .withHappnProtocol(
        1,
        mockSuccessFunc1,
        mockTransformOutFunc1,
        mockTransformSystemFunc1,
        mockEmitFunc1
      )
      .withInboundLayer(mockInboundLayer)
      .withOutboundLayer(mockOutboundLayer)
      .withSecure(mockSecure);

    const result = protocolConfigBuilder.build();

    helper.expect(result.secure).to.equal(mockSecure);
    helper.expect(result.protocols.happn_1).to.not.equal(null);
    helper.expect(result.protocols.happn_1.success).to.not.equal(null);
    helper.expect(result.protocols.happn_1.success()).to.equal('success on version 1');
    helper.expect(result.protocols.happn_1.transformOut).to.not.equal(null);
    helper.expect(result.protocols.happn_1.transformOut()).to.equal('transformOut on version 1');
    helper.expect(result.protocols.happn_1.transformSystem).to.not.equal(undefined);
    helper
      .expect(result.protocols.happn_1.transformSystem())
      .to.equal('transformSystem on version 1');
    helper.expect(result.allowNestedPermissions).to.equal(mockAllowNestedPermissions);
    helper.expect(result.inboundLayers[0]).to.equal(mockInboundLayer);
    helper.expect(result.outboundLayers[0]).to.equal(mockOutboundLayer);
  });

  it('builds a protocol config object without specific protocol defined', () => {
    const protocolConfigBuilder = new ProtocolConfigBuilder();

    let mockAllowNestedPermissions = true;
    let mockSecure = true;
    let mockInboundLayer = 'test-inbound-layer';
    let mockOutboundLayer = 'test-outbound-layer';

    protocolConfigBuilder
      .withAllowNestedPermissions(mockAllowNestedPermissions)
      .withHappnProtocol(1)
      .withInboundLayer(mockInboundLayer)
      .withOutboundLayer(mockOutboundLayer)
      .withSecure(mockSecure);

    const result = protocolConfigBuilder.build();

    helper.expect(result.secure).to.equal(mockSecure);
    helper.expect(result.allowNestedPermissions).to.equal(mockAllowNestedPermissions);
    helper.expect(result.inboundLayers[0]).to.equal(mockInboundLayer);
    helper.expect(result.outboundLayers[0]).to.equal(mockOutboundLayer);
  });
});
