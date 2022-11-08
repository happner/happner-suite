const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class HappnerConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withName(name) {
    this.set('happn', name, BaseBuilder.Types.STRING);
    return this;
  }

  withDeferListen(deferListen) {
    this.set('deferListen', deferListen, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withListenFirst(listenFirst) {
    this.set('listenFirst', listenFirst, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withHappnConfigBuilder(happnBuilder) {
    this.set('happn', happnBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withEndpointsConfigBuilder(endpointsBuilder) {
    this.set('endpoints', endpointsBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withModulesConfigBuilder(modulesBuilder) {
    this.set('modules', modulesBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  withComponentsConfigBuilder(componentsBuilder) {
    this.set('components', componentsBuilder, BaseBuilder.Types.OBJECT);
    return this;
  }

  build() {
    return super.build();
  }
};
