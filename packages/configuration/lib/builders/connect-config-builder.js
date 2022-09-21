const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'connect.config';

module.exports = class ConnectConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withCookieName(name) {
    this.set(`${ROOT}.middleware.security.cookieName`, name, BaseBuilder.Types.STRING);
    return this;
  }

  withCookieDomain(domain) {
    this.set(`${ROOT}.middleware.security.cookieDomain`, domain, BaseBuilder.Types.STRING);
    return this;
  }

  withExclusion(exclusion) {
    this.push(`${ROOT}.middleware.security.exclusions`, exclusion, BaseBuilder.Types.STRING);
    return this;
  }

  withForbiddenResponsePath(path) {
    this.set(`${ROOT}.middleware.security.forbiddenResponsePath`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withUnauthorizedResponsePath(path) {
    this.set(
      `${ROOT}.middleware.security.unauthorizedResponsePath`,
      path,
      BaseBuilder.Types.STRING
    );

    return this;
  }
};
