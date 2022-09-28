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

  withProtocolBuilder(protocolBuilder) {
    if (!protocolBuilder.version) throw new Error('no protocol version has been set');

    this.set(
      `${ROOT}.protocols.happn_${protocolBuilder.version}`,
      protocolBuilder,
      BaseBuilder.Types.OBJECT
    );
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
