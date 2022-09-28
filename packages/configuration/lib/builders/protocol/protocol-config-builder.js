const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'protocol.config';

/*
protocol:{
  config:{
    secure:[bool],
    protocols:{
      happn_1:{
        success:()=>{},
        transformOut:(message)=>{},
        emit:()=>{}
      },
      happn_2:{
        success:()=>{}
      },
      happn_3:{},
      happn_4:{
        transformSystem:()=>{},
        emit:()=>{}
      }
    },
    allowNestedPermissions:true/false,
    outboundLayers:[],
    inboundLayers:[]
  }
}
 */
module.exports = class ProtocolConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withSecure(isSecure) {
    this.set(`${ROOT}.secure`, isSecure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withHappnProtocol(version, successFunc, transformOutFunc, transformSystemFunc, emitFunc) {
    if (successFunc) {
      this.set(
        `${ROOT}.protocols.happn_${version}.success`,
        successFunc,
        BaseBuilder.Types.FUNCTION
      );
    }

    if (transformOutFunc) {
      this.set(
        `${ROOT}.protocols.happn_${version}.transformOut`,
        transformOutFunc,
        BaseBuilder.Types.FUNCTION
      );
    }

    if (transformSystemFunc) {
      this.set(
        `${ROOT}.protocols.happn_${version}.transformSystem`,
        transformSystemFunc,
        BaseBuilder.Types.FUNCTION
      );
    }

    if (emitFunc) {
      this.set(`${ROOT}.protocols.happn_${version}.emit`, emitFunc, BaseBuilder.Types.FUNCTION);
    }

    return this;
  }

  withAllowNestedPermissions(isAllowed) {
    this.set(`${ROOT}.allowNestedPermissions`, isAllowed, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withInboundLayer(layer) {
    this.push(`${ROOT}.inboundLayers`, layer, BaseBuilder.Types.STRING);
    return this;
  }

  withOutboundLayer(layer) {
    this.push(`${ROOT}.outboundLayers`, layer, BaseBuilder.Types.STRING);
    return this;
  }
};
