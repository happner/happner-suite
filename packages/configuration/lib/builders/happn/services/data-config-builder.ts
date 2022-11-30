/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class DataConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withDataStore(
    name: string,
    provider: string,
    isDefault: boolean,
    isFsync: boolean,
    dbFile: string,
    fileName: string
  ): DataConfigBuilder {
    const builder = new BaseBuilder();

    builder.set('name', name, BaseBuilder.Types.STRING);
    builder.set('provider', provider, BaseBuilder.Types.STRING);
    builder.set('isDefault', isDefault, BaseBuilder.Types.BOOLEAN);
    builder.set('settings.fsync', isFsync, BaseBuilder.Types.BOOLEAN);
    builder.set('dbfile', dbFile, BaseBuilder.Types.STRING);
    builder.set('filename', fileName, BaseBuilder.Types.STRING);

    this.push('config.datastores', builder, BaseBuilder.Types.OBJECT);

    return this;
  }

  withSecure(secure: boolean) {
    this.set('config.secure', secure, BaseBuilder.Types.BOOLEAN);
    return this;
  }
}
