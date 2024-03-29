/**
 * Created by Johan on 4/14/2015.
 */

// process.env.NO_EXIT_ON_UNCAUGHT (not recommended
//                                  - unless your boot-time is v/long and your confidence is v/high
//                                  - it logs error, beware log spew
//                                  TODO: log repeated message "collapse" (by context, by level?)
//                                 )
// process.env.NO_EXIT_ON_SIGTERM
// process.env.STOP_ON_SIGINT (just stops components and disconnects network, no exit) <--- functionality pending
// process.env.START_AS_ROOTED (exposes all mesh nodes in process at global.$happner)
// process.env.UNROOT_ON_REPL (removes $happner from global and attaches it to repl server context during startup)
// process.env.SKIP_AUTO_LOAD (don't perform auto loading from happner.js)

var root = {
  nodes: {},
  utils: {},
  processEventHandlersToRemove: {},
};

var depWarned0 = false; // mesh.api
var depWarned1 = false; // componentConfig.meshName
var depWarned2 = false; // componentConfig.setOptions
var depWarned3 = false; // module.directory
var depWarned4 = false; // Happner.start()

if (process.env.START_AS_ROOTED) global.$happner = root;

var Internals = require('./system/shared/internals'),
  commons = require('happn-commons'),
  MeshClient = require('./system/shared/mesh-client'),
  Happn = require('happn-3'),
  DataLayer = require('./system/happn'),
  Config = require('./system/config'),
  async = commons.async,
  MeshError = require('./system/shared/mesh-error'),
  ComponentInstance = require('./system/component-instance'),
  path = require('path'),
  repl = require('./system/repl'),
  Packager = require('./system/packager'),
  utilities = require('./system/utilities'),
  Logger = require('happn-logger'),
  EventEmitter = require('events').EventEmitter,
  util = require('util'),
  _ = commons._;

module.exports = Mesh;
module.exports.Happn = Happn.service;
module.exports.MeshClient = MeshClient;

Object.defineProperty(module.exports, 'AssignedHappnServer', {
  // switched out in happner-cluster to assign happn-cluster as datalayer
  value: Happn.service,
  enumerable: false,
  writable: true,
});

var _meshEvents = new EventEmitter();

var __emit = function (key, data) {
  _meshEvents.emit(key, data);
};

module.exports.on = function (key, handler) {
  return _meshEvents.on(key, handler);
};

module.exports.off = function (key, handler) {
  return _meshEvents.removeListener(key, handler);
};

Logger.emitter.on(
  'before',
  function (level, message, stack) {
    __emit('mesh-log', { level: level, message: message, stack: stack });
  }.bind(this)
);

// Quick start.
module.exports.create = util.promisify(function MeshFactory(config, callback) {
  // node -e 'require("happner-2").create()'
  if (typeof config === 'function') {
    callback = config;
    config = {};
  }

  config = config || {};
  callback =
    callback ||
    function (err) {
      if (err) {
        //eslint-disable-next-line
        console.error(err.stack);
        process.exit(err.errno || 1);
      }
    };

  // node -e 'require("happner").create(9999)'
  if (typeof config === 'number')
    config = {
      happn: {
        port: config,
      },
    };

  // node -e 'require("happner").create("5.6.7.88:7654")'
  if (typeof config === 'string') {
    var parts = config.split(':');
    config = {
      happn: {},
    };
    config.happn.host = parts[0];
    if (parts[1]) config.happn.port = parseInt(parts[1]);
  }
  const tryStopMesh = function (mesh) {
    delete root.nodes[mesh?._mesh?.config?.name];
    return new Promise((resolve) => {
      if (!mesh) return resolve();
      mesh
        .stop()
        .then(resolve)
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn(`tried stopping mesh on failed initialization: ${e.message}`);
          resolve();
        });
    });
  };
  new Mesh().initialize(config, function (err, mesh) {
    if (err) {
      tryStopMesh(mesh).then(() => {
        callback(err, mesh);
      });
      return;
    }
    return mesh.start(function (err, mesh) {
      if (err) {
        tryStopMesh(mesh).then(() => {
          callback(err, mesh);
        });
        return;
      }
      callback(null, mesh);
    });
  });
});

Object.defineProperty(module.exports, 'start', {
  get: function () {
    if (!depWarned4) {
      depWarned4 = true;
      //eslint-disable-next-line
      console.warn('\n[ WARN] Happner.start() is deprecated, use Happner.create().\n');
    }
    return module.exports.create;
  },
});

var __protectedMesh = function (config, meshContext) {
  return {
    // (all false) - runlevel 0
    initializing: false, // true         - runlevel 10
    initialized: false, // true          - runlevel 20
    starting: false, // true           - runlevel 30
    started: false, // true            - runlevel 40
    stopped: false, // true            - runlevel 00
    config: config || {},

    elements: {},

    description: {},
    endpoints: {},
    exchange: {},
    happn: {},

    // Selected internal functions available to _mesh.
    _createElement: function (spec, writeSchema, callback) {
      meshContext._createElement(spec, writeSchema, callback);
    },

    _destroyElement: function (componentName, callback) {
      meshContext._destroyElement(componentName, callback);
    },

    _updateElement: function (spec, callback) {
      meshContext._updateElement(spec, callback);
    },
    on: meshContext.on,
    off: meshContext.off,

    // TODO: add access to start() and stop()
  };
};

function Mesh(config) {
  var _this = this;

  // _mesh
  // -----
  //
  // if   meshConfig: { components: { 'componentName': { accessLevel: 'mesh', ...
  // then $happn._mesh is available in component

  _this.__events = new EventEmitter();

  _this.on = function (key, handler) {
    return this.__events.on(key, handler);
  }.bind(_this);

  _this.removeListener = function (key, handler) {
    return this.__events.removeListener(key, handler);
  }.bind(_this);

  _this.emit = function (key, value) {
    return this.__events.emit(key, value);
  }.bind(_this);

  this._mesh = __protectedMesh(config, _this);

  this._stats = {
    proc: {
      up: Date.now(),
    },
    component: {},
  };

  // used by packager.js & modules/api
  Object.defineProperty(this, 'tools', {
    value: {},
  });

  Object.defineProperty(this, 'runlevel', {
    get: function () {
      if (_this._mesh.stopped) return 0;

      if (_this._mesh.started) return 40;
      if (_this._mesh.starting) return 30;
      if (_this._mesh.initialized) return 20;
      if (_this._mesh.initializing) return 10;
      return 0;
    },
    // set: function(n) {
    //
    // },
    enumerable: true,
  });

  // eslint-disable-next-line no-self-assign
  this.initialize = this.initialize; // make function visible in repl (console)
  // eslint-disable-next-line no-self-assign
  this.start = this.start;
  // eslint-disable-next-line no-self-assign
  this.stop = this.stop;
  // eslint-disable-next-line no-self-assign
  this.describe = this.describe;
  // eslint-disable-next-line no-self-assign
  this.test = this.test;

  this.plugins = [];

  Object.defineProperty(this, 'api', {
    get: function () {
      if (depWarned0) return _this;
      _this.log.warn('Use of mesh.api.* is deprecated. Use mesh.*');
      try {
        _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
      } catch (e) {
        //do nothing
      }
      depWarned0 = true;
      return _this;
    },
  });
}

Mesh.unsubscribeFromProcessEvents = function (meshInstance, logStopEvent) {
  try {
    //pop unsubscription events on to the removal list
    root.processEventHandlersToRemove[meshInstance._mesh.config.name] = {
      __onUncaughtException: meshInstance.__onUncaughtException,
      __onExit: meshInstance.__onExit,
      onSIGTERM: meshInstance.onSIGTERM,
      onSIGINT: meshInstance.onSIGINT,
    };

    //wait until everyone has been removed from root.nodes if we have other pmeshes attached to root
    if (Object.keys(root.nodes).length > 0)
      return logStopEvent(
        'info',
        'not unsubscribing from process events, root contains nodes: ' +
          Object.keys(root.nodes).join(',') +
          ' queued handlers for unsubscription'
      );

    Object.keys(root.processEventHandlersToRemove).forEach(function (meshName) {
      if (root.processEventHandlersToRemove[meshName].__onUncaughtException)
        process.removeListener(
          'uncaughtException',
          root.processEventHandlersToRemove[meshName].__onUncaughtException
        );
      if (root.processEventHandlersToRemove[meshName].__onExit)
        process.removeListener('exit', root.processEventHandlersToRemove[meshName].__onExit);
      if (root.processEventHandlersToRemove[meshName].onSIGTERM)
        process.removeListener('SIGTERM', root.processEventHandlersToRemove[meshName].onSIGTERM);
      if (root.processEventHandlersToRemove[meshName].onSIGINT)
        process.removeListener('SIGINT', root.processEventHandlersToRemove[meshName].onSIGINT);
      delete root.processEventHandlersToRemove[meshName];
    });

    logStopEvent('$$DEBUG', 'unsubscribed from process events');
  } catch (e) {
    logStopEvent('error', 'failed to unsubscribe from process events', e);
    //do nothing
  }
};

