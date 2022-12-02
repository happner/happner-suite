/* eslint-disable no-console */
import { expect } from 'chai';

import { FieldTypeValidator } from '../../../../lib/validators/field-type-validator';
import { ProtocolConfigBuilder } from '../../../../lib/builders/happn/services/protocol-config-builder';

describe('protocol configuration builder tests', function () {
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

    console.log('RESULT:', JSON.stringify(result, null, 2));

    // assertions

    expect(result.config.secure).to.equal(mockSecure);
    expect(result.config.allowNestedPermissions).to.equal(mockAllowNestedPermissions);

    expect(result.config.inboundLayers[0]).to.equal(mockInboundLayer);
    let testCb1 = (err, result) => {
      expect(result).to.equal('test-inbound-layer');
    };
    result.config.inboundLayers[0]('test', testCb1);

    let testCb2 = (err, result) => {
      expect(result).to.equal('test-outbound-layer');
    };
    expect(result.config.outboundLayers[0]).to.equal(mockOutboundLayer);
    result.config.outboundLayers[0]('test', testCb2);
  });
});
