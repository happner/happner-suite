const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class HappnConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withCacheBuilder(cacheBuilder) {
    this.set(`happn.services.cache.config`, cacheBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withConnectBuilder(connectBuilder) {
    this.set(`happn.services.connect.config`, connectBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withDataBuilder(dataBuilder) {
    this.set(`happn.services.data.config`, dataBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withProtocolBuilder(protocolBuilder) {
    this.set(`happn.services.protocol.config`, protocolBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withPublisherBuilder(publisherBuilder) {
    this.set(`happn.services.publisher.config`, publisherBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSecurityBuilder(securityBuilder) {
    this.set(`happn.services.security.config`, securityBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  build() {
    return super.build();
  }
};
