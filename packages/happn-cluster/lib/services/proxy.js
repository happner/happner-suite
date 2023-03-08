const format = require('util').format;
const proxy = require('http-proxy');
const dface = require('dface');
const commons = require('happn-commons');
const ProxyStates = require('../constants/proxy-states');
module.exports = class Proxy {
  #proxyServer;
  #logger;
  #config;
  #onProxyErrorListener;
  #onServerErrorListener;
  #status = ProxyStates.UNINITIALIZED;
  #getAddress;

  constructor(opts) {
    this.#logger = opts.logger.createLogger('Proxy');
    this.initialize = commons.maybePromisify(this.#initialize);
    this.stop = commons.maybePromisify(this.#stop);
    this.#onProxyErrorListener = this.#onProxyError.bind(this);
    this.#onServerErrorListener = this.#onServerError.bind(this);
    this.#getAddress = require('../utils/get-address')(this.#logger);
  }

  get status() {
    return this.#status;
  }

  get server() {
    return this.#proxyServer?._server;
  }

  get config() {
    return this.#config;
  }

  #initialize(config, callback) {
    this.#logger.debug('initialising proxy');
    try {
      this.#config = config;
      callback();
    } catch (err) {
      this.#logger.error(err);
      return callback(err);
    }
  }

  #defaultPort() {
    // Listen on default happn port (if available) so that unmodified happn clients default to the proxy
    var address = this.happn.server.address();
    if (address.port === 55000) {
      return 57000;
    }
    return 55000;
  }

  #onProxyError(error) {
    this.#logger.error('proxy error', error);
  }

  #onServerError(error) {
    this.#logger.error('server error', error);
  }

  start() {
    return new Promise((resolve, reject) => {
      let port, host;

      this.#logger.debug('starting proxy');
      this.#status = ProxyStates.STARTING;

      port = typeof this.#config.port !== 'undefined' ? this.#config.port : this.#defaultPort();
      host = dface(this.#config.host);

      const protocol = this.happn.services.transport.config.mode || 'http';
      const endpoint = this.happn.server.address();
      const targetHost = endpoint.address === '0.0.0.0' ? this.#getAddress() : endpoint.address;
      const targetPort = endpoint.port;
      const target = format('%s://%s:%d', protocol, targetHost, targetPort);

      const allowSelfSigned =
        typeof this.#config.allowSelfSignedCerts === 'boolean'
          ? this.#config.allowSelfSignedCerts
          : false;

      const opts = {
        timeout: typeof this.#config.timeout === 'number' ? this.#config.timeout : 20 * 60 * 1000,
        target: target,
        ws: true,
        secure: !allowSelfSigned,
        ssl:
          typeof this.#config.keyPath !== 'undefined'
            ? {
                key: require('fs').readFileSync(this.#config.keyPath),
                cert: require('fs').readFileSync(this.#config.certPath),
              }
            : null,
      };

      const listening =
        opts.ssl == null ? format('http://%s:%d', host, port) : format('https://%s:%d', host, port);

      this.#proxyServer = proxy.createProxyServer(opts);
      const onError = (error) => {
        this.#proxyServer._server.removeListener('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        this.#logger.info('forwarding %s to %s', listening, target);
        this.#proxyServer._server.removeListener('error', onError);
        this.#proxyServer.on('error', this.#onProxyErrorListener);
        this.#proxyServer._server.on('error', this.#onServerErrorListener);

        if (this.#config.port === 0) {
          let proxyPort = this.#proxyServer._server.address().port;
          this.#config.port = proxyPort;
          this.happn.config.services.proxy.port = proxyPort;
          // necessary for accessing from the outside
        }

        this.#status = ProxyStates.STARTED;
        resolve();
      };

      this.#proxyServer.listen(port, host); // need to listen() first, it creates the internal _server (odd)
      this.#proxyServer._server.once('error', onError);
      this.#proxyServer._server.once('listening', onListening);
    });
  }
  #stop(options, callback) {
    this.#status = ProxyStates.STOPPED;
    this.#logger.info('stopping proxy');
    if (typeof options === 'function') callback = options;

    if (this.#proxyServer) {
      try {
        this.#proxyServer.close();
        callback();
      } catch (err) {
        callback(err);
      } finally {
        this.#proxyServer.removeListener('error', this.#onProxyErrorListener);
        if (this.#proxyServer._server) {
          this.#proxyServer._server.removeListener('error', this.#onServerErrorListener);
        }
      }
    } else callback();
  }
};
