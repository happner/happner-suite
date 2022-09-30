const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class CacheConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withStatisticsInterval(interval) {
    this.set('statisticsInterval', interval, BaseBuilder.Types.INTEGER);
    return this;
  }
};