// Step1 of two step start with mandatory args (initialize(function Callback(){ start() }))
Mesh.prototype.__initialize = function (config, callback) {
  // TODO: this function is +- 250 lines... (hmmmm)

  var _this = this;

  //so we can redefine properties without failure
  if (_this._mesh.stopped) {
    _this.log.warn('reinitializing previous mesh');
    Internals = require('./system/shared/internals');
    _this._mesh = __protectedMesh(config, _this);
  }

  _this.startupProgress = function (log, progress) {
    __emit('startup-progress', { log: log, progress: progress });
  };

  _this._mesh.initialized = false;
  _this._mesh.initializing = true;

  //util.inherits(this._mesh, EventEmitter);

  _this._mesh.caller = _this.getCallerTo('mesh.js');

  if (typeof config === 'function') {
    callback = config;
    config = _this._mesh.config; // assume config came on constructor
  } else if (!config) {
    config = _this._mesh.config; // again
  } else _this._mesh.config = config;

  Object.defineProperty(_this, 'version', {
    value: require(__dirname + '/../package.json').version,
    enumerable: true,
  });

  // First mesh in process configures logger (unless overridden)
  if (config?.util?.overrideLoggerConfiguration || !Logger.configured) {
    Logger.configure(config?.util);
  }

  _this.log = Logger.createLogger('Mesh');
  _this.log.context = config.name;
  _this.startupProgress('initializing config...', 10);

  _this._mesh.ignoreDependenciesOnStartup = config.ignoreDependenciesOnStartup || false;
  var configer = new Config();

  // Async config step for (ask what i should do)ness <--- functionality pending
  configer.process(_this, config, function (e, instanceConfig) {
    if (e) return callback(e);

    _this._mesh.config = instanceConfig;

    _this.startupProgress('configured mesh', 15);

    _this.startupProgress('initializing data layer...', 20);

    //we first need the happn up, with a name
    _this._initializeDataLayer(instanceConfig, function (e) {
      if (e) return callback(e);

      _this.startupProgress('initialized data layer', 50);

      root.nodes[instanceConfig.name] = _this;

      _this._mesh.config.domain = _this._mesh.config.domain || _this._mesh.config.name;

      _this.log.createLogger('Mesh', _this.log);
      _this.log.$$TRACE('initialize');

      if (!instanceConfig.home) {
        instanceConfig.home =
          instanceConfig.home || _this._mesh.caller.file
            ? path.dirname(_this._mesh.caller.file)
            : null;
      }

      if (!instanceConfig.home) {
        _this.log.warn('home unknown, require() might struggle');
      } else {
        _this.log.debug('home %s', instanceConfig.home);
      }

      // Need to add the caller's module path as first for module searches.
      _this.updateSearchPath(instanceConfig.home);

      _this.log.debug('happner v%s', _this.version);
      _this.log.debug('config v%s', instanceConfig.version || '..');
      _this.log.debug("localnode '%s' at pid %d", instanceConfig.name, process.pid);

      Object.defineProperty(_this._mesh, 'log', {
        value: _this.log,
      });

      if (process.env.START_AS_ROOTED && !instanceConfig.repl) {
        instanceConfig.repl = {
          socket: '/tmp/socket.' + config.name,
        };
      }

      _this.exchange = {};
      _this.event = {};
      _this.localEvent = Internals._decoupleEventAPILayer({});

      repl.create(_this);
      _this.startupProgress('created repl', 60);

      var stopmesh = function (mesh, last) {
        if (!mesh._mesh.initialized) process.exit(0);
        mesh.stop({ exitCode: 0, kill: last }, function (e) {
          mesh._mesh.initialized = false;
          if (e) mesh.log.warn('error during stop', e);
        });
      };

      var pausemesh = function (mesh) {
        mesh.stop(function (e) {
          mesh._mesh.initialized = false;
          if (e) mesh.log.warn('error during stop', e);
        });
      };

      _this.__onUncaughtException = function (err) {
        if (process.env.NO_EXIT_ON_UNCAUGHT) {
          _this.log.error('UNCAUGHT EXCEPTION', err);
          return;
        }
        _this.log.fatal('uncaughtException (or set NO_EXIT_ON_UNCAUGHT)', err);
        process.exit(1);
      };

      _this.__onExit = function (code) {
        Object.keys(root.nodes).forEach(function (name) {
          if (!root.nodes[name]._mesh.stopped) root.nodes[name].stop();
          root.nodes[name].log.debug('exit %s', code);
        });
      };

      _this.onSIGTERM = function () {
        if (process.env.NO_EXIT_ON_SIGTERM) {
          _this.log.warn('SIGTERM ignored');
          return;
        }
        var last = 0;
        Object.keys(root.nodes).forEach(function (name) {
          last++;
          root.nodes[name].log.warn('SIGTERM');
          stopmesh(root.nodes[name], last === Object.keys(root.nodes).length);
        });
      };

      _this.onSIGINT = function () {
        if (process.env.STOP_ON_SIGINT) {
          Object.keys(root.nodes).forEach(function (name) {
            root.nodes[name].log.warn('SIGINT without exit');
            pausemesh(root.nodes[name]);
          });
          return;
        }
        var last = 0;
        Object.keys(root.nodes).forEach(function (name) {
          last++;
          root.nodes[name].log.warn('SIGINT');
          stopmesh(root.nodes[name], last === Object.keys(root.nodes).length);
        });
      };

      if (Object.keys(root.nodes).length === 1) {
        // only one listener for each below
        // no matter how many mesh nodes in process
        process.on('uncaughtException', _this.__onUncaughtException);
        process.on('exit', _this.__onExit);
        process.on('SIGTERM', _this.onSIGTERM);
        process.on('SIGINT', _this.onSIGINT);
      }

      if (!instanceConfig.modules) instanceConfig.modules = {};
      if (!instanceConfig.components) instanceConfig.components = {};

      // autoload can be set to false (to disable) or alternative instanceConfigname to load
      if (typeof instanceConfig.autoload === 'undefined') instanceConfig.autoload = 'autoload';
      if (typeof instanceConfig.autoload === 'boolean') {
        if (instanceConfig.autoload) {
          instanceConfig.autoload = 'autoload';
        }
      }

      _this.attachSystemComponents(instanceConfig);
      _this.startupProgress('attached system components', 65);
      _this.initializedServer = false;

      async.series(
        [
          function (callback) {
            if (!instanceConfig.autoload || process.env.SKIP_AUTO_LOAD) {
              return callback();
            }
            _this.getPackagedModules(instanceConfig, callback);
          },
          function (callback) {
            _this.startupProgress('got packaged modules', 70);
            if (!instanceConfig.autoload || process.env.SKIP_AUTO_LOAD) {
              return callback();
            }
            _this.log.$$TRACE('searched for autoload');
            _this.loadPackagedModules(instanceConfig, null, callback);
          },
          function (callback) {
            _this.startupProgress('got autoload modules', 75);
            if (!instanceConfig.autoload || !process.env.SKIP_AUTO_LOAD) {
              _this.log.$$TRACE('initialized autoload');
            }
            _this._loadComponentSuites(instanceConfig, callback);
          },
          function (callback) {
            _this.startupProgress('loaded component suites', 77);
            _this.log.$$TRACE('loaded component suites');
            _this._registerInitialSchema(instanceConfig, callback);
          },
          function (callback) {
            _this.startupProgress('registered initial schema', 80);
            _this.log.$$TRACE('registered initial schema');
            _this._initializePackager(callback);
          },
          function (callback) {
            _this.log.$$TRACE('initialized packager');
            _this.startupProgress('initialized packager', 82);
            var isServer = true;
            var describe = {};
            Internals._initializeLocal(_this, describe, instanceConfig, isServer, callback);
          },
          function (callback) {
            _this.initializedServer = true;
            _this.startupProgress('initialized local', 84);
            _this.log.$$TRACE('initialized local');
            _this._initializeGlobalMiddleware(callback);
          },
          function (callback) {
            _this.startupProgress('initialized global middleware', 86);
            _this.log.$$TRACE('initialized global middleware');
            _this._initializeRootWebRoutes(callback);
          },
          function (callback) {
            _this.startupProgress('initialized root web routes', 87);
            _this.log.$$TRACE('initialized root web routes');
            _this._initializeElements(instanceConfig, callback);
          },
          function (callback) {
            _this.startupProgress('initialized elements', 88);
            _this.log.$$TRACE('initialized elements');
            _this._startPlugins(instanceConfig, callback);
          },
          function (callback) {
            _this.startupProgress('initialized plugins', 90);
            _this.log.$$TRACE('initialized plugins');
            _this._registerSchema(instanceConfig, true, callback);
          },
          function (callback) {
            _this.startupProgress('registered schema', 95);
            _this.log.$$TRACE('registered schema');
            _this._initializeEndpoints(callback);
          },
          function (callback) {
            _this.log.$$TRACE('initialized endpoints');
            // TODO: This point is never reached if any of the endpoints are hung before writing their description
            callback();
          },
        ],
        function (e) {
          if (e) {
            //stop the http server if it was initialized
            _this.log.error('failure starting up', e);
            return _this.stop(function () {
              _this.initializedServer = false;
              callback(e, _this);
            });
          }
          _this.log.debug('initialized!');
          _this._mesh.initialized = true;
          _this._mesh.initializing = false;
          callback(e, _this);
        }
      );
    });
  });
};

