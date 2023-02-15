"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
class ConnectConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withSecurityExclusion(exclusion) {
        this.push(`config.middleware.security.exclusions`, exclusion, BaseBuilder.Types.STRING);
        return this;
    }
    withSecurityForbiddenResponsePath(path) {
        this.set(`config.middleware.security.forbiddenResponsePath`, path, BaseBuilder.Types.STRING);
        return this;
    }
    withSecurityUnauthorizedResponsePath(path) {
        this.set(`config.middleware.security.unauthorizedResponsePath`, path, BaseBuilder.Types.STRING);
        return this;
    }
}
exports.ConnectConfigBuilder = ConnectConfigBuilder;
