const BaseBuilder = require('happn-commons/lib/base-builder');

export class EndpointsConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  beginEndpoint(): EndpointConfigBuilder {
    return new EndpointConfigBuilder(this);
  }
}

export class EndpointConfigBuilder extends BaseBuilder {
  #parent;

  constructor(parent: EndpointsConfigBuilder) {
    super();
    this.#parent = parent;
  }

  withName(name: string): EndpointConfigBuilder {
    this.#parent.set(`${name}`, this, BaseBuilder.Types.OBJECT);
    return this;
  }

  withAllowSelfSignedCerts(allow: boolean): EndpointConfigBuilder {
    this.set('config.allowSelfSignedCerts', allow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withHost(host: string): EndpointConfigBuilder {
    this.set('config.host', host, BaseBuilder.Types.STRING);
    return this;
  }

  withPassword(password: string): EndpointConfigBuilder {
    this.set('config.password', password, BaseBuilder.Types.STRING);
    return this;
  }

  withPort(port: number): EndpointConfigBuilder {
    this.set('config.port', port, BaseBuilder.Types.INTEGER);
    return this;
  }

  withReconnect(max: number, retries: number): EndpointConfigBuilder {
    this.set('reconnect.max', max, BaseBuilder.Types.INTEGER);
    this.set('reconnect.retries', retries, BaseBuilder.Types.INTEGER);
    return this;
  }

  withUrl(url: string): EndpointConfigBuilder {
    this.set('config.url', url, BaseBuilder.Types.STRING);
    return this;
  }

  withUsername(username: string): EndpointConfigBuilder {
    this.set('config.username', username, BaseBuilder.Types.STRING);
    return this;
  }

  endEndpoint(): EndpointsConfigBuilder {
    return this.#parent;
  }
}
