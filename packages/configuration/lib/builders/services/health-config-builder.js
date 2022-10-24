const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class HealthConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withHealthWarmupLimit(limit) {
    this.set(`config.warmupLimit`, limit, BaseBuilder.Types.INTEGER);
    return this;
  }

  withHealthInterval(interval) {
    this.set(`config.healthInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }
};
