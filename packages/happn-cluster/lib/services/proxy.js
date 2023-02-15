/**
 * Created by grant on 2016/09/26.
 */

var format = require('util').format;
var GetAddress = require('../utils/get-address');
var proxy = require('http-proxy');
var dface = require('dface');
var property = require('../utils/property');
function Proxy(opts) {
  property(this, 'log', opts.logger.createLogger('Proxy'));
  property(this, 'getAddress', GetAddress(this.log));
}

Proxy.prototype.initialize = function (config, callback) {
  var self = this;

  self.log.debug('initialising proxy');

  try {
    property(this, 'happn', this.happn);
    property(this, 'config', config);

    property(this, '__onProxyErrorListener', this.__onProxyError.bind(this));
    property(this, '__onServerErrorListener', this.__onServerError.bind(this));

    callback();
  } catch (err) {
    self.log.error(err);
    return callback(err);
  }
};

Proxy.prototype.start = async function () {
  var port,
    host,
    self = this;

  this.log.debug('starting proxy');

  var defaultPort = function () {
    // Listen on default happn port (if available) so that unmodified happn clients default to the proxy
    var address = self.happn.server.address();
    if (address.port === 55000) {
      return 57000;
    }
    return 55000;
  };

  port = typeof this.config.port !== 'undefined' ? this.config.port : defaultPort();
  // if (this.config.port === 0) {
  //   port = await this.happn.services.utils.getFreePort();
  //   this.config.port = port;
  //   this.happn.config.services.proxy.port = port;
  // }
  host = dface(this.config.host);

  var protocol = this.happn.services.transport.config.mode;

  if (!protocol) protocol = 'http';

  var address = this.happn.server.address();

  var targetHost = address.address;
  var targetPort = address.port;

  if (targetHost === '0.0.0.0') targetHost = this.getAddress();
  var target = format('%s://%s:%d', protocol, targetHost, targetPort);

  var allowSelfSigned =
    typeof this.config.allowSelfSignedCerts === 'boolean'
      ? this.config.allowSelfSignedCerts
      : false;

  var opts = {
    timeout: typeof this.config.timeout === 'number' ? this.config.timeout : 20 * 60 * 1000,
    target: target,
    ws: true,
    secure: !allowSelfSigned,
    ssl:
      typeof this.config.keyPath !== 'undefined'
        ? {
            key: require('fs').readFileSync(this.config.keyPath),
            cert: require('fs').readFileSync(this.config.certPath),
          }
        : null,
  };

  var listening =
    opts.ssl == null ? format('http://%s:%d', host, port) : format('https://%s:%d', host, port);

  this.__proxyServer = proxy.createProxyServer(opts);

  let done, returnError;
  var onError = function (error) {
    self.__proxyServer._server.removeListener('listening', onListening);
    returnError(error);
  };
  var onListening = function () {
    self.log.info('forwarding %s to %s', listening, target);
    self.__proxyServer._server.removeListener('error', onError);

    self.__proxyServer.on('error', self.__onProxyErrorListener);
    self.__proxyServer._server.on('error', self.__onServerErrorListener);
    if (self.config.port === 0) {
      let proxyPort = self.__proxyServer._server.address().port;
      self.config.port = proxyPort;
      self.happn.config.services.proxy.port = proxyPort;
    }
    // console.log('ADDRESS: ', self.__proxyServer._server.address());
    done();
  };
  this.__proxyServer.listen(port, host); // need to listen() first, it creates the internal _server (odd)
  this.__proxyServer._server.once('error', onError);
  this.__proxyServer._server.once('listening', onListening);
  return new Promise((res, rej) => {
    done = res;
    returnError = rej;
  });
};

Proxy.prototype.stop = function (options, callback) {
  this.log.info('stopping proxy');

  if (typeof options === 'function') callback = options;

  if (this.__proxyServer) {
    try {
      this.__proxyServer.close();
      callback();
    } catch (err) {
      callback(err);
    } finally {
      this.__proxyServer.removeListener('error', this.__onProxyErrorListener);
      if (this.__proxyServer._server) {
        this.__proxyServer._server.removeListener('error', this.__onServerErrorListener);
      }
    }
  } else callback();
};

Proxy.prototype.__onProxyError = function (error) {
  this.log.error('proxy error', error);
};

Proxy.prototype.__onServerError = function (error) {
  this.log.error('server error', error);
};

module.exports = Proxy;