Mesh.prototype.initialize = util.promisify(function (config, callback) {
  var _this = this;

  // if (config.deferListen) {
  //   if (!config.happn)
  //     config.happn = {};
  //   config.happn.deferListen = true;
  // }
  //
  // Always defer listen until last step in Mesh.start(),
  // this allows components to run their start methods and be ready before listen.
  //
  // Note: if config.deferListen is set then Mesh.start() will still not listen.

  config.happn = config.happn || {};
  config.happn.deferListen = true;

  // special case for when listen must be done before modules start

  if (config.listenFirst) {
    config.happn.deferListen = false;
    config.deferListen = false;
  }

  _this.__initialize(config, callback);
});

// Step2 of two step start (initialize({},function callback(){ start() }))
Mesh.prototype.start = util.promisify(function (callback) {
  var _this = this;
  //eslint-disable-next-line
  if (!_this._mesh.initialized) return console.warn('missing initialize()');

  _this._mesh.starting = true;
  _this._mesh.started = false;
  _this._mesh.componentsInitialized = false;
  _this._mesh.stopped = false;

  _this.startupProgress('starting mesh', 90);

  _this.waiting = setInterval(function () {
    Object.keys(_this._mesh.calls.starting).forEach(function (name) {
      _this.log.warn("awaiting startMethod '%s'", name);
    });
  }, _this._mesh.config.waitingInterval || 30e3);

  _this.impatient = setTimeout(function () {
    Object.keys(_this._mesh.calls.starting).forEach(function (name) {
      _this.log.fatal("startMethod '%s' did not respond", name, new Error('timeout'));
    });
    _this.stop({
      kill: true,
      wait: 200,
    });
  }, _this._mesh.config.startTimeout || 5 * 60e3); // Default to 5 minutes for AWS purposes

  _this.__initComponents(function (error) {
    if (error) {
      clearInterval(_this.waiting);
      clearTimeout(_this.impatient);

      return callback(error, _this);
    }
    _this._mesh.componentsInitialized = true;
    _this.__startComponents(function (error) {
      clearInterval(_this.waiting);
      clearTimeout(_this.impatient);

      if (error) return callback(error, _this);

      function done(e) {
        _this._mesh.starting = false;
        _this._mesh.started = true;
        _this.log.info(
          `mesh with name ${_this._mesh.config.name} started, with happner version: ${
            require('../package.json').version
          }`
        );
        _this.startupProgress('mesh started', 100);
        callback(e, _this);
      }

      if (_this._mesh.config.listenFirst) return done();

      if (_this._mesh.config.deferListen) return done();

      _this._mesh.config.deferListen = true; // because of check in listen()
      _this.listen(done);
      _this._mesh.config.deferListen = false; // because of check in listen()
    });
  });
});

Mesh.prototype.listen = util.promisify(function (options, callback) {
  var _this = this;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (!options.times) options.times = 10;

  if (!options.interval) options.interval = 1000;

  if (!_this._mesh.config.deferListen)
    return callback(new Error('attempt to listen when deferListen is not enabled'));

  async.retry(options, _this._mesh.happn.listen, function (e) {
    if (e) return callback(e);
    callback(null, _this);
  });
});

Mesh.prototype.stop = util.promisify(function (options, callback) {
  var _this = this;

  clearInterval(_this.waiting);
  clearTimeout(_this.impatient);

  _this._mesh.initializing = false;
  _this._mesh.starting = false;
  _this._mesh.started = false;

  if (_this.__packager) _this.__packager.stop();

  // TODO: more thought/planning on runlevels
  //       this stop sets to 0 irrespective of success

  var stopEventLog = [];

  var logStopEvent = function (type, message, data) {
    //eslint-disable-next-line
    if (!_this.log) return console.log('no logger, stopping: ' + message);

    if (!data) data = null;

    stopEventLog.push({ type: type, message: message, data: data });

    _this.log[type](message);
  };

  logStopEvent('$$DEBUG', 'initiating stop');

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (options.kill && !options.wait) options.wait = 10000;

  var kill = function () {
    process.exit(typeof options.exitCode === 'number' ? options.exitCode : 1);
  };

  if (options.kill) {
    setTimeout(function () {
      _this.log.error('failed to stop components, force true');
      kill();
    }, options.wait);
  }

  _this._mesh.initialized = false;

  logStopEvent('$$DEBUG', 'stopping components');

  this.__stopComponents(function (e) {
    //
    // TODO: Only one error!
    //        Multiple components may have failed to stop.

    if (e) {
      // component instance already logged the err
      _this.log.error('failure to stop components');
      logStopEvent('$$DEBUG', 'failure to stop components: ' + e.toString());
    }

    logStopEvent('$$DEBUG', 'stopped components');

    _this.__shutdownComponents(function (e) {
      //
      // TODO: Only one error!
      //        Multiple components may have failed to shut down.

      if (e) {
        // component instance already logged the err
        _this.log.error('failure to shut down components');
        logStopEvent('$$DEBUG', 'failure to shut down components: ' + e.toString());
      }

      //options.reconnect; // if present, it's being passed into server.stop() below.
      // causes primus to inform remotes to enter reconect loop

      // All components stopped and shut down

      logStopEvent('$$DEBUG', 'shut down components');

      _this._stopPlugins(function (e) {
        if (e) {
          // component instance already logged the err
          _this.log.error('failure to stop plugins', e);
        }

        logStopEvent('$$DEBUG', 'disconnecting endpoints');

        _this.__stopEndPoints(options, function (e) {
          if (e) {
            // component instance already logged the err
            _this.log.error('failure to stop endpoints', e);
          }

          logStopEvent('$$DEBUG', 'stopping happn');

          _this._mesh.happn.server.stop(options, function (e) {
            // Stop the pending kill (if present)
            // clearTimeout(timeout);
            if (e) {
              logStopEvent('error', 'happn stop error', e);
              if (options.kill) return kill();
              return;
            }

            _this._mesh.stopped = true;

            logStopEvent('$$DEBUG', 'stopped happn');

            if (options.kill) kill();
            delete root.nodes[_this._mesh.config.name];

            // we unsubscribe from the process level events
            Mesh.unsubscribeFromProcessEvents(_this, logStopEvent);
            logStopEvent('$$DEBUG', 'stopped!');
            _this._mesh.stopped = true; //this state allows for graceful reinitialization
            if (callback) callback(e, _this, stopEventLog);
          });
        });
      });
    });
  });
});

Mesh.prototype.describe = function (cached, componentCached) {
  if (typeof componentCached === 'undefined') componentCached = false;

  if (!this._mesh.config || !this._mesh.config.happn) throw new Error('Not ready');
  if (this._mesh.description && cached === true) return this._mesh.description;

  // NB: destroyElement creates endpoint.previousDescription,
  //     which relies on this description being built entirely anew.

  var description = {
    name: this._mesh.config.domain,
    // initializing: this._mesh.initializing, // Still true at finel description write.
    // Needs true for remote endpoints to stop
    // waiting in their _initializeEndpoints
    initializing: false,
    components: {},
    brokered: this._mesh.config.brokered || false,
    setOptions: this._mesh.config.happn.setOptions,
  };

  for (var componentName in this._mesh.elements) {
    if (this._mesh.elements[componentName].deleted) continue;
    description.components[componentName] =
      this._mesh.elements[componentName].component.instance.describe(componentCached);
  }

  this._mesh.endpoints[this._mesh.config.name].description = description;
  this._mesh.description = description;

  return this._mesh.description;
};

Mesh.prototype.getCallerTo = function (skip) {
  var stack,
    file,
    parts,
    name,
    result = {};
  var origPrep = Error.prepareStackTrace;

  Error.prepareStackTrace = function (e, stack) {
    return stack;
  };

  try {
    stack = Error.apply(this, arguments).stack;
    stack.shift();
    stack.shift();
    for (var i = 0; i < stack.length; i++) {
      file = stack[i].getFileName();
      var line = stack[i].getLineNumber();
      var colm = stack[i].getColumnNumber();
      if (file) {
        parts = file.split(path.sep);
        if (!skip) {
          result = {
            file: file,
            line: line,
            colm: colm,
          };
          break;
        }

        name = parts.pop();

        if (name !== skip) {
          result = {
            file: file,
            line: line,
            colm: colm,
          };
          break;
        }
      }
    }
  } finally {
    Error.prepareStackTrace = origPrep;
    result.toString = function () {
      return result.file + ':' + result.line + ':' + result.colm;
    };
  }
  return result;
};

Mesh.prototype.updateSearchPath = function (startAt) {
  var newPaths = [];

  if (!startAt) return;

  this.log.$$TRACE('updateSearchPath( before ', module.paths);

  var addPath = function (dir) {
    var add = path.normalize(dir + path.sep + 'node_modules');
    if (module.paths.indexOf(add) >= 0) return;
    newPaths.push(add);
  };

  var apply = function (paths) {
    paths.reverse().forEach(function (path) {
      module.paths.unshift(path);
    });
  };

  var recurse = function (dir) {
    addPath(dir);
    var next = path.dirname(dir);
    if (next.length < 2 || (next.length < 4 && next.indexOf(':\\') !== -1)) {
      addPath(next);
      return apply(newPaths);
    }
    recurse(next);
  };

  recurse(startAt);

  this.log.$$TRACE('updateSearchPath( after ', module.paths);
};

