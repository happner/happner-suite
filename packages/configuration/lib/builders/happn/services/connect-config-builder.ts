const BaseBuilder = require('happn-commons/lib/base-builder');

export class ConnectConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  /* COOKIE STUFF CAN GO */
  withSecurityCookieName(name: string): ConnectConfigBuilder {
    this.set(`config.middleware.security.cookieName`, name, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityCookieDomain(domain: string): ConnectConfigBuilder {
    this.set(`config.middleware.security.cookieDomain`, domain, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityExclusion(exclusion: string): ConnectConfigBuilder {
    this.push(`config.middleware.security.exclusions`, exclusion, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityForbiddenResponsePath(path: string): ConnectConfigBuilder {
    this.set(`config.middleware.security.forbiddenResponsePath`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withSecurityUnauthorizedResponsePath(path: string): ConnectConfigBuilder {
    this.set(`config.middleware.security.unauthorizedResponsePath`, path, BaseBuilder.Types.STRING);
    return this;
  }
}
