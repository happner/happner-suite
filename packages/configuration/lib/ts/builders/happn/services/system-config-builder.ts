const BaseBuilder = require('happn-commons/lib/base-builder');

export class SystemConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withName(name: string): SystemConfigBuilder {
    this.set('config.name', name, BaseBuilder.Types.STRING);
    return this;
  }
}