Mesh.prototype._initializeDataLayer = function (config, callback) {
  DataLayer.create(this, module.exports.AssignedHappnServer, config, (err, instance, client) => {
    if (err) return callback(err, this);
    this._mesh.happn = instance;
    this._mesh.data = client;
    callback(null, this);
  });
};

Mesh.prototype._initializePackager = function (callback) {
  try {
    Packager = require('./system/packager');
    this.__packager = new Packager(this);
    this.__packager.initialize(callback);
  } catch (e) {
    callback(e);
  }
};

Mesh.prototype._initializeRootWebRoutes = function (callback) {
  if (!this._mesh.config.web) return callback();
  if (!this._mesh.config.web.routes) return callback();

  var connect;
  var _this = this;
  var mountRoutes = Object.keys(this._mesh.config.web.routes).filter(function (mountRoute) {
    return typeof _this._mesh.config.web.routes[mountRoute] === 'function';
  });

  if (mountRoutes.length === 0) return callback();

  connect = this._mesh.happn.server.connect;
  mountRoutes.forEach(function (mountRoute) {
    connect.use(mountRoute, _this._mesh.config.web.routes[mountRoute]);
  });

  callback();
};

Mesh.prototype.__getMiddlewareHandlers = function (middleware) {
  const _this = this;
  if (!middleware) throw new Error('undefined middleware in web config');
  if (typeof middleware === 'function') return [middleware];
  if (middleware.component == null) throw new Error(`web.middleware.component null in web config`);
  if (middleware.methods == null || !middleware.methods.length)
    throw new Error(
      `web.middleware.methods empty or null in web config, component: ${middleware.component}`
    );

  const methods = middleware.methods.map((methodName) => {
    return function (req, res, next) {
      if (!_this.exchange[middleware.component]) {
        return next(new Error(`Component ${middleware.component} not found for global middleware`));
      }
      if (!_this.exchange[middleware.component][methodName]) {
        return next(
          new Error(`Method ${middleware.component}.${methodName} not found for global middleware`)
        );
      }
      _this.exchange[middleware.component][methodName].call(null, req, res, next);
    };
  });
  // error handler for failed middleware, connect relies on its 4-ary (4 arguments)
  // structure to ensures that this middleware is only called
  // if an upstream next has been invoked with an Error
  // and so the method declaration needs the unused next argument
  //eslint-disable-next-line
  methods.push(function (err, req, res, next) {
    _this.log.error(err.message);
    res.statusCode = 500;
    res.statusMessage = 'system middleware failure';
    res.end();
  });

  return methods;
};

Mesh.prototype._initializeGlobalMiddleware = function (callback) {
  if (!this._mesh.config.web) return callback();
  if (!this._mesh.config.web.middleware) return callback();

  try {
    const connect = this._mesh.happn.server.connect;
    this._mesh.config.web.middleware.forEach((middleware) => {
      this.__getMiddlewareHandlers(middleware).forEach((handler) => {
        connect.use(handler);
      });
    });
  } catch (e) {
    return callback(e);
  }

  return callback();
};

Mesh.prototype._initializeElements = function (config, callback) {
  var _this = this;

  return async.parallel(
    Object.keys(config.components).map(function (componentName) {
      return function (callback) {
        var componentConfig = config.components[componentName];
        var moduleName = componentConfig.moduleName || componentConfig.module || componentName;
        componentConfig.moduleName = moduleName; // pending cleanup of .moduleName usage (preferring just 'module')
        var moduleConfig = config.modules[moduleName];

        if (!moduleConfig || moduleName[0] === '@') {
          moduleConfig = config.modules[moduleName] || {};

          // Handle private modules.
          if (componentName[0] === '@') {
            var originalComponentName = componentName;
            var parts = componentName.split('/'); // windows???

            delete config.modules[moduleName];
            delete config.components[componentName];

            componentName = parts[1];
            moduleName = parts[1];

            config.components[componentName] = componentConfig;
            componentConfig.moduleName = moduleName;

            moduleConfig = config.modules[moduleName] || moduleConfig;

            // TODO: resolve issues that arrise since because path needs to sometimes specify ClassName
            //       eg path: '@private/module-name.ClassName'
            if (!moduleConfig.path) {
              moduleConfig.path = originalComponentName;
            }
          }
        }

        return _this._createElement(
          {
            component: {
              name: componentName,
              config: componentConfig,
            },
            module: {
              name: moduleName,
              config: moduleConfig,
            },
          },
          false,
          callback
        );
      };
    }),
    function (e) {
      callback(e, _this);
    }
  );
};

Mesh.prototype._destroyElement = util.promisify(function (componentName, callback) {
  if (!this._mesh.elements[componentName]) return callback();

  this.log.$$TRACE("destroying element with component '%s'", componentName);
  var element = this._mesh.elements[componentName];
  var endpointName = this._mesh.config.name;
  var endpoint = this._mesh.endpoints[endpointName];
  var queue = (this._mesh.destroyingElementQueue = this._mesh.destroyingElementQueue || []);
  var config = this._mesh.config;
  var _this = this;

  async.series(
    [
      //TODO: this seems very convoluted, we could do away with some code using async queue
      // (Queue) Only allow 1 destroy at a time.
      // - gut feel, might not be necesssary.
      function (done) {
        var interval;
        if (_this._mesh.destroyingElement) {
          queue.push(componentName);
          interval = setInterval(function () {
            // ensure deque in create order
            if (!_this._mesh.destroyingElement && queue[0] === componentName) {
              clearInterval(interval);
              queue.shift();
              _this._mesh.destroyingElement = componentName;
              done(); // proceed
            }
          }, 200);
          return;
        }
        _this._mesh.destroyingElement = componentName;
        done();
      },

      function (done) {
        endpoint.previousDescription = endpoint.description;

        var writeSchema = true; // transmit description to subscribers
        // (browsers, other mesh nodes)

        element.deleted = true; // flag informs describe() to no longer list
        // the element being destroyed
        _this._registerSchema(config, writeSchema, done);
      },

      // TODO: Wait for clients/browser to remove functionality
      // from their APIs (per new descripition).
      //
      // Necessary?
      //
      // Is there a simple/'network lite' way to know
      // when they are all done?
      function (done) {
        done();
      },

      // Unclear... Question:
      //
      // - Should the component stopMethod be called before or after detatching it from the mesh.
      // - Similar to startMethod, i think the case can be made for both. Suggesting 2 kinds of
      //   stopMethods:
      //
      //         beforeDetach: can still tell clients
      //         afterDetatch: final cleanup,
      //                       no longer clients present to affect state/data during cleanup
      //
      // Decided to put it after detatch for now. It can still 'talk' to other mesh components
      // viw $happn, but other mesh components can no longer talk to it through $happn
      //
      // // Stop the component.
      // function(done) {
      //   done();
      // },

      function (done) {
        Internals._updateEndpoint(_this, endpointName, _this.exchange, _this.event, done);
      },

      function (done) {
        _this._unintegrateComponent(componentName, done);
      },

      function (done) {
        _this._mesh.elements[componentName].component.instance.detatch(_this._mesh, done);
      },

      function (done) {
        // TODO: Unregister from security,
        // TODO: Remove registered events and data paths.
        done();
      },

      // Stop the component if it was started and has a stopMethod
      function (done) {
        if (!_this._mesh.started) return done();
        if (!element.component.config.stopMethod) return done();
        _this._eachComponentDo(
          {
            methodCategory: 'stopMethod',
            targets: [componentName],
            logAction: 'stopped',
          },
          done
        );
      },

      function (done) {
        delete _this._mesh.elements[componentName];
        // TODO: double-ensure no further refs remain
        //
        //  ie. Rapidly adding and removing components is a likely use case.
        //      All refs must be gone for garbage collection
        //
        done();
      },
    ],
    function (e) {
      delete _this._mesh.destroyingElement; // done, (interval above will proceed)
      callback(e);
    }
  );
});

Mesh.prototype._updateElement = util.promisify(function (spec, callback) {
  const thisMesh = this;
  return async.series(
    [
      (done) => {
        thisMesh._destroyElement(spec.component.name, done);
      },
      (done) => {
        thisMesh._createElement(spec, true, done);
      },
      (done) => {
        thisMesh.emit('description-updated', thisMesh._mesh.description);
        done();
      },
    ],
    callback
  );
});

