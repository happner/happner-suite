const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class DataConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withDataStore(name, provider, isDefault, isFsync, dbFile, fileName) {
    const builder = new BaseBuilder();

    builder.set('name', name, BaseBuilder.Types.STRING);
    builder.set('provider', provider, BaseBuilder.Types.STRING);
    builder.set('isDefault', isDefault, BaseBuilder.Types.BOOLEAN);
    builder.set('settings.fsync', isFsync, BaseBuilder.Types.BOOLEAN);
    builder.set('dbfile', dbFile, BaseBuilder.Types.STRING);
    builder.set('filename', fileName, BaseBuilder.Types.STRING);

    this.push('datastores', builder, BaseBuilder.Types.OBJECT);

    return this;
  }

  withSecure(secure) {
    this.set('secure', secure, BaseBuilder.Types.BOOLEAN);
    return this;
  }
};
