"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class SystemConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withName(name) {
        this.set('config.name', name, BaseBuilder.Types.STRING);
        return this;
    }
}
exports.SystemConfigBuilder = SystemConfigBuilder;
