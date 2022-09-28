const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class HappnProtocolConfigBuilder extends BaseBuilder {
  #version;

  constructor() {
    super();
  }

  get version() {
    return this.#version;
  }

  withProtocolVersion(version) {
    this.#version = version;
    return this;
  }

  withSuccessFunc(func) {
    this.set('success', func, BaseBuilder.Types.FUNCTION);
    return this;
  }

  withTransformOutFunc(func) {
    this.set('transformOut', func, BaseBuilder.Types.FUNCTION);
    return this;
  }

  withTransformSystem(func) {
    this.set('transformSystem', func, BaseBuilder.Types.FUNCTION);
    return this;
  }

  withEmitFunc(func) {
    this.set('emit', func, BaseBuilder.Types.FUNCTION);
    return this;
  }
};