Mesh.prototype._createElement = util.promisify(function (spec, writeSchema, callback) {
  var _this = this;
  var config = _this._mesh.config;
  var endpointName = _this._mesh.config.name;

  if (typeof writeSchema === 'function') {
    callback = writeSchema;
    writeSchema = true;
  }

  _this.log.$$TRACE('_createElement( spec', spec);
  _this.log.$$TRACE(
    "creating element with component '%s' on module '%s' with writeSchema %s",
    spec.component.name,
    spec.module.name,
    writeSchema
  );

  async.series(
    [
      function (done) {
        _this._createModule(spec, done);
      },
      function (done) {
        _this._scanArguments(spec, done);
      },
      function (done) {
        _this._createComponent(spec, done);
      },
      function (done) {
        if (_this._mesh.initialized) {
          // Don't publish the schema if the mesh is already running
          // because then clients get the description update (new component)
          // before the component has been started.
          //
          // It is still necessary to refresh the description to that the
          // api can be built for the new component.
          //
          return _this._registerSchema(config, false, done);
        }
        _this._registerSchema(config, writeSchema, done);
      },
      function (done) {
        Internals._updateExchangeAPILayer(_this, endpointName, _this.exchange, done);
      },
      function (done) {
        Internals._updateEventAPILayer(_this, endpointName, _this.event, done);
      },
      function (done) {
        _this._integrateComponent(spec, done);
      },
      function (done) {
        if (!_this._mesh.initialized) return done();

        // New component, mesh already initialized

        if (!spec.component.config.initMethod) return done();

        _this._eachComponentDo(
          {
            methodCategory: 'initMethod',
            targets: [spec.component.name], // only initialize this component
            logAction: 'initialized',
          },
          done
        );
      },
      function (done) {
        if (
          (!spec.component.config || !spec.component.config.dependencies) &&
          (!spec.module.package.happner || !spec.module.package.happner.dependencies)
        )
          return done(); //No dependencies

        let dependencies =
          spec.module.package.happner &&
          spec.module.package.happner.dependencies &&
          (spec.module.package.happner.dependencies.$broker
            ? spec.module.package.happner.dependencies // If package brokers dependencies we include them  all here.
            : spec.module.package.happner.dependencies[spec.component.name]);
        dependencies =
          dependencies || (spec.component.config && spec.component.config.dependencies); //If we didn't find deps in package, we  check component config - package takes preference

        spec.component.config.dependencies = dependencies;
        return done();
      },
      function (done) {
        if (!spec.component.config || !spec.component.config.startMethod) return done();

        if (!_this._mesh.started) return done(); //start will be called when mesh

        _this._eachComponentDo(
          {
            methodCategory: 'startMethod',
            targets: [spec.component.name], // only start this component
            logAction: 'started',
          },
          done
        );
      },
      function (done) {
        if (_this._mesh.initialized) {
          // component has started, publish schema
          return _this._registerSchema(config, writeSchema, done);
        }
        done();
      },
    ],
    function (e) {
      callback(e);
    }
  );
});

Mesh.prototype._createModule = function (spec, callback) {
  // NB: If this functionality is moved into another module the
  //     module.paths (as adjusted in updateSearchPath(caller))
  //     will need to be done in the new module.
  //
  //     Otherwise the require() won't search from the caller's
  //     perspective

  var _this = this;

  var moduleName = spec.module.name;
  var moduleConfig = spec.module.config;
  var moduleConstructor;

  //
  // if (spec.module.config.packageName && this._mesh.config.packaged[spec.module.config.packageName])
  //   spec.module.packaged = this._mesh.config.packaged[spec.module.config.packageName];
  //
  //  spec.module.packaged    isn't used anywhere...
  //

  var modulePath;
  var moduleBasePath;
  var pathParts;
  var callbackIndex = -1;
  var moduleInstance;
  var moduleBase;
  var home;

  if (moduleConfig.instance) {
    moduleConfig.home = moduleConfig.home || '__NONE__';
    moduleBase = moduleConfig.instance;
    home = moduleConfig.home;
  }

  if (!moduleConfig.path) moduleConfig.path = moduleName;

  try {
    modulePath = moduleConfig.path;

    if (moduleConfig.path.indexOf('system:') === 0) {
      pathParts = moduleConfig.path.split(':');
      modulePath = __dirname + '/modules/' + pathParts[1];
    }

    if (!home) {
      try {
        var dirName = path.dirname(modulePath);
        var baseName = path.basename(modulePath);

        baseName
          .replace(/\.js$/, '')
          .split('.')
          .map(function (part, ind) {
            if (ind === 0) {
              if (dirName === '.' && modulePath[0] !== '.') {
                moduleBasePath = part;
              } else {
                moduleBasePath = part = dirName + path.sep + part;
              }
              _this.log.$$TRACE('requiring module %s', modulePath);
              moduleBase = require(part);
            } else moduleBase = moduleBase[part];
          });
      } catch (e) {
        try {
          _this.log.$$TRACE('alt-requiring module happner-%s', modulePath);
          moduleBase = require('happner-' + modulePath);
          moduleBasePath = 'happner-' + modulePath;
        } catch (f) {
          _this.log.$$TRACE('alt-requiring happner-%s failed', modulePath, f);
          throw e;
        }
      }
    }

    home = home || path.dirname(require.resolve(moduleBasePath));
    Object.defineProperty(spec.module, 'directory', {
      get: function () {
        if (depWarned3) return home;
        _this.log.warn('Use of module.directory is deprecated. Use module.home');
        try {
          _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
        } catch (e) {
          //do nothing
        }
        depWarned3 = true;
        return home;
      },
    });

    Object.defineProperty(spec.module, 'home', {
      get: function () {
        return home;
      },
    });

    var modulePackage = utilities.getPackageJson(home, spec.module.version);
    Object.defineProperty(spec.module, 'package', {
      get: function () {
        return modulePackage;
      },
      enumerable: true,
    });

    Object.defineProperty(spec.module, 'version', {
      get: function () {
        return spec.module.package.version;
      },
      enumerable: true,
    });
  } catch (e) {
    return callback(e);
  }

  var getParameters = function () {
    try {
      if (!moduleConfig.construct && !moduleConfig.create) return [];

      var parameters = (moduleConfig.construct || moduleConfig.create).parameters;

      if (!parameters) return [];

      return parameters.map(function (p, i) {
        if (p.parameterType === 'callback') {
          callbackIndex = i;
          return;
        }
        if (p.value) return p.value;
        else return null;
      });
    } catch (e) {
      return [];
    }
  };

  var errorIfNull = function (module) {
    if (!module) {
      _this.log.warn("missing or null module '%s'", moduleName);
      return {};
    }
    return module;
  };

  var parameters = getParameters();

  if (moduleConfig.construct) {
    _this.log.$$TRACE("construct module '%s'", moduleName);

    if (moduleConfig.construct.name) moduleBase = moduleBase[moduleConfig.construct.name];

    try {
      moduleConstructor = Function.prototype.bind.apply(moduleBase, [null].concat(parameters));
      moduleInstance = new moduleConstructor();
      spec.module.instance = errorIfNull(moduleInstance);
    } catch (e) {
      _this.log.error("error constructing '%s'", moduleName, e);
      return callback(e);
    }
    return callback();
  }

  if (moduleConfig.create) {
    _this.log.$$TRACE("create module '%s'", moduleName);

    if (moduleConfig.create.name) moduleBase = moduleBase[moduleConfig.create.name];

    if (moduleConfig.create.type !== 'async') {
      moduleInstance = moduleBase.apply(null, parameters);
      spec.module.instance = errorIfNull(moduleInstance);
      return callback();
    }

    var constructorCallBack = function () {
      var callbackParameters;
      try {
        callbackParameters = moduleConfig.create.callback.parameters;
      } catch (e) {
        callbackParameters = [{ parameterType: 'error' }, { parameterType: 'instance' }];
      }

      for (var index in arguments) {
        var value = arguments[index];

        var callBackParameter = callbackParameters[index];
        if (callBackParameter.parameterType === 'error' && value) {
          return callback(new MeshError('Failed to construct module: ' + moduleName, value));
        }

        if (callBackParameter.parameterType === 'instance' && value) {
          spec.module.instance = errorIfNull(value);
          return callback();
        }
      }
    };

    if (callbackIndex > -1) parameters[callbackIndex] = constructorCallBack;
    else parameters.push(constructorCallBack);

    return moduleBase.apply(moduleBase, parameters);
  }

  if (typeof moduleBase === 'function') {
    _this.log.$$TRACE("construct/create module '%s'", moduleName);

    try {
      moduleConstructor = Function.prototype.bind.apply(moduleBase, [null].concat(parameters));
      moduleInstance = new moduleConstructor();
    } catch (e) {
      _this.log.error("error construct/creating '%s'", moduleName, e);
      return callback(e);
    }

    spec.module.instance = errorIfNull(moduleInstance);
    return callback();
  }

  _this.log.$$TRACE("assign module '%s'", moduleName);

  spec.module.instance = errorIfNull(moduleBase);

  return callback();
};

