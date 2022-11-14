"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class ConnectConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    /* COOKIE STUFF CAN GO */
    withSecurityCookieName(name) {
        this.set(`config.middleware.security.cookieName`, name, BaseBuilder.Types.STRING);
        return this;
    }
    withSecurityCookieDomain(domain) {
        this.set(`config.middleware.security.cookieDomain`, domain, BaseBuilder.Types.STRING);
        return this;
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
//# sourceMappingURL=connect-config-builder.js.map