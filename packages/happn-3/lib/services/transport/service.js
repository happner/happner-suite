const version = require('../../../package.json').version;
const commons = require('happn-commons');
const tcpPortUsed = require('happn-tcp-port-used');

module.exports = class TransportService extends require('events').EventEmitter {
  constructor() {
    super();
    this.https = require('https');
    this.http = require('http');
    this.fs = commons.fs;
  }

  createCertificate(keyPath, certPath) {
    const X509 =
      this.happn.services.utils.selfSignedCertUtil.createCertificate('happner-framework.com');
    this.fs.writeFileSync(keyPath, X509.key);
    this.fs.writeFileSync(certPath, X509.cert);
    return X509;
  }

  __createHttpsServer(options, app, callback) {
    try {
      var server = this.https.createServer(options, app);

      callback(null, server);
    } catch (e) {
      callback(new Error('error creating server: ' + e.message));
    }
  }

  createServer(config, app, log, callback) {
    if (!config) config = {};
    if (!config.mode) config.mode = 'http';

    this.config = config; //used by other modules (cluster)

    if (['http', 'https'].indexOf(config.mode) === -1)
      throw new Error(`unknown transport mode: ${config.mode} can only be http or https`);

    if (config.mode === 'http') return callback(null, this.http.createServer(app));

    var options = {};

    if (config.cert && !config.key) return callback(new Error('key file missing for cert'));

    if (config.key && !config.cert) return callback(new Error('cert file missing key'));

    if (config.cert) {
      options.key = config.key;
      options.cert = config.cert;
      return this.__createHttpsServer(options, app, callback);
    }

    if (!config.certPath) {
      var userHome = require('user-home');

      config.certPath = userHome + require('path').sep + '.happn-https-cert';
      config.keyPath = userHome + require('path').sep + '.happn-https-key';
    }

    var certFileExists = this.happn.services.utils.fileExists(config.certPath);
    var keyFileExists = this.happn.services.utils.fileExists(config.keyPath);

    if (keyFileExists && !certFileExists)
      return callback(new Error('missing cert file: ' + config.certPath));

    if (!keyFileExists && certFileExists)
      return callback(new Error('missing key file: ' + config.keyPath));

    if (keyFileExists && certFileExists) {
      options.key = this.fs.readFileSync(config.keyPath);
      options.cert = this.fs.readFileSync(config.certPath);
    }

    if (!keyFileExists && !certFileExists) {
      log.warn('cert file ' + config.certPath + ' is missing, trying to generate...');
    }
    let keys;
    try {
      keys = this.createCertificate(config.keyPath, config.certPath);
    } catch (e) {
      return callback(e);
    }
    this.__createHttpsServer(keys, app, callback);
  }

  listen(host, port, options, callback) {
    this.happn.__listening = false;
    this.happn.__listeningOn = false;
    this.happn.__errorOn = false;

    if (this.happn.__listening) return callback(new Error('already listening'));
    if (!this.happn.__initialized) return callback(new Error('main happn service not initialized'));

    if (typeof host === 'function') {
      callback = host;
      host = null;
      port = null;
    }

    if (typeof port === 'function') {
      callback = port;
      port = null;
    }

    if (typeof options === 'function') {
      callback = options;
      options = null;
    }

    // preserve zero as valid port number
    port = port !== 'undefined' ? port : this.happn.__defaultPort;

    //nulls aren't provided for in the above
    if (port == null) port = this.happn.__defaultPort;

    //default host is local/any
    host = host || this.happn.__defaultHost;

    this.happn.__done = callback;

    if (!options) options = {};

    this.happn.server.on('error', (e) => {
      this.happn._lastError = e;
      this.happn.services.log.warn('http server error', e);
    });

    this.__tryListen({
      port: port,
      host: host,
    });
  }

  __tryListen(options) {
    this.happn.log.$$TRACE('listen()');

    if (!options.portAvailablePingInterval) options.portAvailablePingInterval = 1000;
    if (!options.portAvailablePingTimeout) options.portAvailablePingTimeout = 10000; //10 seconds

    var waitingForPortMessageInterval = setInterval(() => {
      this.happn.log.warn(
        'port number ' + options.port + ' held by another process, retrying connection attempt...'
      );
    }, 1000);

    tcpPortUsed
      .waitUntilFree(
        options.port,
        options.portAvailablePingInterval,
        options.portAvailablePingTimeout
      )
      .then(
        () => {
          clearInterval(waitingForPortMessageInterval);
          this.happn.log.debug('port available, about to listen');
          this.happn.server.listen(options.port, options.host, (e) => {
            if (e) return this.happn.__done(e);

            this.happn.__info = this.happn.server.address();
            const { address, port } = this.happn.__info;

            this.happn.__listening = true;
            this.happn.log.info(`happn version ${version} listening at ${address}:${port}`);
            this.happn.config.port = port;
            if (this.happn.__done) {
              this.happn.__done(null, this.happn); // <--- good, created a this.happn
              this.happn.__done = null; //we only want this to be called once per call to listen
            }
          });
        },
        (e) => {
          this.happn.log.error(`port ${options.port} not available: ${e.message}`);
          clearInterval(waitingForPortMessageInterval);
          this.happn.__done(e);
        }
      );
  }

  stop(_options, callback) {
    //drop all connections
    this.happn.dropConnections();
    callback();
  }

  initialize(config, callback) {
    this.createServer(config, this.happn.connect, this.happn.log, (e, server) => {
      if (e) return callback(e);

      this.happn.server = server;
      this.happn.server.keepAliveTimeout = this.config.keepAliveTimeout || 120000; //2 minutes

      Object.defineProperty(this.happn.server, 'listening', {
        get: () => {
          return this.happn.__listening;
        },
        enumerable: 'true',
      });

      this.happn.dropConnections = () => {
        //drop all connections
        for (var key in this.happn.connections) {
          var socket = this.happn.connections[key];

          if (!socket.destroyed) {
            this.happn.log.$$TRACE('killing connection', key);
            socket.destroy();
          } else {
            this.happn.log.$$TRACE('connection killed already', key);
          }

          delete this.happn.connections[key];
        }

        this.happn.log.$$TRACE('killed connections');
      };

      this.happn.server.on('connection', (conn) => {
        var key = conn.remoteAddress + ':' + conn.remotePort;
        this.happn.connections[key] = conn;

        conn.on('close', () => {
          delete this.happn.connections[key];
        });
      });

      this.happn.server.on('error', (e) => {
        this.happn.log.warn('server error', e);
      });

      this.happn.server.on('close', () => {
        if (!this.happn.__info) {
          return this.happn.log.debug('released, no info');
        }
        this.happn.log.debug(
          'released ' + this.happn.__info.address + ':' + this.happn.__info.port
        );
      });

      callback();
    });
  }
};
