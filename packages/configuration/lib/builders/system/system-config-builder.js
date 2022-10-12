const BaseBuilder = require('happn-commons/lib/base-builder');
module.exports = class SystemConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  /*
    system:{
      config:{
        name:[string]
      }
    }
   */

  withName(name) {
    this.set('config.name', name, BaseBuilder.Types.STRING);
    return this;
  }
};