Mesh.prototype._scanArguments = function (spec, callback) {
  let args, originalFn;
  const module = spec.module.instance;

  //get all methods that are not inherited from Object, Stream, and EventEmitter
  for (let fnName of utilities.getAllMethodNames(module, { ignoreInheritedNativeMethods: true })) {
    originalFn = module[fnName];
    if (typeof originalFn !== 'function') continue;
    if (utilities.functionIsNative(originalFn)) originalFn = Object.getPrototypeOf(module)[fnName];
    if (typeof originalFn !== 'function' || utilities.functionIsNative(originalFn)) {
      this.log.debug(
        `cannot check native function ${spec.module.name}:${fnName} arguments for injection`
      );
      continue;
    }
    args = utilities.getFunctionParameters(originalFn);
    let $originSeq = args.indexOf(`$origin`);
    let $happnSeq = args.indexOf(`$happn`);

    if ($happnSeq > -1) {
      Object.defineProperty(module[fnName], `$happnSeq`, { value: $happnSeq });
    }
    if ($originSeq > -1) {
      Object.defineProperty(module[fnName], `$originSeq`, { value: $originSeq });
    }

    module[fnName].$argumentsLength = args.filter(
      (argName) => ['$happn', '$origin'].indexOf(argName) === -1
    ).length;
  }
  callback(null);
};

