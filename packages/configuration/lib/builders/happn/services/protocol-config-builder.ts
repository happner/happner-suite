import { FieldTypeValidator } from '../../../validators/field-type-validator.js';

const BaseBuilder = require('happn-commons/lib/base-builder');

export class ProtocolConfigBuilder extends BaseBuilder {
  #fieldTypeValidator;

  constructor(fieldTypeValidator: FieldTypeValidator) {
    super();
    this.#fieldTypeValidator = fieldTypeValidator;
  }

  withSecure(isSecure: boolean): ProtocolConfigBuilder {
    this.set('config.secure', isSecure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAllowNestedPermissions(isAllowed: boolean): ProtocolConfigBuilder {
    this.set('config.allowNestedPermissions', isAllowed, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withInboundLayer(layerFunc: Function): ProtocolConfigBuilder {
    let isValid = this.#fieldTypeValidator.validateFunctionArgs(layerFunc, 2).isValid;
    if (!isValid) throw new Error('invalid inbound layer function');
    this.push('config.inboundLayers', layerFunc, BaseBuilder.Types.FUNCTION);
    return this;
  }

  //grep -r inboundLayers ./packages/*/test
  withOutboundLayer(layerFunc: Function): ProtocolConfigBuilder {
    let isValid = this.#fieldTypeValidator.validateFunctionArgs(layerFunc, 2).isValid;
    if (!isValid) throw new Error('invalid outbound layer function');
    this.push('config.outboundLayers', layerFunc, BaseBuilder.Types.FUNCTION);
    return this;
  }
}
