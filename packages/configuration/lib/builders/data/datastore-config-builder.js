const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class DataStoreConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withName(name) {
    this.set('name', name, BaseBuilder.Types.STRING);
    return this;
  }

  withProvider(provider) {
    this.set('provider', provider, BaseBuilder.Types.STRING);
    return this;
  }

  withIsDefault(isDefault) {
    this.set('isDefault', isDefault, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withIsFsync(isFsync) {
    this.set('settings.fsync', isFsync, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withDbFile(dbFile) {
    this.set('dbfile', dbFile, BaseBuilder.Types.STRING);
    return this;
  }

  withFileName(fileName) {
    this.set('filename', fileName, BaseBuilder.Types.STRING);
    return this;
  }
};