Mesh.prototype._createComponent = function (spec, callback) {
  var _this = this;

  var config = _this._mesh.config;
  var componentName = spec.component.name;
  var componentConfig = spec.component.config || {};

  if (config.directResponses) componentConfig.directResponses = true;

  var componentInstance = new ComponentInstance();

  if (!componentConfig.meshName)
    Object.defineProperty(componentConfig, 'meshName', {
      get: function () {
        if (depWarned1) return config.name;
        _this.log.warn('use of $happn.config.meshName is deprecated, use $happn.info.mesh.name');
        try {
          _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
        } catch (e) {
          //do nothing
        }
        depWarned1 = true;
        return config.name;
      },
    });

  if (!componentConfig.setOptions)
    Object.defineProperty(componentConfig, 'setOptions', {
      get: function () {
        if (depWarned2) return config.happn.setOptions;
        _this.log.warn(
          'use of $happn.config.setOptions is deprecated, use $happn.info.happn.options'
        );
        try {
          _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
        } catch (e) {
          //do nothing
        }
        depWarned2 = true;
        return config.happn.setOptions;
      },
    });

  _this.log.$$TRACE("created component '%s'", componentName, componentConfig);

  _this._stats.component[componentName] = { errors: 0, calls: 0, emits: 0 };
  componentInstance.stats = _this._stats; // TODO?: rather let the stats collector component
  //         have accessLevel: 'mesh' (config in component)
  //          and give each component it's own private stats store

  var __addComponentDataStoreRoutes = function (componentConfig) {
    if (!componentConfig.data || !componentConfig.data.routes) return;

    for (var route in componentConfig.data.routes) {
      var componentRoute = '/_data/' + componentName + '/' + route.replace(/^\//, '');
      _this._mesh.happn.server.services.data.addDataStoreFilter(
        componentRoute,
        componentConfig.data.routes[route]
      );
    }
  }.bind(_this);
  componentInstance.initialize(componentName, _this, spec.module, componentConfig, function (e) {
    if (e) return callback(e);
    try {
      __addComponentDataStoreRoutes(componentConfig);
    } catch (e) {
      return callback(new Error(`bad component data route: ${e.message}`));
    }
    spec.component.instance = componentInstance;
    _this._mesh.elements[componentName] = spec;
    callback();
  });
};

Mesh.prototype._integrateComponent = function (spec, done) {
  var _this = this;
  var componentName = spec.component.name;
  var componentInstance;
  var exchange;
  var event;
  var localEvent;
  var localEventEmitter;

  // add all other components to this (includes endpoints)

  componentInstance = _this._mesh.elements[componentName].component.instance;
  exchange = componentInstance.exchange;
  event = Internals._decoupleEventAPILayer(componentInstance.event);
  localEvent = Internals._decoupleEventAPILayer(componentInstance.localEvent);
  localEventEmitter = componentInstance.localEventEmitter;

  Object.keys(this.exchange).forEach(function (otherComponentName) {
    exchange[otherComponentName] = _this.exchange[otherComponentName];
    if (otherComponentName === '$call') return;
    event[otherComponentName] = _this.event[otherComponentName];
    if (otherComponentName === _this._mesh.config.name) return;
    localEvent[otherComponentName] = _this.localEvent[otherComponentName];
  });

  // add endpoint proxy property

  Object.keys(this._mesh.config.endpoints).forEach(function (endpointName) {
    Object.defineProperty(exchange, endpointName, {
      enumerable: true,
      get: function () {
        return _this.exchange[endpointName];
      },
    });

    Object.defineProperty(event, endpointName, {
      enumerable: true,
      get: function () {
        return _this.event[endpointName];
      },
    });
  });

  // add localEvent to mesh root

  this.localEvent[componentName] = localEventEmitter;

  // add this component to all others

  Object.keys(this._mesh.elements).forEach(function (otherComponentName) {
    componentInstance = _this._mesh.elements[otherComponentName].component.instance;
    exchange = componentInstance.exchange;
    event = componentInstance.event;
    localEvent = componentInstance.localEvent;

    // don't replace custom component's exchange entry
    // (they are pointing into cluster to correct version dependency)

    if (exchange[componentName] && exchange[componentName].__custom) return;

    // TODO: incoming component may match version and could be switched back from cluster

    exchange[componentName] = _this.exchange[componentName];
    event[componentName] = _this.event[componentName];
    localEvent[componentName] = localEventEmitter;
  });

  done();
};

Mesh.prototype._unintegrateComponent = function (componentName, done) {
  var _this = this;

  delete this.localEvent[componentName];

  // remove component from all other component exchanges

  Object.keys(this._mesh.elements).forEach(function (otherComponentName) {
    var componentInstance = _this._mesh.elements[otherComponentName].component.instance;
    var exchange = componentInstance.exchange;
    var event = componentInstance.event;
    var localEvent = componentInstance.localEvent;

    if (exchange[componentName] && !exchange[componentName].__custom) {
      delete exchange[componentName];
      delete event[componentName];
    }

    delete localEvent[componentName];
  });

  done();
};

Mesh.prototype._startPlugins = function (config, callback) {
  var _this = this;
  if (!config.plugins) return callback();
  if (!Array.isArray(config.plugins)) return callback();

  config.plugins.forEach(function (pluginFactory) {
    if (typeof pluginFactory !== 'function') return;
    var plugin = pluginFactory(_this, _this.log);
    if (!plugin) return;
    _this.plugins.push(plugin);
  });

  async.each(
    this.plugins,
    function (plugin, callback) {
      if (typeof plugin.start !== 'function') return callback();
      plugin.start(callback);
    },
    function (error) {
      callback(error);
    }
  );
};

Mesh.prototype._stopPlugins = function (callback) {
  async.each(
    this.plugins,
    function (plugin, callback) {
      if (typeof plugin.stop !== 'function') return callback();
      plugin.stop(callback);
    },
    function (error) {
      callback(error);
    }
  );
};

Mesh.prototype._registerInitialSchema = function (config, callback) {
  // The happn is up and waiting for connections before there has been any
  // description written, remote mesh nodes or clients that attach after
  // the datalater init but before the schema is registered get a null description
  // and become dysfunctional.
  //
  // This registers an initial description marked with initializing = true,
  // the remote has subscribed to further description updates from here, so
  // it will receive the full description (initializing = false) as soon as this
  // meshnode completes it's initialization.
  //
  // The remote does not callback from it's _initializeEndpoints until a full
  // description from each endpoint has arrived there.
  //
  //
  // This is to ensure that ALL functionality EXPECTED by the remote on it's
  // endpoint is present and ready at callback (that no component on the remote
  // is still loading)
  //
  //
  // This above behaviour needs to be configurable.
  // ----------------------------------------------
  //
  //
  // As it stands if all meshnodes start simultaneously, then each takes as
  // long as it's slowest endpoint to callback from initialize()
  //

  // Cannot use this.description(), it requires bits not present yet

  var _this = this;

  var description = {
    initializing: true,
    name: _this._mesh.config.domain,
    components: {},
  };

  _this._mesh.data.set('/mesh/schema/description', description, function (e) {
    if (e) return callback(e);
    _this._mesh.data.set('/mesh/schema/config', _this._filterConfig(config), function (e) {
      callback(e);
    });
  });
};

Mesh.prototype._filterConfig = function (config) {
  //share only what is necessary
  var sharedConfig = {
    name: config.name,
    version: this.version,
    happn: {},
    datalayer: {},
  };

  if (config.domain) sharedConfig.name = config.domain;

  sharedConfig.happn.port = config.happn.port;
  sharedConfig.happn.secure = config.happn.secure;
  sharedConfig.happn.encryptPayloads = config.happn.encryptPayloads;
  sharedConfig.happn.setOptions = config.happn.setOptions;
  sharedConfig.happn.transport = config.happn.transport;

  //happner 1 compatability
  sharedConfig.datalayer.port = config.happn.port;
  sharedConfig.datalayer.secure = config.happn.secure;
  sharedConfig.datalayer.encryptPayloads = config.happn.encryptPayloads;
  sharedConfig.datalayer.setOptions = config.happn.setOptions;
  sharedConfig.datalayer.transport = config.happn.transport;

  return sharedConfig;
};

Mesh.prototype.disableSchemaPublish = function () {
  this.__disableSchemaPublish = true;
};

Mesh.prototype.enableSchemaPublish = function () {
  this.__disableSchemaPublish = false;
};

Mesh.prototype._registerSchema = function (config, writeSchema, callback) {
  // - writeSchema is set to false during intialization as each local component
  //   init calls through here to update the description ahead of it's API
  //   initializations.
  //
  // - This prevents a write to the happn for every new component.
  //
  // - New components added __during runtime__ using createElement() call
  //   through here with write as true so that the description change
  //   makes it's way to clients and other attached nodes.
  //

  var _this = this;

  try {
    var description = _this.describe(false, true);
    // Always use the cached component descriptions
    // to alleviate load as this function gets called
    // for every local component initialization

    _this.log.$$TRACE(
      '_registerSchema( description with name: %s',
      description.name,
      writeSchema ? description : null
    );

    if (!writeSchema) return callback();

    var filteredConfig = _this._filterConfig(config);

    // TODO: only write if there actually was a change.
    _this._mesh.data.set(
      '/mesh/schema/description',
      description,
      { noPublish: _this.__disableSchemaPublish },
      function (e) {
        if (e) return callback(e);
        _this._mesh.data.set(
          '/mesh/schema/config',
          filteredConfig,
          { noPublish: _this.__disableSchemaPublish },
          function (e) {
            callback(e);
          }
        );
      }
    );
  } catch (e) {
    callback(e);
  }
};

Mesh.prototype._initializeEndpoints = function (callback) {
  var _this = this;
  var EndPointService = require('./services/endpoint');

  var config = _this._mesh.config;

  // Externals
  var exchangeAPI = (_this.exchange = _this.exchange || {});
  var eventAPI = (_this.event = _this.event || {});

  // Internals
  _this._mesh = _this._mesh || {};

  _this._mesh.exchange = _this._mesh.exchange || {};

  _this._endPointService = new EndPointService(_this, Internals, exchangeAPI, eventAPI, Happn);

  _this._endPointService.initialize(config, function (e) {
    callback(e, _this);
  });
};

Mesh.prototype._eachComponent = function (targets, flow, operator, callback) {
  var _this = this;

  async[flow](
    Object.keys(this._mesh.elements)

      .filter(function (componentName) {
        return targets.indexOf(componentName) !== -1;
      })

      .map(function (componentName) {
        return function (done) {
          var component = _this._mesh.elements[componentName].component;
          operator(componentName, component, done);
        };
      }),

    function (e) {
      callback(e, _this);
    }
  );
};

Mesh.prototype.componentAsyncMethod = function (
  componentName,
  component,
  options,
  calls,
  call,
  done
) {
  return component.instance.operate(
    options.methodName,
    options.methodArguments || [],
    (e, responseArgs) => {
      delete calls[call];
      if (e) return done(e);
      if (options.logAction) {
        this.log.debug("%s component '%s'", options.logAction, componentName);
      }
      done.apply(this, responseArgs);
    }
  );
};

Mesh.prototype.deferStartMethod = function (componentName, component, options, calls, call, done) {
  if (this._mesh.clusterClient)
    this._mesh.clusterClient.on(`${componentName}/startup/dependencies/satisfied`, () => {
      this.componentAsyncMethod(componentName, component, options, calls, call, done);
    });
};

Mesh.prototype.possiblyDeferStartup = function (
  componentName,
  config,
  component,
  options,
  calls,
  call,
  eachComponentCallback
) {
  if (
    this._mesh.clusterClient &&
    !this._mesh.clusterClient.__implementors.addAndCheckDependencies(
      componentName,
      config.dependencies
    )
  ) {
    // wait for cluster dependencies to be satisfied
    return this.deferStartMethod(
      componentName,
      component,
      options,
      calls,
      call,
      eachComponentCallback
    );
  }
  // all dependencies have started so we can start
  return this.componentAsyncMethod(
    componentName,
    component,
    options,
    calls,
    call,
    eachComponentCallback
  );
};

Mesh.prototype.getMethodArguments = function (methodConfig, removeUndefined) {
  const methodArguments = (methodConfig?.parameters || []).map((p) => p.value);
  if (removeUndefined) return _.without(methodArguments, undefined);
  return methodArguments;
};

Mesh.prototype._eachComponentDo = function (options, callback) {
  if (!options.methodCategory && !options.methodName)
    return callback(new MeshError('methodName or methodCategory not included in options'));

  if (!options.flow) options.flow = 'series';
  if (!options.targets) options.targets = Object.keys(this._mesh.elements);

  let calls;

  this._mesh.calls = this._mesh.calls || {};
  this._mesh.calls.starting = calls = {};

  this._eachComponent(
    options.targets,
    options.flow,
    (componentName, component, eachComponentCallback) => {
      let call,
        config = component.config || {};

      if (options.methodCategory) {
        options.methodName = config[options.methodCategory];
      }

      const methodConfig = commons._.get(config, `schema.methods.${options.methodName}`);

      if (!options.methodName) {
        return eachComponentCallback();
      }

      call = componentName + '.' + options.methodName + '()';
      calls[call] = Date.now();

      const methodArguments = this.getMethodArguments(methodConfig, options, true);
      const methodOptions = Object.assign({ methodArguments }, options);

      this.log.$$TRACE(
        `calling %s '%s' as type: ${methodConfig?.type || 'unconfigured'}`,
        options.methodCategory,
        call
      );

      if (
        options.methodCategory === 'startMethod' &&
        !this._mesh.ignoreDependenciesOnStartup &&
        !commons._.isEmpty(config.dependencies)
      ) {
        // we need to wait for dependencies to have started
        return this.possiblyDeferStartup(
          componentName,
          config,
          component,
          methodOptions,
          calls,
          call,
          eachComponentCallback
        );
      }
      this.componentAsyncMethod(
        componentName,
        component,
        methodOptions,
        calls,
        call,
        eachComponentCallback
      );
    },
    (e) => {
      callback(e, this);
    }
  );
};

Mesh.prototype.__initComponents = function (callback) {
  this.log.$$TRACE('init');
  this._eachComponentDo(
    {
      methodCategory: 'initMethod',
      flow: 'series',
      logAction: 'initialized',
    },
    callback
  );
};

Mesh.prototype.__startComponents = function (callback) {
  this.log.$$TRACE('start');

  this._eachComponentDo(
    {
      methodCategory: 'startMethod',
      flow: 'series',
      logAction: 'started',
    },
    callback
  );
};

Mesh.prototype.__stopComponents = function (callback) {
  this.log.$$TRACE('stopping');
  this._eachComponentDo(
    {
      methodCategory: 'stopMethod',
      flow: 'series',
      logAction: 'stopped',
    },
    callback
  );
};

Mesh.prototype.__shutdownComponents = function (callback) {
  this.log.$$TRACE('stopping');
  this._eachComponentDo(
    {
      methodCategory: 'shutdownMethod',
      flow: 'series',
      logAction: 'shut down',
    },
    callback
  );
};

Mesh.prototype.__stopEndPoints = function (options, callback) {
  this.log.$$TRACE('stopping endpoints');

  if (!this._endPointService) return callback();

  this._endPointService.stop(options, callback);
};

Mesh.prototype.__supplementSuites = function (packaged, suite, moduleName, match) {
  if (!Array.isArray(suite)) suite = [suite];

  var seq = 0;

  var error;

  suite.forEach(function (elementConfig) {
    if (error) return;

    if (!elementConfig.component) {
      error = new Error('Missing component in elementConfig');
      return;
    }

    if (!elementConfig.component.name) {
      if (seq === 0) {
        // First element in the suite name defaults from containing module dirname
        // elementConfig.component.name = parts.slice(-2).shift();
        elementConfig.component.name = moduleName;
      } else {
        // All other elements error if not name is specified,
        error = new Error('Missing component name in elementConfig');
        return;
      }
    }

    elementConfig.module = elementConfig.module || {};
    elementConfig.module.name = elementConfig.module.name || elementConfig.component.name;
    elementConfig.module.config = elementConfig.module.config || {};

    elementConfig.component.config = elementConfig.component.config || {};

    if (!elementConfig.component.config.module || elementConfig.component.config.moduleName) {
      elementConfig.component.config.moduleName = elementConfig.module.name;
    }

    elementConfig.packageName = elementConfig.component.name;

    if (match) {
      if (!match.base) {
        // a node module not nested onto the root of one of the modulePaths
        // ie. deep inside, needs path

        if (!elementConfig.module.config.path) {
          elementConfig.module.config.path = match.filename.replace('/happner.js', '');
        }
      }
    }

    packaged[elementConfig.packageName] = elementConfig;

    seq++;
  });

  return error;
};

/*
 We match happner.js files to modules, by id (so same as npm install id) - if the modules dont autoload,
 their packaged settings are still available in config.packaged - and get handed to them when the module
 is instantiated and control is passed over to the componentInstance
 */
Mesh.prototype.getPackagedModules = function (config, callback) {
  var _this = this;

  if (!config.packaged) config.packaged = {};
  path = require('path');
  // using local path (see .updateSearchPath())
  utilities.findInModules('happner.js', module.paths, function (e, matches) {
    // Matches are returned sorted deepest to shallowest, so that shallowest are
    // processed last and therefore overwrite into config.packaged[packageName] so
    // that the shallowest packages are used.
    //

    // Pending, there is a version available,
    //
    //  - use most recent??
    //
    //  - what to do on major version collide?
    //  - what to do on different configs for the same autoloaded module?

    if (e) return callback(e);

    var error;

    async.map(
      matches,
      function matchModule(match, cb) {
        if (error) return cb();

        var happnerFile = match.filename;
        var moduleName = match.moduleName;
        var happnerConfig;
        // var version = match.version; // <---------- not yet used...
        // var parts = match.parts;

        try {
          happnerConfig = require(happnerFile);
        } catch (e) {
          _this.log.warn(`failed requiring happnerFile: ${happnerFile}: ${e.message}`);
          return cb();
        }

        if (!happnerConfig.configs) {
          error = new Error('Missing happner.js(.configs) in ' + happnerFile);
          return cb();
        }

        var suite = happnerConfig.configs[config.autoload];

        if (!suite) {
          // No autoload. That's fine.
          return cb();
        }

        if (typeof suite === 'function') {
          suite(config)
            .then(function (suite) {
              error = _this.__supplementSuites(config.packaged, suite, moduleName, match);
              cb();
            })
            .catch(cb);
          return;
        }

        error = _this.__supplementSuites(config.packaged, suite, moduleName, match);
        cb();
      },
      function (err) {
        if (error) return callback(error);
        callback(err);
      }
    );
  });
};

Mesh.prototype.loadPackagedModules = function (config, packaged, callback) {
  var packages = packaged || config.packaged;

  Object.keys(packages).forEach(function (packageName) {
    //
    // TODO: sometimes load order is important

    var loadConfig = packages[packageName];

    if (loadConfig) {
      // Shallow merge autoload config (keeping original where present)

      var loadModule = loadConfig.module.config;
      var loadModName = loadConfig.module.name;
      var existingModule = (config.modules[loadModName] = config.modules[loadModName] || {});

      Object.keys(loadModule).forEach(function (key) {
        if (typeof existingModule[key] !== 'undefined') return 'dont replace';
        existingModule[key] = loadModule[key];
      });

      var loadComponent = loadConfig.component.config;
      var loadCompName = loadConfig.component.name;
      var existingComponent = (config.components[loadCompName] =
        config.components[loadCompName] || {});

      Object.keys(loadComponent).forEach(function (key) {
        if (key === 'module' || key === 'moduleName') {
          // config support component.module or component.moduleName
          if (typeof existingComponent.module !== 'undefined') return;
          if (typeof existingComponent.moduleName !== 'undefined') return;
        }
        if (typeof existingComponent[key] !== 'undefined') return;
        existingComponent[key] = loadComponent[key];
      });
    }
  });
  callback();
};

Mesh.prototype._loadComponentSuites = function (config, callback) {
  if (!config.components) return callback();

  var _this = this;

  var packaged = {};

  var error;

  async.map(
    Object.keys(config.components),
    function loadComponentSuite(name, cb) {
      if (error) return cb();

      var component = config.components[name];
      var suiteName, fallbackSuiteName;
      var passthroughFunction;

      if (!component.$config && !component.$configure) return cb();

      if (component.$config) {
        if (typeof component.$config !== 'string') return cb();
        suiteName = component.$config;
        delete component.$config;
      }

      if (component.$configure) {
        if (typeof component.$configure !== 'function') return cb();
        passthroughFunction = component.$configure;
        delete component.$configure;
        suiteName = utilities.getFunctionParameters(passthroughFunction)[0];
        fallbackSuiteName = suiteName;
        var changeCase = require('change-case');
        if (suiteName) suiteName = changeCase.paramCase(suiteName);
      }

      // determine module path

      var moduleName = component.module || component.moduleName || name;
      var modulePath =
        typeof config.modules === 'undefined'
          ? moduleName
          : typeof config.modules[moduleName] === 'undefined'
          ? moduleName
          : typeof config.modules[moduleName].path === 'undefined'
          ? moduleName
          : config.modules[moduleName].path;

      // module.path could define <path>.ClassName

      var parts = modulePath.split(path.sep);
      var last = parts.pop();
      last = last.split('.').shift();
      parts.push(last);
      modulePath = parts.join(path.sep);

      // load happner file from module path and pull out specified config suite

      var resolved, happnerFile, suite;

      try {
        resolved = require.resolve(modulePath);
      } catch (e) {
        _this.log.error(
          "cannot resolve module for component: '%s', config suite: '%s'",
          name,
          suiteName,
          e
        );
        throw e;
      }

      happnerFile = path.dirname(resolved) + path.sep + 'happner.js';
      _this.log.$$TRACE("loading suite from '%s'", happnerFile);

      try {
        suite = require(happnerFile).configs[suiteName];
        if (!suite) {
          if (!fallbackSuiteName) throw new Error('undefined suite ' + suiteName);
          // with $configure function arg 'thisName' could mean 'thisName' or 'this-name'
          // fall back to the former
          suite = require(happnerFile).configs[fallbackSuiteName];
          if (!suite) throw new Error('undefined suite ' + suiteName);
        }
      } catch (e) {
        _this.log.error(
          "cannot load config suite: '%s' from happner file: ''",
          suiteName,
          happnerFile,
          e
        );
        throw e;
      }

      if (typeof suite === 'function') {
        var promise = suite(config);

        // if suite factory function returned a promise
        if (promise && typeof promise.then === 'function') {
          promise
            .then(function (suite) {
              if (suite && passthroughFunction) {
                // deepcopy so that $configure passthrough does not modify original
                suite = passthroughFunction(JSON.parse(JSON.stringify(suite))); // TODO: confirm it's the fastest deepcopy
                if (!suite) throw new Error('$configure function returned nothing');
              }

              if (!suite)
                throw new Error(
                  "empty suite return by '" + suiteName + "' in component '" + name + "'"
                );

              // if passthrough returned a promise
              if (typeof suite.then === 'function') {
                suite
                  .then(function (suite) {
                    if (!suite)
                      throw new Error(
                        "empty suite from $configure '" +
                          suiteName +
                          "' in component '" +
                          name +
                          "'"
                      );
                    if (suite[0]) delete suite[0].component.name;
                    else delete suite.component.name;
                    error = _this.__supplementSuites(packaged, suite, name, null);
                    cb();
                  })
                  .catch(cb);
                return;
              }

              // delete component name from first element in suite so that
              // __supplementSuites defaults the name to 'name' passed in.
              // This is so that a component defined in the mesh config
              // can use a suite in the happner.js file without having
              // the same name as the suite's first element.
              if (suite[0]) delete suite[0].component.name;
              else delete suite.component.name;
              error = _this.__supplementSuites(packaged, suite, name, null);
              cb();
            })
            .catch(cb);
          return;
        }

        suite = promise;
      }

      if (suite && passthroughFunction) {
        suite = passthroughFunction(JSON.parse(JSON.stringify(suite)));

        if (!suite)
          throw new Error(
            "empty suite from $configure '" + suiteName + "' in component '" + name + "'"
          );

        // if passthrough returned a promise
        if (typeof suite.then === 'function') {
          suite
            .then(function (suite) {
              if (!suite)
                throw new Error(
                  "empty suite from $configure '" + suiteName + "' in component '" + name + "'"
                );
              if (suite[0]) delete suite[0].component.name;
              else delete suite.component.name;
              error = _this.__supplementSuites(packaged, suite, name, null);
              cb();
            })
            .catch(cb);
          return;
        }
      }

      if (!suite) throw new Error("empty suite '" + suiteName + "' in component '" + name + "'");

      if (suite[0]) delete suite[0].component.name;
      else delete suite.component.name;
      error = _this.__supplementSuites(packaged, suite, name, null);
      cb();
    },
    function (err) {
      if (err) throw err;

      if (error) throw error;
      _this.loadPackagedModules(config, packaged, callback);
    }
  );
};

Mesh.prototype.attachSystemComponents = function (config) {
  //set up the modules

  config.modules.api = {
    path: 'system:api',
  };

  config.modules.security = {
    path: 'system:security',
  };

  config.modules.system = {
    path: 'system:system',
  };

  config.modules.data = {
    path: 'system:data',
  };

  config.modules.rest = {
    path: 'system:rest',
  };

  //create a container for the component configurations
  let mergedComponentConfig = {
    security: {
      accessLevel: 'mesh',
      initMethod: 'initialize',
    },
    api: {
      accessLevel: 'mesh',
      startMethod: 'start',
      stopMethod: 'stop',
      web: {
        routes: {
          client: 'client',
        },
      },
    },
    system: {
      accessLevel: 'mesh',
      initMethod: 'initialize',
      stopMethod: 'stop',
    },
    rest: {
      accessLevel: 'mesh',
      initMethod: 'initialize',
      startMethod: 'start',
      web: {
        routes: {
          method: 'handleRequest',
          describe: 'describe',
          login: 'login',
        },
      },
    },
  };

  //set the config to the merged config
  config.components = _.defaultsDeep(mergedComponentConfig, config.components);
};
