const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'data.config';

module.exports = class DataConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withSecure(secure) {
    this.set(`${ROOT}.secure`, secure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withDataStoreBuilder(builder) {
    this.push(`${ROOT}.datastores`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }
};
