const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class ProtocolConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withSecure(isSecure) {
    this.set('secure', isSecure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withHappnProtocol(version, successFunc, transformOutFunc, transformSystemFunc, emitFunc) {
    if (successFunc) {
      this.set(`protocols.happn_${version}.success`, successFunc, BaseBuilder.Types.FUNCTION);
    }

    if (transformOutFunc) {
      this.set(
        `protocols.happn_${version}.transformOut`,
        transformOutFunc,
        BaseBuilder.Types.FUNCTION
      );
    }

    if (transformSystemFunc) {
      this.set(
        `protocols.happn_${version}.transformSystem`,
        transformSystemFunc,
        BaseBuilder.Types.FUNCTION
      );
    }

    if (emitFunc) {
      this.set(`protocols.happn_${version}.emit`, emitFunc, BaseBuilder.Types.FUNCTION);
    }

    return this;
  }

  withAllowNestedPermissions(isAllowed) {
    this.set('allowNestedPermissions', isAllowed, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withInboundLayer(layer) {
    this.push('inboundLayers', layer, BaseBuilder.Types.STRING);
    return this;
  }

  withOutboundLayer(layer) {
    this.push('outboundLayers', layer, BaseBuilder.Types.STRING);
    return this;
  }
};
