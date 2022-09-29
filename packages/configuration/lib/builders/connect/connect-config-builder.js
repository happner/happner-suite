const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'connect.config';

module.exports = class ConnectConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withSecurityCookieName(name) {
    this.set(`${ROOT}.middleware.security.cookieName`, name, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityCookieDomain(domain) {
    this.set(`${ROOT}.middleware.security.cookieDomain`, domain, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityExclusion(exclusion) {
    this.push(`${ROOT}.middleware.security.exclusions`, exclusion, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityForbiddenResponsePath(path) {
    this.set(`${ROOT}.middleware.security.forbiddenResponsePath`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityUnauthorizedResponsePath(path) {
    this.set(
      `${ROOT}.middleware.security.unauthorizedResponsePath`,
      path,
      BaseBuilder.Types.STRING
    );

    return this;
  }
};
