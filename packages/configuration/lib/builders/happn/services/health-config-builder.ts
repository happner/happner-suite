/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class HealthConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withHealthWarmupLimit(limit: number): HealthConfigBuilder {
    this.set(`config.warmupLimit`, limit, BaseBuilder.Types.INTEGER);
    return this;
  }

  withHealthInterval(interval: number): HealthConfigBuilder {
    this.set(`config.healthInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }
}
