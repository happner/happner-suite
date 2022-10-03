const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class HappnConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withCacheConfigBuilder(cacheBuilder) {
    this.set(`happn.services.cache.config`, cacheBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withConnectConfigBuilder(connectBuilder) {
    this.set(`happn.services.connect.config`, connectBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withDataConfigBuilder(dataBuilder) {
    this.set(`happn.services.data.config`, dataBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withProtocolConfigBuilder(protocolBuilder) {
    this.set(`happn.services.protocol.config`, protocolBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withPublisherConfigBuilder(publisherBuilder) {
    this.set(`happn.services.publisher.config`, publisherBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSecurityConfigBuilder(securityBuilder) {
    this.set(`happn.services.security.config`, securityBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSubscriptionConfigBuilder(subscriptionBuilder) {
    this.set(`happn.services.subscription.config`, subscriptionBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSystemConfigBuilder(systemBuilder) {
    this.set(`happn.services.system.config`, systemBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withTransportConfigBuilder(transportBuilder) {
    this.set(`happn.services.transport.config`, transportBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  build() {
    return super.build();
  }
};
