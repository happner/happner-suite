const format = require('util').format;
const proxy = require('http-proxy');
const dface = require('dface');
const commons = require('happn-commons');
const ProxyStates = require('../constants/proxy-states');
module.exports = class ProxyService {
  #proxyServer;
  #logger;
  #config;
  #onProxyErrorListener;
  #onServerErrorListener;
  #status = ProxyStates.UNINITIALIZED;
  #getAddress;
  #protocol;
  #internalHost;
  #externalPort;
  #internalPort;
  constructor(config, logger) {
    this.#config = config;
    this.#logger = logger;
    this.stop = commons.maybePromisify(this.#stop);
    this.#onProxyErrorListener = this.#onProxyError.bind(this);
    this.#onServerErrorListener = this.#onServerError.bind(this);
    this.#getAddress = require('../utils/get-address')(this.#logger);
  }

  static create(config, logger) {
    return new ProxyService(config, logger);
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

  set externalPort(port = 0) {
    this.#externalPort = port;
  }

  get internalPort() {
    return this.#internalPort;
  }

  get internalHost() {
    return this.#internalHost;
  }

  #onProxyError(error) {
    this.#logger.error('proxy error', error);
  }

  #onServerError(error) {
    this.#logger.error('server error', error);
  }

  setupAddressesAndPorts(externalPort) {
    const endpoint = this.happn.server.address();
    this.#protocol = this.happn.services.transport.config.mode || 'http';
    this.#internalHost = endpoint.address === '0.0.0.0' ? this.#getAddress() : endpoint.address;
    this.#internalPort = endpoint.port;
    this.#externalPort = externalPort;
  }

  start() {
    return new Promise((resolve, reject) => {
      let port, host;

      this.#logger.debug('starting proxy');
      this.#status = ProxyStates.STARTING;

      port = this.#externalPort;
      host = dface(this.#config.host);

      const target = format('%s://%s:%d', this.#protocol, this.#internalHost, this.#internalPort);

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
