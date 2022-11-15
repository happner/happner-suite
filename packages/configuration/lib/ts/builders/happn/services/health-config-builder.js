"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class HealthConfigBuilder extends BaseBuilder {
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
}
exports.HealthConfigBuilder = HealthConfigBuilder;
