const BaseBuilder = require('happn-commons/lib/base-builder');

export class ConnectConfigBuilder extends BaseBuilder {
  constructor() {
    super();
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
