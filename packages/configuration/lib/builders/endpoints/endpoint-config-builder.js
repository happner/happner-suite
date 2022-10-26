const BaseBuilder = require('happn-commons/lib/base-builder');
module.exports = class EndpointConfigBuilder extends BaseBuilder {
  /*
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
   */

  constructor() {
    super();
  }

  withAllowSelfSignedCerts(allow) {
    this.setOnRoot(0, 'config.allowSelfSignedCerts', allow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withEndpointName(name) {
    this.set(`${name}`, {}, BaseBuilder.Types.OBJECT);
    return this;
  }

  withHost(host) {
    this.setOnRoot(0, 'config.host', host, BaseBuilder.Types.STRING);
    return this;
  }

  withPassword(password) {
    this.setOnRoot(0, 'config.password', password, BaseBuilder.Types.STRING);
    return this;
  }

  withPort(port) {
    this.setOnRoot(0, 'config.port', port, BaseBuilder.Types.INTEGER);
    return this;
  }

  withReconnect(max, retries) {
    this.setOnRoot(0, 'reconnect.max', max, BaseBuilder.Types.INTEGER);
    this.setOnRoot(0, 'reconnect.retries', retries, BaseBuilder.Types.INTEGER);
    return this;
  }

  withUrl(url) {
    this.setOnRoot(0, 'config.url', url, BaseBuilder.Types.STRING);
    return this;
  }

  withUsername(username) {
    this.setOnRoot(0, 'config.username', username, BaseBuilder.Types.STRING);
    return this;
  }
};
