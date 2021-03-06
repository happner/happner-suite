[&#9664;](https://github.com/happner/happner-2#documentation) contents | happn [&#9654;](happn.md)

## Configuration

Mesh configuration contains several sections.

* [Mesh Name](#mesh-name)
* [Defer Listen](#defer-listen)
* [Listen First](#listen-first)
* [Happn Config](#happn-config)
* [Endpoint Config](#endpoint-config)
* [Module Config](#module-config)
* [Component Config](#component-config)
* [Plugins Config](#plugins-config)
* [Utilities](#utilities)
* [Repl](#repl)

These are arranged as a set of key/value pairs on the config object:

```javascript
config = {
    name: 'mesh',
    deferListen: false, // the default
    listenFirst: false, // the default
    util: {},
    repl: {},
    happn: {},
    endpoints: {},
    modules: {},
    components: {}
    plugins: []
}
```

### Mesh Name

[&#9650;](#)

The `config.name` is the name of __this__ MeshNode and serves to uniquely identify it in it's network.

If the name is unspecified a random name will be used.

__BUG:__ Currently the clients do not fully re-establish connections to restarted nodes with a new random name. It is strongly recommended that you provide the name.

### Defer Listen

[&#9650;](#)

The `config.deferListen` parameter defines when the server starts listening.

If set to `true` the server will not listen until `listen()` is called.

eg.

```javascript
var Mesh = require('happner-2');
var config = {
  name: 'mesh',
  deferListen: true
};

Mesh.create(config)

  .then(function(mesh) {

    // do some stuff before listening

    return mesh.listen();

  })

  .then(..

  .catch(..

```

### Listen First

The `config.listenFirst` parameter causes the server to go to listen at first step in startup. This is necessary in cases where the server needs to be accessible immediately. (eg. happner-cluster)

Note that listenFirst overrides deferListen.

### Happn Config

[&#9650;](#)

See also: [What is Happn?](happn.md#what-is-the-happn-layer)

Happner by default contains an embeded nedb database that does not persist beyond server restarts. This can be extended to have two databases, one embedded memory/fast and one persisting to a specified nedb file. When both are used it is up to the component configuration to declare which data paths are stored in which database by defining `data.routes` See [Component Config](#component-config).

The happn layer is actually a [plain happn config](https://github.com/happner/happn-3/blob/master/docs/config.md)

here are the convenience settings most typically used for happner:

```javascript

  happn: {
    host: '0.0.0.0',
    port: 55000, // 0 for os assigned port
    // sessionTokenSecret: shortid.generate(),

    persist: false,
    // filename: '/var/data/nodes/abc/data.nedb',
    // defaultRoute: 'persist', // or 'mem' (default: inherits according to presense of happn.filename)

    secure: false,
    // adminPassword: shortid.generate(),

    // transport: {
    //   mode: 'https',
    //   key: '-----BEGIN CERTIFICATE...',
    //   cert: '-----BEGIN CERTIFICATE...',
    //   # keyPath: 'path/to/key.pem',
    //   # certPath: 'math/to/cert.pem',
    // },

    // middleware: {
    //   security: {
    //     // exclusions for certain parts of the site requiring access before login
    //     exclusions: [
    //       '/',
    //       '/component-name/method-name'
    //     ],
    //     // cookieName: 'alternative_token_name',
    //     // cookieDomain: '.example.com',
    //   }
    // },

    // setOptions: {
    //  timeout: 5000,
    //  noStore: true
    // }
  }
  ...
```

`host` - The host (ip/interface) for __this__ MeshNode to listen on.<br/>
`port` - The port to listen on.<br/>
`sessionTokenSecret` - <br/>
`persist` - Set true will save data to default nedb file in `$HOME/.happn/data/$MESHNAME.nedb`<br/>
`filename` - Save to specified nedb file.<br/>
`defaultRoute` - Where to store data when no match is found in the per component `data.route` masks.<br/>
`secure` - Set true will enable security. Users in groups with permissions will need to be created. See [Security](security.md)<br/>
`transport` - Set to configure server to use https.
`middleware` - Configure middleware details for use when security is enabled.
`adminPassword` - If secure is true, this sets a password for the genesis user (_ADMIN).<br/>
`setOptions` - Default options set by the exchange when calling functions through the happn.</br>


__NOTE:__ The `config.happn` section can be omitted if all defaults are acceptable.

### Happn config: Unconfigured session removal, server config, ONLY FOR SECURE CONFIGS
*Sockets that have not been logged in after a specific interval can be configured to be disconnected by the server*
```javascript
  happn: {
    host: '0.0.0.0',
    port: 55000, // 0 for os assigned port
    secure: true,
    services: {
      session:{
        config: {
          unconfiguredSessionCleanup: {
            interval: cleanupInterval, //check every N milliseconds
            threshold: cleanupThreshold || 10e3, //sessions are cleaned up if they remain unconfigured for 10 seconds
            verbose: cleanupVerbose //cleanups are logged
          }
        }
      }
    }
  }
  ...
```

### Endpoint Config

[&#9650;](#)

The `config.endpoints` section should list all remote MeshNodes to which __this__ MeshNode should attach upon initialization - as follows:

##### Long Form

```javascript
  ...
  endpoints: {
    'quay1-berth1-crane1': {
      config: {
        host: 'crane1.berth1.quay1.harbour.com',
        port: 919,
      }
    },
    'quay1-berth2-crane1': {
      config: {
        host: 'crane1.berth2.quay1.harbour.com',
        port: 919,
      }
    },
  }
  ...
```

The above attaches __this__ MeshNode to two remote MeshNodes.

`quay1-berth1-crane1` - The remote MeshNode's name (as configured in the remote's `config.name`)<br/>
`.host` - The remote MeshNode ip/hostname (as configured in the remote's `config.happn.host`)<br/>
`.port` - The remote MeshNode post (as configured in the remote's `config.happn.port`)<br/>
`.username` - Username with the required priviledges at the remote MeshNode. See [Security](security.md)<br/>
`.password` - <br/>

##### Short Form

```javascript
  ...
  endpoints: {
    'quay1-berth1-crane1': 919, // localhost
    'quay1-berth2-crane1': 'crane1.berth2.quay1.harbour.com:919'
  }
  ...
```

###### Security Enabled

When the remote MeshNode has securty enabled and is using https.

```javascript
  ...
  endpoints: {
    'endpointname': {
      config: {
        allowSelfSignedCerts: true,
        url: 'https://mesh.example.com', // :port
        username: 'user',
        password: 'xxxx',
      }
    }
  }
  ...
```

###### Reconnection configuration
endpoints can be configured with different reconnection policies
```javascript
 var config = {
    endpoints: {
      'test': {
        reconnect:{ // as per Primus's reconnection settings
          max:2000, //default 3 seconds (3000)
          retries:100 // default Infinity
        },
        config: {
          port: PORT_REMOTE,
          host: 'localhost',
          username: '_ADMIN',
          password: 'guessme',
        }
      }
    }
```

### Module Config

[&#9650;](#)

See also: [What are Modules?](modules.md#what-are-modules)

The `config.module` section should list modules to be loaded into the mesh as follows:

```javascript
  ...
  modules: {
    'class-module': {
      path: '/path/to/module1',
      construct: {  // <------------- versus
        parameters: [
          {value: ''}
        ]
      }
    },
    'factory-module': {
      path: '/path/to/module2',
      create: {     // <------------- versus
        parameters: [
          {value: ''}
        ]
      }
    }
  }
  ...
```

The above will result in the initialization of the two modules named `class-module` and `factory-module`. These names can then be used in the [Component Config](#component-config) to create mesh components that use these modules.

The `path`, `construct` and `create` config elements are only necessary as follows:

* `path` - If unspecified the mesh initializer will assume that the module name is the same as the `node_module` name and will be called by `require()` as is.
* `construct` - Need only be specified if the module definition is a `class` and the defaults don't apply. <br/>See [Modules from Classes](modules-from-classes) below.
* `create` - Will need to be specified if the module should be created using a factory function. <br/>See [Modules from Factories](#modules-from-factories) below.

#### Modules from Classes

Use the `construct: {}` config element to initialize modules from Objects that require `new`.

The full config set looks something like this:

```javascript
  ...
  'module-name': {
    construct: {
      name: 'SomeThing',
      parameters: [
        {name: 'param1', value: 'A'},
        {name: 'param2', value: 'B'}
      ]
    }
  }
  ...
```

The `name` and `parameters` config elements are only necessary as follows:

* `name` - Need only be specified if the class to be instantiated is nested within the module.<br/>eg. `new moduleName.SomeThing()` as opposed to `new moduleName()`
* `parameters` - Need only be specified if arguments should be passed to the constructor.<br/>eg. `new moduleName.SomeThing('A', 'B')`<br/>Note that the `parameters.name` serves only informationally and is not reqired, the args are positioned into the constructor per their position in the parameters array.

##### Example cases.
###### Example 1 (default as class)
__in__ `node_modules/module-name/index.js`
```javascript
module.exports = ModuleName;
function ModuleName() {}
ModuleName.prototype.method = function() {}
```
```javascript
  ...
  modules: {
    'module-name': {}
  }
  ...
```

###### Example 2 (nested class)
__in__ `./lib/module-name.js`
```javascript
module.exports.SomeThing = SomeThing;
function SomeThing(param1) {
  this.param1 = param1;
}
SomeThing.prototype.method = function() {
  this.param1;
}
```
```javascript
  ...
  modules: {
    'some-thing': {
      path: __dirname + '/lib/module-name.js',
      construct: {
        name: 'SomeThing',
        parameters: [
          {name: 'param1', value: 'A'}
        ]
      }
    }
  }
  ...
```

###### Example 3 (class factory)
__in__ `./lib/module.js`
```javascript
module.exports = function(param1) {
  return new SomeThing(param1)
}
function SomeThing(param1) {
  this.param1 = param1;
}
SomeThing.prototype.method = function() {
  this.param1;
}
```
```javascript
  ...
  modules: {
    'some-thing': {
      path: __dirname + '/lib/module.js',
      construct: {
        parameters: [
          {name: 'param1', value: 'A'}
        ]
      }
    }
  }
  ...
```

#### Modules from Factories

Use the `create: {}` config element to initialize modules from synchronous or asynchronous functions that return or callback with the module definition.

The full config set looks something like this:

```javascript
  ...
  'module-name': {
    path: '...',
    create: {
      name: 'createObject',
      type: 'async',
      parameters: [
        {name: 'param1', value: 'A'},
        {name: 'param2', value: 'B'},
        {name: 'callback', parameterType: 'callback'}
      ],
      callback: {
        parameters: [
          {name: 'err', parameterType: 'error'},
          {name: 'res', parameterType: 'instance'}
        ]
      }
    }
  }
  ...
```

Most of the above config is only necessary in cases where modules being initialized deviate from popular norms.

* `type` - is necessary only to specify asynchronous. It defaults to `sync`.
* `parameters` - is only necessary if args need to be passed.
* `parameters.callback` - of `parameterType: 'callback'` is only necessary if the callback is in a peculiar argument position. It will default into the last position and need not be specified even when specifying the preceding args.
* `callback` - with `parameters` need only be specified if the callback employs something other than the standard `(error, result)` signature. The `result` is assumed to be the module `instance` to be used by the mesh.

##### Example cases.
###### Example 1 (async factory)
__in__ `node_modules/module-name/index.js`
```javascript
module.exports.createThing = function(param1, callback) {
  SomeKindOfRemoteThing.get(param1, function(err, instance) {
    callback(err, instance);
  });
}
```
```javascript
  ...
  'module-name': {
    create: {
      name: 'createThing',
      type: 'async',
      parameters: [
        {name: 'param1', value: 'https://www.'},
      ]
    }
  }
  ...
```

#### Modules from Modules

The most simple case. Modules are used directly as exported.

__in__ `node_modules/module-name/index.js`
```javascript
module.exports.method1 = function() {}
module.exports.method2 = function() {}
```
```javascript
  ...
  modules: {
    'module-name': {}
  }
  ...
```

__NOTE:__ The `config.modules` section can be omitted if the [Components (see below)](#component-config) are calling modules that require no config and are named after their `require()` name.


### Component Config

[&#9650;](#)

See also: [What are Components?](modules.md#what-are-components)

The `config.components` section should list components to be loaded into the mesh. The full complement of possible config looks as follows:

```javascript
var config = {
  components: {
    "name-of-component": {
      module: 'name-of-implementing-module',
      schema: {
        exclusive: true,
        startMethod: 'start',
        initMethod: 'init',
        stopMethod: 'asyncStop',
        shutdownMethod: 'asyncShutdown',
        methods: {
        asyncStop: {
          type: 'async'
        },
        asyncShutdown: {
          type: 'async'
        },
        init: {
            type: 'async',
            parameters: [
              {name: 'opts', required: true, value: {op:'tions'}},
              {name: 'optionalOpts'},
              {name: 'callback', required: true, type: 'callback'}
            ],
            callback: {
              parameters: [
                {name: 'error', type: "error"},
              ]
            }
          },
          start: {
            type: 'async',
            parameters: [
              {name: 'opts', required: true, value: {op:'tions'}},
              {name: 'optionalOpts'},
              {name: 'callback', required: true, type: 'callback'}
            ],
            callback: {
              parameters: [
                {name: 'error', type: "error"},
              ]
            }
          },
          methodName1: {
            alias: 'mn1'
          },
          methodName2: {
            type: 'sync-promise'
          }
        }
      },
      web: {
        routes: {
          method1: 'webMethod1',
          app: 'static',
          // app: ['middleware1', 'middleware2', 'static']
        }
      },
      events: {
        'ping': {},
        'event/with/wildcard/*': {},
      },
      data: {
        routes: {
          'friends/*': 'persist',
          'lovers/*': 'mem',
        }
      }
    }
  }
 }
```

###### name-of-component
__(required)__

Components become accessable by name in the [Events](events.md) and [Exchange](exchange.md) APIs and also on [Web Routes](webroutes.md)

###### module
__(optional)__

Each Component in the MeshNode should specify which [Module](#module-config) it exposes. If the `module` is unspecified the mesh will attempt to use a Module by the same name as the Component's name.

###### schema
__(optional)__

The schema defines which methods on the Module should be exposed to the mesh. If no schema is specified the initializer will expose all methods and assume the last argument to each function is a 'node style' callback. This allows for the generic case to require no config.

###### schema.exclusive
__(optional)__

If true - it informs the initializer to only expose the Methods specified in `schema.methods` to the mesh.
The default is false.

###### schema.initMethod
__(optional)__

Used to specify one of the `schema.methods` to run on the mesh.start to pre-initialize the module once the mesh is up, running and connected to other MeshNodes.

When specifying `schema.initMethod`, if the corresponding init method is not defined in the schema it is assumed that the start method takes a callback as the only argument.

The init method runs before the start method below, this is useful in situations where components need to connect to external services, before they can be started (below)

###### schema.startMethod
__(optional)__

Used to specify one of the `schema.methods` to run on the mesh.start to further initialize the module once the mesh is up, running and connected to other MeshNodes.

When specifying `schema.startMethod`, if the corresponding startmethod is not defined in the schema it is assumed that the start method takes a callback as the only argument.

###### schema.stopMethod
__(optional)__

Used to specify one of the `schema.methods` to run on the mesh.stop, this method would typically release internal module resources.

The stop method runs before the shutdown method below, this is useful in situations where components need to detach from internal services before shutdown is called and they can detach from other modules

###### schema.shutdownMethod
__(optional)__

Used to specify one of the `schema.methods` to run on the mesh.stop to allow modules to detach from each other after they have run their stop methods.

###### schema.methods
__(optional)__

List the methods. Each has a subconfig defining the method details. In most cases no subconfig is required. If the method is configured to be type 'sync-promise' it means the method is synchronous, but will be wrapped by a promiseover the exchange. Methods are of type 'async' by default, thus the system will expect there to be a callback argument in the method signature. To see how this works look at the test: test/integration/exchange/exchange-promises

###### web.routes
__(optional)__

This allows the binding of web routes to methods on the Module or 'static' directories on the Module's path.

`http://meshhost:port/name-of-component/method1` runs `moduleInstance.webMethod(req, res)`
`http://meshhost:port/name-of-component/app/..` serves files from `(module) __dirname`/app

###### events
__(optional)__

List the events that this component generates. See [Events](events.md)

###### data.routes
__(optional)__

List the data paths where this component stores, retrieves or subscribes. 'mem' refers to storage that will be routed to the memory only, and 'persist' is routed to the configured `happn.filename` or defaulted database. See [Data](data.md)

### Plugins Config

[???](#)

Allows for specifying a function or set of functions the can operate on the mesh object just before it runs the component start methods and just after it runs the component stop methods.

```javascript
  ...
  plugins: [
    function (mesh, logger) {
      var log = logger.createLogger('plugin1');

      // return the plugin instance with start and stop methods
      return {
        start: function (callback) {
          log.info('plugin started!');
          callback();
        },
        stop: function (callback) {
          callback();
        }
      }
    }
  ]
  ...
```

### Utilities

[???](#)

#### Configuring the Logger

The MeshNode provides a [log4js](https://www.npmjs.com/package/log4js) logger.

There are configuration opportunities as follows:

```javascript
meshConfig: {
  name: 'Name', // mesh name is used as logger context
  util: {
    logCacheSize: 50,
    logLevel: 'info',
    logTimeDelta: true,
    logStackTraces: true, // if last arg to logger is instanceof Error
    logComponents: [],
    logMessageDelimiter: '\t',
    logDateFormat: null,
    logLayout: null,
    logFile: null,
    logFileMaxSize: 20480,
    logFileBackups: 10,
    logFileNameAbsolute: true,
    logger: null
  }
}
```

See: [happn-logger/configuration](https://github.com/happner/happn-logger#configuration) for more information

#### Using the Logger

Components can access their own logger in `$happn` (as injected by the mesh, see [Mesh Awareness](modules.md#mesh-awareness-with-happn))

eg.

```javascript
module.exports = MyMeshModule;
function MyMeshModule() {}

MyMeshModule.prototype.method = function($happn) {

  $happn.log.info('string: %s, number: %d, json: %j', string, number, object);

  // $happn.log.fatal()
  // $happn.log.error()
  // $happn.log.warn()
  // $happn.log.info()
  // $happn.log.debug()
  // $happn.log.trace()
  // $happn.log.$$DEBUG() // same as debug
  // $happn.log.$$TRACE() // same as trace
  //
}
```

### Repl

[&#9650;](#)

The MeshNode can be set to share a console repl on a socket file or port to access the running server.

```javascript
meshConfig: {
  repl: {
    socket: '/tmp/somefilename.socket',
    // OR port
    // port: 9999, // listens at localhost:9999
    ignoreUndefined: false,
    useColors: true,
    historyFile: '/tmp/somefilename.history' // store repl command history
  }
}
```
* The repl __is only started if the config is present__.
* The mesh instance is in the variable `mesh`
* ^d is the best exit.

__NB!__ The socket repl is insecure. Anyone with readwrite on the socket file has full access to the mesh instance without login. Similarly the port repl will allow anyone with access to localhost:port.

#### Using the repl.

```
sudo npm install net-repl --global

repl /tmp/somefilename.socket
# OR
repl 9999

mesh-name>
mesh-name> mesh.description()
mesh-name> ^d
```

#### The $logger tool

Modify the server's logger settings.

```
# These affect logging output in the server process. Logger is not visible in the repl.

# modify log level
mesh-name> $logger.level = 'debug'

# only log specific components
mesh-name> $logger.components = ['component-name', 'another']

# reset logger to original settings
mesh-name> $logger.reset
```

#### The $callback tool

Use callback tool to accumulate results from exchange methods (or event subscriptions).

```
# call exchange method passing $callback to receive the result (which may take time)
mesh_name> mesh.exchange.componentName.methodName('argument', $callback)

# result is contained in $callback.res
mesh_name> $callback.res
mesh_name> JSON.stringify($callback.res)

# error is in $callback.err
mesh_name> $callback.err

# history array (length 10) of previous callbacks
mesh_name> $callback.history[0].res
```

#### Calling methods in component context ($happn)

```
mesh_name> $happn = mesh._mesh.elements.componentName.component.instance
mesh_name> $happn.data.set('some/path', {x: 1}, $callback)
mesh_name> $callback.res
{ x: 1,
  _meta:
   { created: 1504032302038,
     modified: 1504032354563,
     path: '/_data/componentName/some/path',
     published: true,
     type: 'response',
     status: 'ok',
     eventId: 17,
     sessionId: 'be4d18b5-1f38-4961-bb49-b8b0b4257f18',
     action: 'set' } }

```

