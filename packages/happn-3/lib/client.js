/* eslint-disable no-console */
(function () {
  // begin enclosed

  var browser = false;
  var Logger;
  var crypto;
  var Primus;

  var PROTOCOL = 'happn_{{protocol}}';
  var HAPPN_VERSION = '{{version}}';
  var STATUS;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') browser = true;

  // allow require when module is defined (needed for NW.js)
  if (typeof module !== 'undefined') module.exports = HappnClient;

  let utils, CONSTANTS;

  if (!browser) {
    console.log(__dirname);
    CONSTANTS = require('./constants-builder');
    utils = require('happn-commons').utils;
    Logger = require('happn-logger');
    PROTOCOL = 'happn_' + require('../package.json').protocol; //we can access our package
    HAPPN_VERSION = require('../package.json').version; //we can access our package
    Primus = require('happn-primus-wrapper');
  } else {
    //DO NOT DELETE
    //{{utils}}
    //DO NOT DELETE
    //{{constants}}
    window.HappnClient = HappnClient;
    Primus = window.Primus;
    // Object.assign polyfill for IE11 (from mozilla)
    if (typeof Object.assign !== 'function') {
      Object.defineProperty(Object, 'assign', {
        value: function assign(target) {
          'use strict';
          if (target === null || target === undefined) {
            throw new TypeError('Cannot convert undefined or null to object');
          }
          var to = Object(target);
          for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null && nextSource !== undefined) {
              for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                  to[nextKey] = nextSource[nextKey];
                }
              }
            }
          }
          return to;
        },
        writable: true,
        configurable: true,
      });
    }
  }
  function HappnClient() {
    STATUS = CONSTANTS.CLIENT_STATE;
  }

  HappnClient.__instance = function (options) {
    return new HappnClient().client(options);
  };

  HappnClient.create = utils.maybePromisify(function (connection, options, callback) {
    if (typeof connection === 'function') {
      callback = connection;
      options = {};
      connection = null;
    }

    if (typeof options === 'function') {
      callback = options;
      options = connection ? connection : {};
      connection = null;
    }

    if (!options) {
      options = connection || null;
    }

    var client = new HappnClient().client(options);

    if (options != null) {
      if (options.testMode) HappnClient.lastClient = client;
      if (typeof options.cookieEventHandler === 'function' && browser) {
        HappnClient.addCookieEventHandler(
          options.cookieEventHandler,
          options.cookieName,
          options.interval
        );
      }
    }
    return client.initialize(function (err, createdClient) {
      if (!err) return callback(null, createdClient);

      if (client.state.clientType !== 'eventemitter') {
        return client.disconnect(function () {
          callback(err);
        });
      }
      client.socket.disconnect();
      callback(err);
    });
  });

  HappnClient.getCookieEventDefaults = function (cookieName, interval) {
    return {
      cookieName: cookieName || 'happn_token',
      interval:
        isNaN(parseInt(interval)) || parseInt(interval) < 500
          ? 1000 // if not a number or < 500 set to sane default
          : parseInt(interval),
    };
  };

  HappnClient.addCookieEventHandler = function (handler, cookieName, interval) {
    const cookieEventDefaults = HappnClient.getCookieEventDefaults(cookieName, interval);
    const cookieCheckKey = `${cookieEventDefaults.cookieName}_${cookieEventDefaults.interval}`;
    if (!HappnClient.__cookieEventHandlers) {
      HappnClient.__cookieEventHandlers = {};
      HappnClient.__cookieCheckIntervals = {};
    }
    if (!HappnClient.__cookieEventHandlers[cookieCheckKey]) {
      HappnClient.__cookieEventHandlers[cookieCheckKey] = [];
    }
    if (HappnClient.__cookieEventHandlers[cookieCheckKey].indexOf(handler) === -1) {
      HappnClient.__cookieEventHandlers[cookieCheckKey].push(handler);
    }
    if (!HappnClient.__cookieCheckStatuses) {
      HappnClient.__cookieCheckStatuses = {};
    }

    if (HappnClient.__cookieCheckIntervals[cookieCheckKey] == null) {
      HappnClient.__cookieCheckIntervals[cookieCheckKey] = HappnClient.__setupCookieCheckInterval(
        cookieEventDefaults.cookieName,
        cookieEventDefaults.interval,
        HappnClient.__cookieEventHandlers[cookieCheckKey],
        handler
      );
    }
  };

  HappnClient.__setupCookieCheckInterval = function (cookieName, interval, handlers) {
    const cookieInstance = HappnClient.__getCookieInstance(cookieName);
    HappnClient.__cookieCheckStatuses[cookieName] =
      cookieInstance === '' ? 'cookie-deleted' : 'cookie-created';
    let lastCreatedCookie = cookieInstance;
    return setInterval(function () {
      let currentCookie = HappnClient.__getCookieInstance(cookieName);
      let currentStatus = HappnClient.__cookieCheckStatuses[cookieName];
      if (currentCookie === '' && currentStatus === 'cookie-created') {
        HappnClient.__cookieCheckStatuses[cookieName] = 'cookie-deleted';
        HappnClient.__emitCookieEvent('cookie-deleted', lastCreatedCookie, handlers);
      } else if (currentCookie.length > 0 && currentStatus === 'cookie-deleted') {
        lastCreatedCookie = currentCookie;
        HappnClient.__cookieCheckStatuses[cookieName] = 'cookie-created';
        HappnClient.__emitCookieEvent('cookie-created', currentCookie, handlers);
      }
    }, interval);
  };

  HappnClient.clearCookieEventObjects = function () {
    if (HappnClient.__cookieEventHandlers == null) return;
    Object.values(HappnClient.__cookieCheckIntervals).forEach((cookieEventInterval) => {
      clearInterval(cookieEventInterval);
    });
    HappnClient.__cookieEventHandlers = {};
    HappnClient.__cookieCheckIntervals = {};
  };

  HappnClient.__emitCookieEvent = function (event, cookie, handlers) {
    handlers.forEach((handler) => {
      handler(event, cookie);
    });
  };

  HappnClient.__getCookieInstance = function (cname, sessionDocument) {
    sessionDocument = sessionDocument || document;
    const name = `${cname}=`;
    const decodedCookie = decodeURIComponent(sessionDocument.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return '';
  };

  HappnClient.prototype.client = function (options) {
    options = options || {};

    if (options.Logger && options.Logger.createLogger) {
      this.log = options.Logger.createLogger('HappnClient');
    } else if (Logger) {
      if (!Logger.configured) Logger.configure(options.utils);

      this.log = Logger.createLogger('HappnClient');
    } else {
      this.log = {
        $$TRACE: function (msg, obj) {
          if (obj) return console.info('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
        $$DEBUG: function (msg, obj) {
          if (obj) return console.info('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
        trace: function (msg, obj) {
          if (obj) return console.info('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
        debug: function (msg, obj) {
          if (obj) return console.info('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
        info: function (msg, obj) {
          if (obj) return console.info('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
        warn: function (msg, obj) {
          if (obj) return console.warn('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
        error: function (msg, obj) {
          if (obj) return console.error('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
        fatal: function (msg, obj) {
          if (obj) return console.error('HappnClient', msg, obj);
          console.info('HappnClient', msg);
        },
      };
    }

    this.log.$$TRACE('new client()');
    this.__initializeState(); //local properties
    this.__prepareInstanceOptions(options);
    this.__initializeEvents(); //client events (connect/disconnect etc.)

    return this;
  };

  HappnClient.prototype.initialize = utils.maybePromisify(function (callback) {
    //ensure session scope is not on the prototype
    this.session = null;
    if (browser) {
      return this.getResources((e) => {
        if (e) return callback(e);
        this.authenticate((e) => {
          if (e) return callback(e);
          this.status = STATUS.ACTIVE;
          callback(null, this);
        });
      });
    }
    this.authenticate((e) => {
      if (e) return callback(e);
      this.status = STATUS.ACTIVE;
      callback(null, this);
    });
  });

  HappnClient.prototype.__prepareCookieOptions = function (options) {
    if (options.info._browser) {
      this.cookieEventHandler = options.cookieEventHandler;
      this.cookieEventInterval = options.cookieEventInterval;
    }
  };

  HappnClient.prototype.__prepareSecurityOptions = function (options) {
    if (options.keyPair && options.keyPair.publicKey) options.publicKey = options.keyPair.publicKey;

    if (options.keyPair && options.keyPair.privateKey)
      options.privateKey = options.keyPair.privateKey;
  };

  HappnClient.prototype.__prepareSocketOptions = function (options) {
    //backward compatibility config options
    if (!options.socket) options.socket = {};
    if (!options.socket.reconnect) options.socket.reconnect = {};
    if (options.reconnect) options.socket.reconnect = options.reconnect; //override, above config is very convoluted
    if (!options.socket.reconnect.retries) options.socket.reconnect.retries = Infinity;
    if (!options.socket.reconnect.max) options.socket.reconnect.max = 180e3; //3 minutes

    if (options.connectTimeout != null) {
      options.socket.timeout = options.connectTimeout;
    } else {
      options.socket.timeout = options.socket.timeout != null ? options.socket.timeout : 30e3; //30 seconds
    }

    options.socket.pingTimeout =
      'pingTimeout' in options.socket ? options.socket.pingTimeout : 45e3; //45 second default

    options.socket.strategy =
      options.socket.reconnect.strategy || options.socket.strategy || 'disconnect,online';
  };

  HappnClient.prototype.__prepareConnectionOptions = function (options, defaults) {
    var setDefaults = function (propertyName) {
      if (!options[propertyName] && defaults[propertyName] != null)
        options[propertyName] = defaults[propertyName];
    };

    if (defaults) {
      setDefaults('host');
      setDefaults('port');
      setDefaults('url');
      setDefaults('protocol');
      setDefaults('allowSelfSignedCerts');
      setDefaults('username');
      setDefaults('password');
      setDefaults('publicKey');
      setDefaults('privateKey');
      setDefaults('token');
    }

    if (!options.host) options.host = '127.0.0.1';

    if (!options.port) options.port = 55000;

    if (!options.url) {
      options.protocol = options.protocol || 'http';

      if (options.protocol === 'http' && parseInt(options.port) === 80) {
        options.url = options.protocol + '://' + options.host;
      } else if (options.protocol === 'https' && parseInt(options.port) === 443) {
        options.url = options.protocol + '://' + options.host;
      } else {
        options.url = options.protocol + '://' + options.host + ':' + options.port;
      }
    }

    return options;
  };

  HappnClient.prototype.__prepareInstanceOptions = function (options) {
    var preparedOptions;

    if (options.config) {
      //we are going to standardise here, so no more config.config
      preparedOptions = options.config;

      for (var optionProperty in options) {
        if (optionProperty !== 'config' && !preparedOptions[optionProperty])
          preparedOptions[optionProperty] = options[optionProperty];
      }
    } else preparedOptions = options;

    if (!preparedOptions.callTimeout) preparedOptions.callTimeout = 60000; //1 minute

    //this is for local client connections
    if (preparedOptions.context)
      Object.defineProperty(this, 'context', {
        value: preparedOptions.context,
      });

    //how we override methods
    if (preparedOptions.plugin) {
      for (var overrideName in preparedOptions.plugin) {
        // eslint-disable-next-line no-prototype-builtins
        if (preparedOptions.plugin.hasOwnProperty(overrideName)) {
          if (preparedOptions.plugin[overrideName].bind)
            this[overrideName] = preparedOptions.plugin[overrideName].bind(this);
          else this[overrideName] = preparedOptions.plugin[overrideName];
        }
      }
    }

    preparedOptions = this.__prepareConnectionOptions(preparedOptions);

    this.__prepareSecurityOptions(preparedOptions);

    if (preparedOptions.allowSelfSignedCerts) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    this.__prepareSocketOptions(preparedOptions);

    var info = preparedOptions.info != null ? preparedOptions.info : {};

    if (typeof info !== 'object')
      info = {
        data: info,
      };

    preparedOptions.info = info;
    preparedOptions.info._browser = preparedOptions.info._browser || browser;

    this.__prepareCookieOptions(preparedOptions);

    if (preparedOptions.loginRetry == null) preparedOptions.loginRetry = 4; // will attempt to login to the same address 4 times
    if (preparedOptions.loginRetryInterval == null) preparedOptions.loginRetryInterval = 5000; // five seconds apart

    if (preparedOptions.loginTimeout == null)
      preparedOptions.loginTimeout = preparedOptions.callTimeout; // will wait a minute before failing the login

    if (preparedOptions.defaultVariableDepth == null) preparedOptions.defaultVariableDepth = 5;

    this.options = preparedOptions;
  };

  HappnClient.prototype.__updateOptions = function (possibility) {
    const syncOption = (propertyName) => {
      if (possibility[propertyName] != null) this.options[propertyName] = possibility[propertyName];
    };
    syncOption('url');
    syncOption('host');
    syncOption('port');
    syncOption('protocol');
    syncOption('allowSelfSignedCerts');
    syncOption('username');
    syncOption('password');
    syncOption('publicKey');
    syncOption('privateKey');
    syncOption('token');
  };

  HappnClient.prototype.__getConnection = function (callback) {
    this.__connectionCleanup((e) => {
      if (e) return callback(e);
      this.options.socket.manual = true; //because we want to explicitly call open()
      this.__connectSocket(callback);
    });
  };

  HappnClient.prototype.__waitForConnection = function (socket, callback) {
    return () => {
      if (this.status === STATUS.CONNECTING) {
        this.status = STATUS.ACTIVE;
        this.serverDisconnected = false;
        socket.removeListener('open', this.__waitForConnection);
        callback(null, socket);
      }
    };
  };

  HappnClient.prototype.__onSocketError = function (socket, callback) {
    return (e) => {
      if (this.status === STATUS.CONNECTING) {
        // ERROR before connected,
        // ECONNREFUSED etc. out as errors on callback
        this.status = STATUS.CONNECT_ERROR;
        this.__endAndDestroySocket(socket, (destroyErr) => {
          if (destroyErr)
            this.log.warn(
              'socket.end failed in client connection failure: ' + destroyErr.toString()
            );
          callback(e.error || e);
        });
      }
      this.handle_error(e.error || e);
    };
  };

  HappnClient.prototype.__onSocketTimeout = function (callback) {
    return () => {
      if (this.status === STATUS.CONNECTING) {
        this.status = STATUS.CONNECT_ERROR;
        return callback(new Error('connection timed out'));
      }
      this.handle_error(new Error('connection timed out'));
    };
  };

  HappnClient.prototype.__connectSocket = function (callback) {
    var socket;
    this.status = STATUS.CONNECTING;

    if (browser) socket = new Primus(this.options.url, this.options.socket);
    else {
      var Socket = Primus.createSocket({
        transformer: this.options.transformer,
        parser: this.options.parser,
        manual: true,
      });

      socket = new Socket(this.options.url, this.options.socket);
    }

    socket.on('timeout', this.__onSocketTimeout(callback));
    socket.on('open', this.__waitForConnection(socket, callback));
    socket.on('error', this.__onSocketError(socket, callback));

    socket.open();
  };

  HappnClient.prototype.__initializeState = function () {
    this.state = {};
    this.__initializeEventState();
    this.state.requestEvents = {};
    this.state.currentEventId = 0;
    this.state.currentListenerId = 0;
    this.state.errors = [];
    this.state.clientType = 'socket';
    this.state.systemMessageHandlers = [];
    this.status = STATUS.UNINITIALIZED;
    this.state.ackHandlers = {};
    this.state.eventHandlers = {};
  };

  HappnClient.prototype.__initializeEvents = function () {
    this.onEvent = (eventName, eventHandler) => {
      if (!eventName) throw new Error('event name cannot be blank or null');
      if (typeof eventHandler !== 'function') throw new Error('event handler must be a function');
      if (!this.state.eventHandlers[eventName]) this.state.eventHandlers[eventName] = [];

      this.state.eventHandlers[eventName].push(eventHandler);

      return eventName + '|' + (this.state.eventHandlers[eventName].length - 1);
    };

    this.offEvent = (handlerId) => {
      var eventName = handlerId.split('|')[0];
      var eventIndex = parseInt(handlerId.split('|')[1]);
      this.state.eventHandlers[eventName][eventIndex] = null;
    };

    this.emit = (eventName, eventData) => {
      if (this.state.eventHandlers[eventName]) {
        this.state.eventHandlers[eventName].forEach((handler) => {
          if (!handler) return;
          handler.call(handler, eventData);
        });
      }
    };
  };

  HappnClient.prototype.getScript = function (url, callback) {
    if (!browser) return callback(new Error('only for browser'));

    var script = document.createElement('script');
    script.src = url;
    var head = document.getElementsByTagName('head')[0];
    var done = false;

    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function () {
      if (
        !done &&
        (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')
      ) {
        done = true;
        script.onload = script.onreadystatechange = null;
        head.removeChild(script);
        callback();
      }
    };

    head.appendChild(script);
  };

  HappnClient.prototype.getResources = function (callback) {
    if (typeof Primus !== 'undefined') return callback();

    this.getScript(this.options.url + '/browser_primus.js', function (e) {
      if (e) return callback(e);

      if (typeof Primus === 'undefined') {
        if (window && window.Primus) Primus = window.Primus;
        else if (document && document.Primus) Primus = document.Primus;
        else return callback(new Error('unable to fetch Primus library'));

        callback();
      }
    });
  };

  HappnClient.prototype.stop = utils.maybePromisify(function (callback) {
    this.__connectionCleanup(callback);
  });

  HappnClient.prototype.__ensureCryptoLibrary = utils.maybePromisify(function (callback) {
    if (crypto) return callback();

    if (browser) {
      this.getScript(this.options.url + '/browser_crypto.js', function (e) {
        if (e) return callback(e);
        crypto = new window.Crypto();
        callback();
      });
    } else {
      Crypto = require('happn-util-crypto');
      crypto = new Crypto();
      callback();
    }
  });

  HappnClient.prototype.__writeCookie = function (session, sessionDocument) {
    const cookie = this.__getCookie(session);
    sessionDocument.cookie = cookie;
  };

  HappnClient.prototype.__getCookie = function (session) {
    var cookie = (session.cookieName || 'happn_token') + '=' + session.token + '; path=/;';
    if (session.cookieDomain) cookie += ' domain=' + session.cookieDomain + ';';
    if (this.options.protocol === 'https') cookie += ' Secure;';
    return cookie;
  };

  HappnClient.prototype.__expireCookie = function (session, sessionDocument) {
    session.token = '';
    var cookie = this.__getCookie(session);
    cookie += '; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    sessionDocument.cookie = cookie;
  };

  HappnClient.prototype.__attachSession = function (result, useCookie) {
    delete result._meta;
    this.session = result;
    if (browser) {
      if (!useCookie) {
        this.__writeCookie(result, document);
      }
    }
  };

  HappnClient.prototype.__payloadToError = function (payload) {
    var err = new Error(payload.toString());
    if (payload.message) err.message = payload.message;
    return err;
  };

  HappnClient.prototype.__doLogin = function (loginParameters, callback) {
    var login = (cb) => {
      this.__performSystemRequest(
        'login',
        loginParameters,
        {
          timeout: this.options.loginTimeout,
        },
        (e, result) => {
          if (e) return cb(e);
          if (result._meta.status === 'ok') {
            this.__attachSession(result, loginParameters.useCookie);
            cb();
          } else cb(this.__payloadToError(result.payload));
        }
      );
    };

    if (!this.options.loginRetry) return login(callback);

    if (!this.options.loginRetryInterval || typeof this.options.loginRetryInterval !== 'number')
      this.options.loginRetryInterval = 5000; //just in case, someone made it 0 or -1 or blah

    var currentAttempt = 0;
    var loggedIn = false;

    utils.whilst(
      () => {
        return currentAttempt < this.options.loginRetry && loggedIn === false;
      },
      (_attempt, next) => {
        currentAttempt++;
        login((e) => {
          if (e) {
            if ([403, 401].indexOf(e.code) > -1) return next(e); //access was denied
            if (currentAttempt === this.options.loginRetry) return next(e);
            return setTimeout(next, this.options.loginRetryInterval);
          }
          loggedIn = true;
          return next();
        });
      },
      callback
    );
  };

  HappnClient.prototype.__signNonce = function (nonce) {
    return crypto.sign(nonce, this.options.privateKey);
  };

  HappnClient.prototype.__prepareLogin = function (loginParameters, callback) {
    if (loginParameters.loginType !== 'digest') {
      return callback(null, loginParameters);
    }
    this.__performSystemRequest(
      'request-nonce',
      {
        publicKey: loginParameters.publicKey,
      },
      null,
      (e, response) => {
        if (e) return callback(e);
        loginParameters.digest = this.__signNonce(response.nonce);
        callback(null, loginParameters);
      }
    );
  };

  HappnClient.prototype.__prepareAndDoLogin = function (loginParameters, callback) {
    this.__prepareLogin(loginParameters, (e, preparedParameters) => {
      if (e) return callback(e);
      this.__doLogin(preparedParameters, callback);
    });
  };

  HappnClient.prototype.__sessionConfigureAndDescribe = function () {
    return new Promise((resolve, reject) => {
      this.__performSystemRequest(
        'configure-session',
        {
          protocol: PROTOCOL,
          version: HAPPN_VERSION,
          browser: browser,
        },
        null,
        (e) => {
          if (e) return reject(e);
          this.__performSystemRequest('describe', null, null, function (e, serverInfo) {
            if (e) return reject(e);
            resolve(serverInfo);
          });
        }
      );
    });
  };

  HappnClient.prototype.login = utils.maybePromisify(function (callback) {
    const loginParameters = {
      username: this.options.username,
      info: this.options.info,
      protocol: PROTOCOL,
    };
    if (this.options && this.options.authType) loginParameters.authType = this.options.authType;

    loginParameters.info._browser = loginParameters.info._browser || browser;
    loginParameters.info._local = this.socket._local ? true : false;

    if (this.options.password) loginParameters.password = this.options.password;
    if (this.options.publicKey) loginParameters.publicKey = this.options.publicKey;
    if (this.options.token) loginParameters.token = this.options.token;

    if (PROTOCOL === 'happn_{{protocol}}') PROTOCOL = 'happn'; //if this file is being used without a replace on the protocol

    this.__sessionConfigureAndDescribe()
      .then((serverInfo) => {
        this.serverInfo = serverInfo;
        if (!this.serverInfo.secure) return this.__doLogin(loginParameters, callback);

        if (this.options.useCookie) {
          if (!browser) {
            return callback(new Error('Logging in with cookie only valid in browser'));
          }
          loginParameters.token = HappnClient.__getCookieInstance(serverInfo.cookieName);
          loginParameters.useCookie = true;
        }
        if (!loginParameters.token && !loginParameters.username) {
          return callback(new Error('happn server is secure, please specify a username or token'));
        }
        if (
          !loginParameters.password &&
          !loginParameters.token &&
          loginParameters.username !== '_ANONYMOUS'
        ) {
          if (!loginParameters.publicKey)
            return callback(new Error('happn server is secure, please specify a password'));
          loginParameters.loginType = 'digest';
        }

        if (loginParameters.loginType !== 'digest')
          return this.__doLogin(loginParameters, callback);

        this.__ensureCryptoLibrary((e) => {
          if (e) return callback(e);

          if (!this.options.privateKey || !this.options.publicKey)
            return callback(
              new Error('login type is digest, but no privateKey and publicKey specified')
            );

          loginParameters.publicKey = this.options.publicKey;
          this.__prepareAndDoLogin(loginParameters, callback);
        });
      })
      .catch((e) => {
        this.emit('connect-error', e);
        callback(e);
      });
  });

  HappnClient.prototype.authenticate = utils.maybePromisify(function (callback) {
    if (this.socket) {
      // handle_reconnection also call through here to 're-authenticate'.
      // this is that happening. Don't make new socket.
      // if the login fails, a setTimeout 3000 and re-authenticate, retry happens
      // see this.__retryReconnect
      this.login(callback);
      return;
    }

    this.__getConnection((e, socket) => {
      if (e) return callback(e);
      this.socket = socket;
      this.socket.on('data', this.handle_publication.bind(this));
      this.socket.on('reconnected', this.reconnect.bind(this));
      this.socket.on('end', this.handle_end.bind(this));
      this.socket.on('close', this.handle_end.bind(this));
      this.socket.on('reconnect timeout', this.handle_reconnect_timeout.bind(this));
      this.socket.on('reconnect scheduled', this.handle_reconnect_scheduled.bind(this));
      // login is called before socket connection established...
      // seems ok (streams must be paused till open)
      this.login(callback);
    });
  });

  HappnClient.prototype.handle_end = function () {
    this.status = STATUS.DISCONNECTED;
    if (this.session) return this.emit('connection-ended', this.session.id);
    this.emit('connection-ended');
  };

  HappnClient.prototype.handle_reconnect_timeout = function (err, opts) {
    this.status = STATUS.DISCONNECTED;
    this.emit('reconnect-timeout', {
      err: err,
      opts: opts,
    });
  };

  HappnClient.prototype.handle_reconnect_scheduled = function (opts) {
    this.status = STATUS.RECONNECTING;
    this.emit('reconnect-scheduled', opts);
  };

  HappnClient.prototype.getEventId = function () {
    return (this.state.currentEventId += 1);
  };

  HappnClient.prototype.__requestCallback = function (
    message,
    callback,
    options,
    eventId,
    path,
    action
  ) {
    var callbackHandler = {
      eventId: message.eventId,
    };

    callbackHandler.handleResponse = (e, response) => {
      clearTimeout(callbackHandler.timedout);
      delete this.state.requestEvents[callbackHandler.eventId];
      return callback(e, response);
    };

    callbackHandler.timedout = setTimeout(() => {
      delete this.state.requestEvents[callbackHandler.eventId];
      var errorMessage = 'api request timed out';
      if (path) errorMessage += ' path: ' + path;
      if (action) errorMessage += ' action: ' + action;
      return callback(new Error(errorMessage));
    }, options.timeout);

    //we add our event handler to a queue, with the embedded timeout
    this.state.requestEvents[eventId] = callbackHandler;
  };

  HappnClient.prototype.__asyncErrorCallback = function (error, callback) {
    if (!callback) {
      throw error;
    }
    setTimeout(function () {
      callback(error);
    }, 0);
  };

  HappnClient.prototype.__performDataRequest = function (path, action, data, options, callback) {
    if (this.status !== STATUS.ACTIVE) {
      var errorMessage = 'client not active';

      if (this.status === STATUS.CONNECT_ERROR) errorMessage = 'client in an error state';
      if (this.status === STATUS.UNINITIALIZED) errorMessage = 'client not initialized yet';
      if (this.status === STATUS.DISCONNECTED) errorMessage = 'client is disconnected';

      var errorDetail = 'action: ' + action + ', path: ' + path;

      var error = new Error(errorMessage);
      error.detail = errorDetail;

      return this.__asyncErrorCallback(error, callback);
    }

    var message = {
      action: action,
      eventId: this.getEventId(),
      path: path,
      data: data,
      sessionId: this.session.id,
    };

    if (!options) options = {};
    else message.options = options; //else skip sending up the options

    if (['set', 'remove'].indexOf(action) >= 0) {
      if (
        options.consistency === CONSTANTS.CONSISTENCY.DEFERRED ||
        options.consistency === CONSTANTS.CONSISTENCY.ACKNOWLEDGED
      )
        this.__attachPublishedAck(options, message);
    }

    if (!options.timeout) options.timeout = this.options.callTimeout;
    if (callback) this.__requestCallback(message, callback, options, message.eventId, path, action); // if null we are firing and forgetting

    this.socket.write(message);
  };

  HappnClient.prototype.__performSystemRequest = function (action, data, options, callback) {
    var message = {
      action: action,
      eventId: this.getEventId(),
    };

    if (data !== undefined) message.data = data;

    if (this.session) message.sessionId = this.session.id;

    if (!options) options = {};
    //skip sending up the options
    else message.options = options;

    if (!options.timeout) options.timeout = this.options.callTimeout; //this is not used on the server side

    this.__requestCallback(message, callback, options, message.eventId); // if null we are firing and forgetting

    this.socket.write(message);
  };

  HappnClient.prototype.getChannel = function (path, action) {
    utils.checkPath(path);
    return '/' + action.toUpperCase() + '@' + path;
  };

  HappnClient.prototype.get = utils.maybePromisify(function (path, parameters, handler) {
    if (typeof parameters === 'function') {
      handler = parameters;
      parameters = {};
    }
    this.__performDataRequest(path, 'get', null, parameters, handler);
  });

  HappnClient.prototype.getCreatedBetween = utils.maybePromisify(function (
    path,
    from,
    to,
    handler
  ) {
    if (typeof handler !== 'function') {
      throw new Error('handler is null or not a function');
    }
    if (isNaN(from)) {
      throw new Error('from is null or not a timestamp');
    }
    if (isNaN(to)) {
      throw new Error('to is null or not a timestamp');
    }
    this.__performDataRequest(
      path,
      'get',
      null,
      {
        criteria: {
          $and: [
            {
              '_meta.created': {
                $gte: from,
              },
            },
            {
              '_meta.created': {
                $lte: to,
              },
            },
          ],
        },
      },
      handler
    );
  });

  HappnClient.prototype.count = utils.maybePromisify(function (path, parameters, handler) {
    if (typeof parameters === 'function') {
      handler = parameters;
      parameters = {};
    }
    this.__performDataRequest(path, 'count', null, parameters, handler);
  });

  HappnClient.prototype.getPaths = utils.maybePromisify(function (path, opts, handler) {
    if (typeof opts === 'function') {
      handler = opts;
      opts = {};
    }

    opts.options = {
      path_only: true,
    };

    this.get(path, opts, handler);
  });

  HappnClient.prototype.increment = utils.maybePromisify(function (
    path,
    gauge,
    increment,
    opts,
    handler
  ) {
    if (typeof opts === 'function') {
      handler = opts;
      opts = {};
    }

    if (typeof increment === 'function') {
      handler = increment;
      increment = gauge;
      gauge = 'counter';
      opts = {};
    }

    if (typeof gauge === 'function') {
      handler = gauge;
      increment = 1;
      gauge = 'counter';
      opts = {};
    }

    if (isNaN(increment)) return handler(new Error('increment must be a number'));

    opts.increment = increment;
    this.set(path, gauge, opts, handler);
  });

  HappnClient.prototype.publish = utils.maybePromisify(function (path, data, options, handler) {
    if (typeof options === 'function') {
      handler = options;
      options = {};
    }

    if (data === null) options.nullValue = true; //carry across the wire

    options.noStore = true;
    options.noDataResponse = true;

    try {
      //in a try/catch to catch checkPath failure
      utils.checkPath(path, 'set');
      this.__performDataRequest(path, 'set', data, options, handler);
    } catch (e) {
      return handler(e);
    }
  });

  HappnClient.prototype.set = utils.maybePromisify(function (path, data, options, handler) {
    if (typeof options === 'function') {
      handler = options;
      options = {};
    }

    if (data === null) options.nullValue = true; //carry across the wire

    try {
      //in a try/catch to catch checkPath failure
      utils.checkPath(path, 'set');
      this.__performDataRequest(path, 'set', data, options, handler);
    } catch (e) {
      return handler(e);
    }
  });

  HappnClient.prototype.remove = utils.maybePromisify(function (path, parameters, handler) {
    if (typeof parameters === 'function') {
      handler = parameters;
      parameters = {};
    }

    return this.__performDataRequest(path, 'remove', null, parameters, handler);
  });

  HappnClient.prototype.__updateListenerRef = function (listener, remoteRef) {
    if (listener.initialEmit || listener.initialCallback)
      this.state.listenerRefs[listener.id] = remoteRef;
    else this.state.listenerRefs[listener.eventKey] = remoteRef;
  };

  HappnClient.prototype.__clearListenerRef = function (listener) {
    if (listener.initialEmit || listener.initialCallback)
      return delete this.state.listenerRefs[listener.id];
    delete this.state.listenerRefs[listener.eventKey];
  };

  HappnClient.prototype.__getListenerRef = function (listener) {
    if (listener.initialEmit || listener.initialCallback)
      return this.state.listenerRefs[listener.id];
    return this.state.listenerRefs[listener.eventKey];
  };

  HappnClient.prototype.__reattachListenersOnPermissionChange = function (permissions) {
    if (!permissions || Object.keys(permissions).length === 0) return;
    let listenerPermPaths = Object.keys(permissions).filter(
      (key) =>
        permissions[key].actions &&
        (permissions[key].actions.includes('*') || permissions[key].actions.includes('on'))
    );
    if (listenerPermPaths.length === 0) return;

    this.state.refCount = this.state.refCount || {};
    let channels = this.__getChannelsFromPaths(listenerPermPaths);
    if (channels && channels.length) {
      this.__resetListenersRefsOnChannels(channels);
      channels.forEach((channel) => {
        this.__reattachListenersOnChannel(channel);
      });
    }
  };

  HappnClient.prototype.__getChannelsFromPaths = function (paths) {
    if (!paths) return;
    let allChannels = Object.keys(this.state.events);
    let channels = paths.reduce(
      (selected, current) =>
        selected.concat(allChannels.filter((channel) => channel.endsWith(current))),
      []
    );
    return channels;
  };

  HappnClient.prototype.__resetListenersRefsOnChannels = function (channels) {
    if (!channels) return;
    channels.forEach((channel) => this.__resetListenerRefs(this.state.events[channel]));
  };

  HappnClient.prototype.__resetListenerRefs = function (listeners) {
    if (!listeners) return;
    listeners.forEach((listener) => (this.state.refCount[listener.eventKey] = 0));
  };

  HappnClient.prototype.__reattachListenersOnChannel = function (channel) {
    let listeners = this.state.events[channel];
    if (listeners && listeners.length) {
      listeners.forEach((listener) => this.__tryReattachListener(listener, channel));
    } else {
      //test channel and clean-up, possibly unnecessary
      this.__testAndCleanupChannel(channel);
    }
  };

  HappnClient.prototype.__tryReattachListener = function (listener, channel) {
    if (!this.state.events[channel]) return this.__clearListenerRef(listener); // We  have deleted this key.
    if (this.state.refCount[listener.eventKey]) {
      //we are already listening on this key
      this.state.refCount[listener.eventKey]++;
      return;
    }
    let parameters = {};
    if (listener.meta) parameters.meta = listener.meta;
    this._offPath(channel, (e) => {
      if (e)
        this.log.warn('failed detaching listener to channel, on re-establishment: ' + channel, e);
      this._remoteOn(channel, parameters, (e, response) => {
        if (e) {
          if ([403, 401].indexOf(e.code) > -1) {
            //permissions may have changed regarding this path
            delete this.state.events[channel];
            return this.__clearListenerRef(listener);
          }
          this.log.warn('failed re-establishing listener to channel: ' + channel, e);
          return this.__clearListenerRef(listener);
        }
        this.state.refCount[listener.eventKey] = 1;
        return this.__updateListenerRef(listener, response.id);
      });
    });
  };

  HappnClient.prototype.__testAndCleanupChannel = function (channel) {
    this._remoteOn(channel, {}, (e, response) => {
      if (e) {
        if ([403, 401].indexOf(e.code) > -1) {
          //permissions may have changed regarding this path
          delete this.state.events[channel];
          return;
        }
        this.log.warn('Error on channel cleanup after permissions change, channel: ' + channel, e);
      } else {
        this._remoteOff(channel, response.id, () => {});
      }
    });
  };

  HappnClient.prototype.__reattachListeners = function (callback) {
    utils.async(
      Object.keys(this.state.events),
      (eventPath, _index, nextEvent) => {
        var listeners = this.state.events[eventPath];
        this.state.refCount = {};

        // re-establish each listener individually to preserve original meta and listener id
        utils.async(
          listeners,
          (listener, _index, nextListener) => {
            if (this.state.refCount[listener.eventKey]) {
              //we are already listening on this key
              this.state.refCount[listener.eventKey]++;
              return nextListener();
            }

            // we don't pass any additional parameters like initialValueEmit and initialValueCallback
            var parameters = {};

            if (listener.meta) parameters.meta = listener.meta;

            this._offPath(eventPath, (e) => {
              if (e)
                return nextListener(
                  new Error(
                    'failed detaching listener to path, on re-establishment: ' + eventPath,
                    e
                  )
                );

              this._remoteOn(eventPath, parameters, (e, response) => {
                if (e) {
                  if ([403, 401].indexOf(e.code) > -1) {
                    //permissions may have changed regarding this path
                    delete this.state.events[eventPath];
                    return nextListener();
                  }
                  return nextListener(
                    new Error('failed re-establishing listener to path: ' + eventPath, e)
                  );
                }

                //update our ref count so we dont subscribe again
                this.state.refCount[listener.eventKey] = 1;
                //create our mapping between the listener id and
                this.__updateListenerRef(listener, response.id);

                nextListener();
              });
            });
          },
          nextEvent
        );
      },
      callback
    );
  };

  HappnClient.prototype.__retryReconnect = function (options, reason, e) {
    this.emit('reconnect-error', {
      reason: reason,
      error: e,
    });
    if (this.status === STATUS.DISCONNECTED) {
      clearTimeout(this.__retryReconnectTimeout);
      return;
    }
    this.__retryReconnectTimeout = setTimeout(() => {
      this.reconnect.call(this, options);
    }, 3000);
  };

  HappnClient.prototype.reconnect = function (options) {
    this.status = STATUS.RECONNECT_ACTIVE;
    this.emit('reconnect', options);
    this.authenticate((e) => {
      if (e) {
        this.handle_error(e);
        return this.__retryReconnect(options, 'authentication-failed', e);
      }
      //we are authenticated and ready for data requests
      this.status = STATUS.ACTIVE;
      this.__reattachListeners((e) => {
        if (e) {
          this.handle_error(e);
          return this.__retryReconnect(options, 'reattach-listeners-failed', e);
        }
        this.emit('reconnect-successful', options);
      });
    });
  };

  HappnClient.prototype.handle_error = function (err) {
    var errLog = {
      timestamp: Date.now(),
      error: err,
    };

    if (this.state.errors.length === 100) this.state.errors.shift();
    this.state.errors.push(errLog);

    this.emit('error', err);
    this.log.error('unhandled error', err);
  };

  HappnClient.prototype.__attachPublishedAck = function (options, message) {
    if (typeof options.onPublished !== 'function')
      throw new Error('onPublished handler in options is missing');

    const publishedTimeout = options.onPublishedTimeout || 60000; //default is one minute
    const ackHandler = {
      id: message.sessionId + '-' + message.eventId,
      onPublished: options.onPublished,

      handle: (e, results) => {
        clearTimeout(ackHandler.timeout);
        delete this.state.ackHandlers[ackHandler.id];
        ackHandler.onPublished(e, results);
      },
      timedout: function () {
        ackHandler.handle(new Error('publish timed out'));
      },
    };

    ackHandler.timeout = setTimeout(ackHandler.timedout, publishedTimeout);
    this.state.ackHandlers[ackHandler.id] = ackHandler;
  };

  HappnClient.prototype.handle_ack = function (message) {
    if (this.state.ackHandlers[message.id]) {
      if (message.status === 'error')
        return this.state.ackHandlers[message.id].handle(new Error(message.error), message.result);
      this.state.ackHandlers[message.id].handle(null, message.result);
    }
  };

  HappnClient.prototype.handle_publication = function (message) {
    if (message._meta && message._meta.type === 'data')
      return this.handle_data(message._meta.channel, message);

    if (message._meta && message._meta.type === 'system')
      return this.__handleSystemMessage(message);

    if (message._meta && message._meta.type === 'ack') return this.handle_ack(message);

    if (Array.isArray(message)) return this.handle_response_array(null, message, message.pop());

    if (message._meta.status === 'error') {
      var error = message._meta.error;
      var e = new Error();
      e.name = error.name || error.message || error;
      Object.keys(error).forEach(function (key) {
        if (!e[key]) e[key] = error[key];
      });
      return this.handle_response(e, message);
    }

    var decoded;
    if (message.data) {
      var meta = message._meta;
      if (Array.isArray(message.data)) decoded = message.data.slice();
      else decoded = Object.assign({}, message.data);
      decoded._meta = meta;
    } else decoded = message;

    if (message.data === null) decoded._meta.nullData = true;
    this.handle_response(null, decoded);
  };

  HappnClient.prototype.handle_response_array = function (e, response, meta) {
    var responseHandler = this.state.requestEvents[meta.eventId];
    if (responseHandler) responseHandler.handleResponse(e, response);
  };

  HappnClient.prototype.handle_response = function (e, response) {
    var responseHandler = this.state.requestEvents[response._meta.eventId];
    if (responseHandler) {
      if (response._meta.nullData) return responseHandler.handleResponse(e, null);
      responseHandler.handleResponse(e, response);
    }
  };

  HappnClient.prototype.__acknowledge = function (message, callback) {
    if (message._meta.consistency !== CONSTANTS.CONSISTENCY.ACKNOWLEDGED) return callback(message);

    this.__performDataRequest(message.path, 'ack', message._meta.publicationId, null, function (e) {
      if (e) {
        message._meta.acknowledged = false;
        message._meta.acknowledgedError = e;
      } else message._meta.acknowledged = true;

      callback(message);
    });
  };

  HappnClient.prototype.delegate_handover = function (data, meta, delegate) {
    if (delegate.variableDepth && delegate.depth < meta.depth) return;
    delegate.runcount++;
    if (delegate.count > 0 && delegate.runcount > delegate.count) return;
    //swallow any successive publicatiions
    if (delegate.count === delegate.runcount) {
      var _this = this;
      return _this._offListener(delegate.id, function (e) {
        if (e) return _this.handle_error(e);
        delegate.handler.call(_this, JSON.parse(data), meta);
      });
    }

    delegate.handler.call(this, JSON.parse(data), meta);
  };

  HappnClient.prototype.handle_data = function (path, message) {
    this.__acknowledge(message, (acknowledged) => {
      if (!this.state.events[path]) return;

      if (acknowledged._meta.acknowledgedError)
        this.log.wa(rn
          'acknowledgement failure: ',
          acknowledged._meta.acknowledgedError.toString(),
          acknowledged._meta.acknowledgedError
        );

      var intermediateData = JSON.stringify(acknowledged.data);

      let doHandover = (delegate) => {
        this.delegate_handover(intermediateData, acknowledged._meta, delegate);
      };
      //slice necessary so order is not messed with for count based subscriptions
      this.state.events[path].slice().forEach(doHandover);
    });
  };

  HappnClient.prototype.__clearSubscriptionsOnPath = function (eventListenerPath) {
    var listeners = this.state.events[eventListenerPath];
    listeners.forEach((listener) => {
      this.__clearListenerState(eventListenerPath, listener);
    });
  };

  HappnClient.prototype.__clearSecurityDirectorySubscriptions = function (path) {
    Object.keys(this.state.events).forEach((eventListenerPath) => {
      if (path === eventListenerPath.substring(eventListenerPath.indexOf('@') + 1)) {
        this.__clearSubscriptionsOnPath(eventListenerPath);
      }
    });
  };

  HappnClient.prototype.__updateSecurityDirectory = function (message) {
    if (message.data.whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.PERMISSION_REMOVED) {
      if (['*', 'on'].indexOf(message.data.changedData.action) > -1) {
        let permissions = {};
        permissions[message.data.changedData.path] = {
          actions: [message.data.changedData.action],
        };
        return this.__reattachListenersOnPermissionChange(permissions);
      }
    }

    if (message.data.whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_GROUP) {
      Object.keys(message.data.changedData.permissions).forEach((permissionPath) => {
        let permission = message.data.changedData.permissions[permissionPath];
        if (
          permission.prohibit &&
          (permission.prohibit.indexOf('on') > -1 || permission.prohibit.indexOf('*') > -1)
        ) {
          return this.__clearSecurityDirectorySubscriptions(permissionPath);
        }

        if (
          permission.remove &&
          (permission.actions.indexOf('on') > -1 || permission.actions.indexOf('*') > -1)
        ) {
          let permissions = {};
          permissions[permissionPath] = permission;
          return this.__reattachListenersOnPermissionChange(permissions);
        }
      });
    }

    if (message.data.whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.UNLINK_GROUP) {
      return this.__reattachListenersOnPermissionChange(message.data.changedData.permissions);
    }

    if (
      message.data.whatHappnd === CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_USER &&
      message.data.changedData.permissions //backward compatible older servers that dont have user permissions
    ) {
      Object.keys(message.data.changedData.permissions).forEach((permissionPath) => {
        var permission = message.data.changedData.permissions[permissionPath];
        if (
          permission.prohibit &&
          (permission.prohibit.indexOf('on') > -1 || permission.prohibit.indexOf('*') > -1)
        ) {
          return this.__clearSecurityDirectorySubscriptions(permissionPath);
        }
        if (
          permission.remove &&
          (permission.actions.indexOf('on') > -1 || permission.actions.indexOf('*') > -1)
        ) {
          let permissions = {};
          permissions[permissionPath] = permission;
          return this.__reattachListenersOnPermissionChange(permissions);
        }
      });
    }
  };

  HappnClient.prototype.__handleServerSideDisconnect = function (message) {
    this.emit('session-ended', message.data);
  };

  HappnClient.prototype.__handleSystemMessage = function (message) {
    if (message.eventKey === 'server-side-disconnect') {
      this.status = STATUS.DISCONNECTED;
      this.__handleServerSideDisconnect(message);
    }
    if (message.eventKey === 'security-data-changed') this.__updateSecurityDirectory(message);

    this.state.systemMessageHandlers.every(function (messageHandler) {
      return messageHandler.apply(messageHandler, [message.eventKey, message.data]);
    });
  };

  HappnClient.prototype.offSystemMessage = function (index) {
    this.state.systemMessageHandlers.splice(index, 1);
  };

  HappnClient.prototype.onSystemMessage = function (handler) {
    this.state.systemMessageHandlers.push(handler);
    return this.state.systemMessageHandlers.length - 1;
  };

  HappnClient.prototype._remoteOn = function (path, parameters, callback) {
    this.__performDataRequest(path, 'on', null, parameters, callback);
  };

  HappnClient.prototype.__clearListenerState = function (path, listener) {
    this.state.events[path].splice(this.state.events[path].indexOf(listener), 1);
    if (this.state.events[path].length === 0) delete this.state.events[path];
    this.state.refCount[listener.eventKey]--;
    if (this.state.refCount[listener.eventKey] === 0) delete this.state.refCount[listener.eventKey];
    this.__clearListenerRef(listener);
  };

  HappnClient.prototype.__confirmRemoteOn = function (path, parameters, listener, callback) {
    this._remoteOn(path, parameters, (e, response) => {
      if (e || response.status === 'error') {
        this.__clearListenerState(path, listener);
        //TODO: do we want to return something that is not an error (response.payload)
        if (response && response.status === 'error') return callback(response.payload);
        return callback(e);
      }

      if (listener.initialEmit) {
        //emit data as events immediately
        response.forEach(function (message) {
          listener.handler(message);
        });
        this.__updateListenerRef(listener, response._meta.referenceId);
      } else if (listener.initialCallback) {
        //emit the data in the callback
        this.__updateListenerRef(listener, response._meta.referenceId);
      } else {
        this.__updateListenerRef(listener, response.id);
      }

      if (parameters.onPublished) return callback(null, listener.id);
      if (listener.initialCallback) return callback(null, listener.id, response);

      callback(null, listener.id);
    });
  };

  HappnClient.prototype.__getListener = function (handler, parameters, path, variableDepth) {
    return {
      handler: handler,
      count: parameters.count,
      eventKey: JSON.stringify({
        path: path,
        event_type: parameters.event_type,
        count: parameters.count,
        initialEmit: parameters.initialEmit,
        initialCallback: parameters.initialCallback,
        meta: parameters.meta,
        depth: parameters.depth,
      }),
      runcount: 0,
      meta: parameters.meta,
      id: this.state.currentListenerId++,
      initialEmit: parameters.initialEmit,
      initialCallback: parameters.initialCallback,
      depth: parameters.depth,
      variableDepth: variableDepth,
    };
  };

  HappnClient.prototype.once = utils.promisify(function (path, parameters, handler, callback) {
    if (typeof parameters === 'function') {
      callback = handler;
      handler = parameters;
      parameters = {};
    }
    parameters.count = 1;
    return this.on(path, parameters, handler, callback);
  });

  HappnClient.prototype.on = utils.promisify(function (path, parameters, handler, callback) {
    if (typeof parameters === 'function') {
      callback = handler;
      handler = parameters;
      parameters = {};
    }

    if (!parameters) parameters = {};
    if (!parameters.event_type || parameters.event_type === '*') parameters.event_type = 'all';
    if (!parameters.count) parameters.count = 0;

    if (!callback) {
      if (typeof parameters.onPublished !== 'function')
        throw new Error('you cannot subscribe without passing in a subscription callback');
      if (typeof handler !== 'function')
        throw new Error('callback cannot be null when using the onPublished event handler');
      callback = handler;
      handler = parameters.onPublished;
    }

    if (typeof path !== 'string') {
      return callback(new Error(`Bad path [${path}], must be a string`));
    }

    let variableDepth =
      typeof path === 'string' && (path === '**' || path.substring(path.length - 3) === '/**');
    if (variableDepth && !parameters.depth) parameters.depth = this.options.defaultVariableDepth; //5 by default

    path = this.getChannel(path, parameters.event_type);
    var listener = this.__getListener(handler, parameters, path, variableDepth);

    if (!this.state.events[path]) this.state.events[path] = [];
    if (!this.state.refCount[listener.eventKey]) this.state.refCount[listener.eventKey] = 0;
    this.state.events[path].push(listener);
    this.state.refCount[listener.eventKey]++;
    if (
      !(
        this.state.refCount[listener.eventKey] === 1 ||
        listener.initialCallback ||
        listener.initialEmit
      )
    ) {
      return callback(null, listener.id);
    }
    this.__confirmRemoteOn(path, parameters, listener, callback);
  });

  HappnClient.prototype.onAll = utils.promisify(function (handler, callback) {
    return this.on('*', {}, handler, callback);
  });

  HappnClient.prototype._remoteOff = function (channel, listenerRef, callback) {
    if (typeof listenerRef === 'function') {
      callback = listenerRef;
      listenerRef = 0;
    }

    this.__performDataRequest(
      channel,
      'off',
      null,
      {
        referenceId: listenerRef,
      },
      function (e, response) {
        if (e) return callback(e);
        if (response.status === 'error') return callback(response.payload);
        callback();
      }
    );
  };

  HappnClient.prototype._offListener = function (handle, callback) {
    if (!this.state.events || this.state.events.length === 0) return callback();
    let listenerFound = false;
    Object.keys(this.state.events).every((channel) => {
      let listeners = this.state.events[channel];
      //use every here so we can exit early
      return listeners.every((listener) => {
        if (listener.id !== handle) return true;
        listenerFound = true;
        var listenerRef = this.__getListenerRef(listener);
        this.__clearListenerState(channel, listener);

        //now unsubscribe if we are off
        if (
          !this.state.refCount[listener.eventKey] ||
          listener.initialEmit ||
          listener.initialCallback
        ) {
          this._remoteOff(channel, listenerRef, callback);
        } else callback();

        return false;
      });
    });
    //in case a listener with that index does not exist
    if (!listenerFound) return callback();
  };

  HappnClient.prototype._offPath = function (path, callback) {
    var unsubscriptions = [];
    var channels = [];

    Object.keys(this.state.events).forEach((channel) => {
      var channelParts = channel.split('@');
      var channelPath = channelParts.slice(1, channelParts.length).join('@');

      if (utils.wildcardMatch(path, channelPath)) {
        channels.push(channel);
        this.state.events[channel].forEach(function (listener) {
          unsubscriptions.push(listener);
        });
      }
    });

    if (unsubscriptions.length === 0) return callback();

    utils.async(
      unsubscriptions,
      (listener, _index, next) => {
        this._offListener(listener.id, next);
      },
      (e) => {
        if (e) return callback(e);
        channels.forEach((channel) => {
          delete this.state.events[channel];
        });
        callback();
      }
    );
  };

  HappnClient.prototype.__initializeEventState = function () {
    this.state.events = {};
    this.state.refCount = {};
    this.state.listenerRefs = {};
  };

  HappnClient.prototype.offAll = utils.promisify(function (callback) {
    return this._remoteOff('*', (e) => {
      if (e) return callback(e);
      this.__initializeEventState();
      callback();
    });
  });

  HappnClient.prototype.off = utils.maybePromisify(function (handle, callback) {
    if (handle == null) return callback(new Error('handle cannot be null'));
    if (typeof handle !== 'number') return callback(new Error('handle must be a number'));
    this._offListener(handle, callback);
  });

  HappnClient.prototype.offPath = utils.maybePromisify(function (path, callback) {
    if (typeof path === 'function') {
      callback = path;
      path = '*';
    }

    return this._offPath(path, callback);
  });

  HappnClient.prototype.clearTimeouts = function () {
    clearTimeout(this.__retryReconnectTimeout);
    Object.keys(this.state.ackHandlers).forEach((handlerKey) => {
      clearTimeout(this.state.ackHandlers[handlerKey].timedout);
    });
    Object.keys(this.state.requestEvents).forEach((handlerKey) => {
      clearTimeout(this.state.requestEvents[handlerKey].timedout);
    });
  };

  HappnClient.prototype.revokeToken = function (callback) {
    return this.__performSystemRequest('revoke-token', null, null, callback);
  };

  HappnClient.prototype.__destroySocket = function (socket, callback) {
    //possible socket end needs to do its thing, we destroy in the next tick
    setTimeout(() => {
      var destroyError;
      try {
        socket.destroy();
      } catch (e) {
        this.log.warn('socket.destroy failed in client: ' + e.toString());
        destroyError = e;
      }
      callback(destroyError);
    }, 0);
  };

  HappnClient.prototype.__endAndDestroySocket = function (socket, callback) {
    if (socket._local) {
      //this is an eventemitter connection
      setTimeout(() => {
        socket.end();
        callback();
      }, 0);
      return;
    }
    if (socket.readyState !== 1) {
      //socket is already disconnecting or disconnected, close event wont be fired
      socket.end();
      return this.__destroySocket(socket, callback);
    }
    //socket is currently open, close event will be fired
    socket
      .once('close', () => {
        this.__destroySocket(socket, callback);
      })
      .end();
  };

  HappnClient.prototype.__cookieCleanup = function (sessionDocument) {
    this.__expireCookie(this.session, sessionDocument);
  };

  HappnClient.prototype.__connectionCleanup = function (options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }

    if (!this.socket) {
      return callback();
    }

    if (!options) options = {};
    if (browser) {
      if (options.deleteCookie) {
        this.__cookieCleanup(document);
      }
    }

    if (options.revokeToken || options.revokeSession)
      return this.revokeToken((e) => {
        if (e) {
          this.log.warn(
            '__connectionCleanup failed in client, revoke-token failed: ' + e.toString()
          );
        }
        this.__endAndDestroySocket(this.socket, callback);
      });

    if (options.disconnectChildSessions) {
      return this.__performSystemRequest('disconnect-child-sessions', null, null, (e) => {
        if (e) {
          this.log.warn(
            '__connectionCleanup failed in client, disconnect-child-sessions failed: ' +
              e.toString()
          );
        }
        this.__endAndDestroySocket(this.socket, callback);
      });
    }
    this.__endAndDestroySocket(this.socket, callback);
  };

  HappnClient.prototype.disconnect = utils.maybePromisify(function (options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }

    if (!options) options = {};
    if (!callback) callback = function () {};

    this.clearTimeouts();
    this.__connectionCleanup(options, (e) => {
      if (e) return callback(e);
      this.socket = null;
      this.state.systemMessageHandlers = [];
      this.state.eventHandlers = {};
      this.__initializeEventState();
      this.status = STATUS.DISCONNECTED;
      callback();
    });
  });
})(); // end enclosed
