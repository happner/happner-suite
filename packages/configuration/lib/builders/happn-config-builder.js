const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'happn.services';

module.exports = class HappnConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withCacheConfigBuilder(cacheBuilder) {
    this.set(`${ROOT}.cache`, cacheBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withConnectConfigBuilder(connectBuilder) {
    this.set(`${ROOT}.connect`, connectBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withDataConfigBuilder(dataBuilder) {
    this.set(`${ROOT}.data`, dataBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withProtocolConfigBuilder(protocolBuilder) {
    this.set(`${ROOT}.protocol`, protocolBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withPublisherConfigBuilder(publisherBuilder) {
    this.set(`${ROOT}.publisher`, publisherBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSecurityConfigBuilder(securityBuilder) {
    this.set(`${ROOT}.security`, securityBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSubscriptionConfigBuilder(subscriptionBuilder) {
    this.set(`${ROOT}.subscription`, subscriptionBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSystemConfigBuilder(systemBuilder) {
    this.set(`${ROOT}.system`, systemBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withTransportConfigBuilder(transportBuilder) {
    this.set(`${ROOT}.transport`, transportBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  build() {
    return super.build();
  }
};
