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

  withDataStore(name, provider, isDefault, isFsync, dbFile, fileName) {
    const builder = new BaseBuilder();

    builder.set('name', name, BaseBuilder.Types.STRING);
    builder.set('provider', provider, BaseBuilder.Types.STRING);
    builder.set('isDefault', isDefault, BaseBuilder.Types.BOOLEAN);
    builder.set('settings.fsync', isFsync, BaseBuilder.Types.BOOLEAN);
    builder.set('dbfile', dbFile, BaseBuilder.Types.STRING);
    builder.set('filename', fileName, BaseBuilder.Types.STRING);

    this.push(`${ROOT}.datastores`, builder, BaseBuilder.Types.OBJECT);

    return this;
  }
};
