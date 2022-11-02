const BaseBuilder = require('happn-commons/lib/base-builder');
module.exports = class EndpointsConfigBuilder extends BaseBuilder {
  /*
  endpoints:{
  'test': {
        reconnect:{ // as per Primus's reconnection settings
          max:2000, //default 3 seconds (3000)
          retries:100 // default Infinity
        },
        config: {
         allowSelfSignedCerts: true,
         url: 'https://mesh.example.com',
          port: PORT_REMOTE,
          host: 'localhost',
          username: '_ADMIN',
          password: 'guessme',
        }
      }
    }
   */

  constructor() {
    super();
  }

  beginEndpoint() {
    return new this.EndpointConfigBuilder(this);
  }

  EndpointConfigBuilder = class extends BaseBuilder {
    #parent;

    constructor(parent) {
      super();
      this.#parent = parent;
    }

    withName(name) {
      this.#parent.set(`${name}`, this, BaseBuilder.Types.OBJECT);
      return this;
    }

    withAllowSelfSignedCerts(allow) {
      this.set('config.allowSelfSignedCerts', allow, BaseBuilder.Types.BOOLEAN);
      return this;
    }

    withHost(host) {
      this.set('config.host', host, BaseBuilder.Types.STRING);
      return this;
    }

    withPassword(password) {
      this.set('config.password', password, BaseBuilder.Types.STRING);
      return this;
    }

    withPort(port) {
      this.set('config.port', port, BaseBuilder.Types.INTEGER);
      return this;
    }

    withReconnect(max, retries) {
      this.set('reconnect.max', max, BaseBuilder.Types.INTEGER);
      this.set('reconnect.retries', retries, BaseBuilder.Types.INTEGER);
      return this;
    }

    withUrl(url) {
      this.set('config.url', url, BaseBuilder.Types.STRING);
      return this;
    }

    withUsername(username) {
      this.set('config.username', username, BaseBuilder.Types.STRING);
      return this;
    }

    endEndpoint() {
      return this.#parent;
    }
  };
};
