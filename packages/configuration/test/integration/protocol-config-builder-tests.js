/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const ProtocolConfigBuilder = require('../../lib/builders/protocol/protocol-config-builder');
const FieldTypeValidator = require('../../lib/validators/field-type-validator');

describe(helper.testName(), function () {
  it('builds a protocol config object with protocol functions', () => {
    const fieldTypeValidator = new FieldTypeValidator();
    const protocolConfigBuilder = new ProtocolConfigBuilder(fieldTypeValidator);

    let mockAllowNestedPermissions = true;
    let mockSecure = true;
    let mockInboundLayer = (msg, cb) => {
      cb(null, 'test-inbound-layer');
    };
    let mockOutboundLayer = (msg, cb) => {
      cb(null, 'test-outbound-layer');
    };

    protocolConfigBuilder
      .withAllowNestedPermissions(mockAllowNestedPermissions)
      .withInboundLayer(mockInboundLayer)
      .withOutboundLayer(mockOutboundLayer)
      .withSecure(mockSecure);

    const result = protocolConfigBuilder.build();

    helper.expect(result.secure).to.equal(mockSecure);
    helper.expect(result.allowNestedPermissions).to.equal(mockAllowNestedPermissions);

    helper.expect(result.inboundLayers[0]).to.equal(mockInboundLayer);
    let testCb1 = (err, result) => {
      helper.expect(result).to.equal('test-inbound-layer');
    };
    result.inboundLayers[0]('test', testCb1);

    let testCb2 = (err, result) => {
      helper.expect(result).to.equal('test-outbound-layer');
    };
    helper.expect(result.outboundLayers[0]).to.equal(mockOutboundLayer);
    result.outboundLayers[0]('test', testCb2);
  });
});
