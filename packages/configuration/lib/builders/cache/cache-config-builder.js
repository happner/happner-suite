const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'cache.config';

module.exports = class CacheConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withStatisticsInterval(interval) {
    this.set(`${ROOT}.statisticsInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }
};
