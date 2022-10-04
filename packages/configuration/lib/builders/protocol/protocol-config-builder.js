const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class ProtocolConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withSecure(isSecure) {
    this.set('secure', isSecure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAllowNestedPermissions(isAllowed) {
    this.set('allowNestedPermissions', isAllowed, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  // TODO: layer is a function, not a string
  withInboundLayer(layer) {
    // validate (possibly using acorn):

    // module.exports = {
    //   getConstructorArgumentNames: (clas) => {
    //     const cstructor = require('acorn')
    //       .parse(clas.toString(), {
    //         ecmaVersion: 'latest',
    //       })
    //       .body[0].body.body.find((x) => {
    //       return x.type === 'MethodDefinition' && x.kind === 'constructor';
    //     });
    //     if (cstructor) return cstructor.value.params.map((x) => x.name);
    //     return [];
    //   },
    // };

    // module.exports.getFunctionParameters = function (fn) {
    //   // eslint-disable-next-line no-useless-escape
    //   const FN_ARGS =
    //     // eslint-disable-next-line no-useless-escape
    //     /^(?:async +)?(?:function)?\s*[^\(=>]*\(\s*([^\)]*)\)|(?:async\s+)?\(?\s*([^\)]*).*=>.*/m;
    //   const FN_ARG_SPLIT = /,/;
    //   const FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
    //   const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
    //
    //   if (typeof fn === 'function') {
    //     const fnText = fn.toString().replace(STRIP_COMMENTS, '');
    //     cons

    /*
     function (message, cb) {
          layerLog1.push(message);
          return cb(null, message);
        },
     */
    this.push('inboundLayers', layer, BaseBuilder.Types.FUNCTION);
    return this;
  }

  //grep -r inboundLayers ./packages/*/test
  // TODO: layer is a function, not a string
  withOutboundLayer(layer) {
    this.push('outboundLayers', layer, BaseBuilder.Types.FUNCTION);
    return this;
  }
};
