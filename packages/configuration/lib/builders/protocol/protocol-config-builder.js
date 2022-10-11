const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class ProtocolConfigBuilder extends BaseBuilder {
  #fieldTypeValidator;

  constructor(fieldTypeValidator) {
    super();
    this.#fieldTypeValidator = fieldTypeValidator;
  }

  withSecure(isSecure) {
    this.set('secure', isSecure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAllowNestedPermissions(isAllowed) {
    this.set('allowNestedPermissions', isAllowed, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withInboundLayer(layerFunc) {
    let isValid = this.#fieldTypeValidator.validateFunctionArgs(layerFunc, 2).isValid;
    if (!isValid) throw new Error('invalid inbound layer function');
    this.push('inboundLayers', layerFunc, BaseBuilder.Types.FUNCTION);
    return this;
  }

  //grep -r inboundLayers ./packages/*/test
  withOutboundLayer(layerFunc) {
    let isValid = this.#fieldTypeValidator.validateFunctionArgs(layerFunc, 2).isValid;
    if (!isValid) throw new Error('invalid outbound layer function');
    this.push('outboundLayers', layerFunc, BaseBuilder.Types.FUNCTION);
    return this;
  }
};
