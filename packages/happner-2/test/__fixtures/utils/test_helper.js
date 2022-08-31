const commons = require('happn-commons');
const BaseTestHelper = require('happn-commons-test');
const Mesh = require('../../../lib/mesh');
const path = require('path');
class TestHelper extends BaseTestHelper {
  constructor() {
    super();
    this.__activeServices = {};
    this.__testFiles = [];
    this.__happnerClients = {};
    this.__happnerInstances = {};

    this.package = require('../../../package.json');
    this.util = commons.nodeUtils;
    this.fs = commons.fs;
    this.async = commons.async;
    this.TCPProxy = require('./tcp-proxy/proxy');
    this.package = require('../../../package.json');
    this.path = require('path');
    this.happnPackage = JSON.parse(this.fs.readFileSync(this.path.resolve(__dirname, '../../../../../node_modules/happn-3/package.json')));
    this._ = commons._;
    this.log = this.sinon.spy(console.log);
    this.users = require('./users');

    this.startUp = this.util.promisify(this.startUp);
    this.disconnectClient = this.util.promisify(this.disconnectClient);
    this.stopService = this.util.promisify(this.stopService);
    this.testService = this.util.promisify(this.testService);
    this.Mesh = Mesh;
  }

  static create() {
    return new TestHelper();
  }

  static describe(options, handler) {
    return BaseTestHelper.extend(TestHelper).describe(options, handler);
  }

  startUp(configs, callback) {
    if (typeof configs == 'function') {
      callback = configs;
      configs = null;
    }
    if (configs == null) return callback();
    if (!Array.isArray(configs)) return callback(new Error('configs not an Array, please pass in Array'));
    var _this = this;
    this.async.eachSeries(configs, function (config, configCB) {
      _this.getService(config, configCB);
    }, callback);
  }

  __addHappnerClient (ctx, client) {

    if (!this.__happnerClients[ctx])
      this.__happnerClients[ctx] = [];
  
    this.__happnerClients[ctx].push(client);
  };
  
  __addHappnerInstance (ctx, instance, config) {
  
    if (!this.__happnerInstances[ctx])
      this.__happnerInstances[ctx] = [];
  
    this.__happnerInstances[ctx].push({instance: instance, config: config});
  };
  
  startHappnerInstance (ctx, config, callback){
    if (!ctx) ctx = 'default';
  
    if (typeof config == 'function') {
      callback = config;
      config = null;
    }
  
    Mesh.create(config,  (e, instance) => {
      if (e) return callback(e);
      this.__addHappnerInstance(ctx, instance, config);
      const client = new Mesh.MeshClient({port: config.happn.port ? config.happn.port : 55000});
      client.login({
        username: '_ADMIN',
        password: config.happn.adminPassword ? config.happn.adminPassword : 'happn'
      }).then((e) => {
        if (e) return callback(e);
        this.__addHappnerClient(ctx, client);
        callback(null, instance, client);
      });
    });
  };
  
  stopHappnerInstances (ctx, callback){
  
    var _this = this;
  
    this.async.eachSeries(_this.__happnerInstances[ctx], function (started, stopCallback) {
  
      started.instance.stop(function (e) {
  
        if (e) return stopCallback[e];
  
        if ((started.config && started.config.happn && started.config.happn.filename) || (started.config && started.config.data && started.config.data.filename)) {
  
          var dbPath;
  
          if (started.config.happn) dbPath = started.config.happn.filename;
  
          if (started.config.data) dbPath = started.config.data.filename;
  
          this.fs.unlinkSync(dbPath);
        }
  
        stopCallback();
      });
    }, function (e) {
  
      if (e) return callback(e);
  
      _this.__happnerInstances[ctx] = [];
  
      callback();
    });
  };
  
  getRecordFromHappn (options, callback) {
  
    var service = this.findService(options.instanceName);
  
    var happn = service.instance._mesh.happn.server;
  
    happn.services.session.localClient({username:'_ADMIN', password:'happn'}, function(e, localClient){
  
      if (e) return callback(e);
  
      localClient.get(options.dataPath, function(e, response){
  
        if (e) return callback(e);
  
        callback(null, response);
      });
    });
  };
  
  getRecordFromSmallFile (options){
  
    try{
  
      var fileContents;
      var foundRecord = null;
      if (options.filename) fileContents = this.fs.readFileSync(options.filename, 'utf8');
      var records = fileContents.toString().split('\n');
  
      //backwards to get latest record
      records.reverse().every(function(line){
        var record = null;
        try{
          record = JSON.parse(line);
        }catch(e){
          //do nothing
        }
  
        if (record){
          if (options.type === 'nedb') {
            if (record.path == options.dataPath){
              foundRecord = record;
              return false;
            }
          }
         if (options.type === 'loki') {
          if (record.operation && record.operation.arguments && record.operation.arguments[0] == options.dataPath){
            foundRecord = record;
            return false;
          }
         }
        }
  
        return true;
      });
  
      return foundRecord;
  
    }catch(e){
      throw new Error('getRecordFromSmallFile failed: ' + e.toString(), e);
    }
  };

  newTempFilename(ext) {
    return this.path.resolve(`test/tmp/${this.newid()}.${ext}`);
  }
  
  newTestFile (options) {
    if (!options) options = {};
    if (!options.dir) options.dir = 'test' + this.path.sep + 'tmp';
    if (!options.ext) options.ext = 'loki';
    if (!options.name) options.name = shortid.generate();
    const folderName = this.path.resolve(options.dir);
    this.fs.ensureDirSync(folderName);
    const fileName = folderName + this.path.sep + options.name + '.' + options.ext;
    this.fs.copySync(path.resolve(__dirname, `../test/integration/data/test-db${options.secure ? '-secure' : ''}.loki`), fileName);
    this.__testFiles.push(fileName);
    return fileName;
  };

  newTestFileNedb (options) {
    if (!options) options = {};
    if (!options.dir) options.dir = 'test' + path.sep + 'tmp';
    if (!options.ext) options.ext = 'nedb';
    if (!options.name) options.name = shortid.generate();
    var folderName = path.resolve(options.dir);
    this.commons.fs.ensureDirSync(folderName);
    const fileName = folderName + path.sep + options.name + '.' + options.ext;
    this.commons.fs.writeFileSync(fileName, JSON.stringify({
      "_id": "/_TEST_HELPER/TESTWRITE",
      "data": {},
      "path": "/_TEST_HELPER/TESTWRITE",
      "created": Date.now(),
      "modified": Date.now()
    }));
    this.__testFiles.push(fileName);
    return fileName;
  };
  
  deleteFiles () {
    let errors = 0;
    let deleted = 0;
    let lastError;
    this.__testFiles.forEach(function (filename) {
      try {
        this.fs.unlinkSync(filename);
        deleted++;
      } catch (e) {
        lastError = e;
        errors++;
      }
    });
    return {deleted, errors, lastError};
  };
  
  __serviceExists (config) {
  
    var nameExists = this.__activeServices[config.name] != null;
  
    if (nameExists) return true;
  
    for (var serviceName in this.__activeServices) {
      var service = this.__activeServices[serviceName];
      if (service.config.happn.port == config.happn.port) return true;
    }
  
    return false;
  };
  
  findClient (options) {
  
    if (options.name) options.id = options.name;
  
    if (options.id) {
  
      var serviceId = options.id.split('@')[1];
  
      for (var serviceName in this.__activeServices) {
  
        if (serviceName == serviceId) {
  
          var service = this.__activeServices[serviceName];
  
          if (service.clients && service.clients.length > 0) {
  
            for (var clientIndex in service.clients) {
  
              var client = service.clients[clientIndex];
  
              if (client.id == options.id)  return client;
            }
          }
          return null;
        }
      }
    }
  
    return null;
  };
  
  getClient (config, callback, clientPassword) {
    if (typeof config != 'object') return callback('cannot get a client without a config');
    if (config.happn) config.name = config.name != null  ? config.name : config.happn.name;
    if (!config.name) return callback('cannot get a client for unknown service name');
    if (!config.__testOptions) config.__testOptions = {};
    config.__testOptions.clientKey = this.newid() + '@' + config.name;//[client id]@[server key]
    let service = this.findService(config);
    if (!service) return callback('could not find service using options: ' + JSON.stringify(config));

    var credentials = {};
    var options = {};
    var happnConfig = service.config.happn != null ? service.config.happn : service.config;
    var secure = happnConfig.secure != null ? happnConfig.secure : service.config.secure;
    var port = happnConfig.port != null ? happnConfig.port : service.config.port;
  
    if (secure) {
  
      options.secure = true;
      if (happnConfig.encryptPayloads) options.encryptPayloads = true;
      if (happnConfig.keyPair) options.keyPair = happnConfig.keyPair;
      var username = config.username ? config.username : '_ADMIN';
      var password = config.password;
  
      if (!password) {
        if (happnConfig.adminPassword)
          password = happnConfig.adminPassword;
        else if (happnConfig.services && happnConfig.services.security &&
          happnConfig.services.security.config &&
          happnConfig.services.security.config.adminUser)
          password = happnConfig.services.security.config.adminUser.password;
        else
          password = 'happn';
      }
  
      credentials.username = username;
      credentials.password = clientPassword || password;
    }
  
    options.port = port;
  
    var clientInstance = new Mesh.MeshClient(options);
    var clientConfig = JSON.parse(JSON.stringify(happnConfig));
  
    if (secure) {
      clientConfig.username = username;
      clientConfig.password = clientPassword || password;
    }
  
    clientConfig.__testOptions = config.__testOptions != null?config.__testOptions:{};
    clientConfig.__testOptions.skipComponentTests = clientConfig.__testOptions.skipComponentTests != null?clientConfig.__testOptions.skipComponentTests:true;
  
    clientInstance.login(credentials)
      .then(() => {
  
        if (this.__activeServices[config.name].clients == null) this.__activeServices[config.name].clients = [];
        var client = {instance: clientInstance, id: config.__testOptions.clientKey, config:clientConfig};
        this.__activeServices[config.name].clients.push(client);
        callback(null, client);
      })
      .catch(function (e) {
        callback(e);
      });
  };
  
  findService (options) {
  
    if (typeof options == 'string') return this.__activeServices[options];
  
    if (options.name) {
      if (this.__activeServices[options.name]) return this.__activeServices[options.name];
    }
  
    if (options.id) {
      if (this.__activeServices[options.id]) return this.__activeServices[options.id];
    }
  
    if (options.port) {
      for (var serviceName in this.__activeServices) {
        var service = this.__activeServices[serviceName];
        if (service.config &&
          (service.config.port == options.port ||
          (service.config.happn && service.config.happn.port == options.port)))
          return service;
      }
    }
  
    return null;
  };
  
  restartService (options, callback) {
  
    var _this = this;
  
    var service = _this.findService(options);
  
    if (service != null) {
  
      var config = service.config;
  
      return _this.stopService(options, function (e) {
  
        if (e) return callback(e);
  
        _this.getService(config, callback);
      });
    }
  
    callback(new Error('could not find service'));
  };
  
  __appendTestComponentConfig(config){
  
    if (!config.modules) config.modules = {};
  
    if (!config.components) config.components = {};
  
    config.modules.testHelperComponent = {
  
      instance: {
  
        testHelperFunction : function($happn, val, callback){
          $happn.emit('test-function-called', {message:'test-message', value:val});
          callback();
        }
      }
    };
  
    config.components.testHelperComponent = {};
  };
  
  getService (config, callback, clientPassword) {
  
    var _this = this;
  
    if (typeof config == 'function') {
      callback = config;
      config = {};
    }
  
    if (!config.happn) config.happn = {};
  
    if (config.happn.name) config.name = config.happn.name;
  
    if (!config.name) config.name = sillyname();
  
    if (config.happn.port != null) config.port = config.happn.port;
  
    if (!config.port) config.port = 55000;
  
    config.happn.port = config.port;//for __serviceExists test
  
    if (config.__testOptions == null) config.__testOptions = {};
  
    if (config.__testOptions.skipComponentTests === false)
      _this.__appendTestComponentConfig(config);
  
    if (_this.__serviceExists(config)) return callback(new Error('service by the name ' + config.name + ' or port ' + config.port + ' already exists'));
  
    if (config.__testOptions.isRemote) return _this.startRemoteService(config, function (e, process) {
  
      if (e) return callback(e);
  
      var service = {instance: process, config: config, id: config.name};
  
      _this.__activeServices[config.name] = service;
  
      if (config.__testOptions.getClient) return _this.getClient(config, function (e, client) {
  
        if (e) return callback(new Error('started service ok but failed to get client: ' + e.toString()));
  
        service.client = client;
  
        callback(null, service);
  
      }, clientPassword);
  
      callback(null, service);
    });
  
    Mesh.create(config, function (e, instance) {
  
      if (e) return callback(e);
  
      var service = {instance: instance, config: config, id: config.name};
  
      _this.__activeServices[config.name] = service;
  
      if (config.__testOptions.getClient) {
  
        return _this.getClient(config, function (e, client) {
  
          if (e) {
            return service.instance.stop(function(){
  
              delete _this.__activeServices[config.name];
  
              return callback(new Error('started service ok but failed to get client: ' + e.toString()));
            });
          }
  
          service.client = client;
  
          callback(null, service);
  
        }, clientPassword);
      }
  
      callback(null, service);
    });
  };
  
  disconnectClient(id, callback) {
  
    var _this = this;
  
    var removed = false;
  
    var client = _this.findClient({id: id});
  
    if (!client) return callback(new Error('client with id: ' + id + ' not found'));
  
    client.instance.disconnect({ttl:5000}, function (e) {
  
      if (e) return callback(e);
  
      var serviceId = id.split('@')[1];
  
      var service = _this.findService({id: serviceId});
  
      //remove the client from the services clients collection
      service.clients.every(function (serviceClient, serviceClientIndex) {
  
        if (serviceClient.id == id) {
          service.clients.splice(serviceClientIndex, 1);
          removed = true;
          return false;
        }
        return true;
      });
  
      return callback(null, removed);
    });
  }
  
  stopService (id, callback) {
  
    var _this = this;
  
    var activeService = _this.findService(id);
  
    if (!activeService) return callback(new Error('could not find service to stop using options: ' + JSON.stringify(id)));
  
    var completeStopService = function () {
  
      delete _this.__activeServices[activeService.id];
  
      if (activeService.config.__testOptions.isRemote) {
  
        activeService.instance.kill();
  
        return callback();
      }
  
      return activeService.instance.stop(callback);
    };
  
    if (activeService.clients && activeService.clients.length > 0) {
  
      return this.async.eachSeries(activeService.clients, function (activeServiceClient, activeServiceClientCB) {
        _this.disconnectClient(activeServiceClient.id, activeServiceClientCB);
      }, function (e) {
  
        if (e) {
          console.warn('unable to disconnect clients for service: ' + activeService.config.name);
        }
        completeStopService();
      });
    }
  
    return completeStopService();
  }
  
  testClientComponent(clientInstance, options, callback){
  
    if (typeof options == 'function'){
      callback = options;
      options = {};
    }
  
    if (options.skipComponentTests) {
      return callback();
    }
  
    if (!options.eventName) options.eventName = 'test-function-called';
  
    if (!options.componentName) options.componentName = 'testHelperComponent';
  
    if (!options.functionName) options.functionName = 'testHelperFunction';
  
    if (!options.methodArguments) options.methodArguments = [1];
  
    if (!options.expectedData) options.expectedData = {message:'test-message', value:1};
  
    if (clientInstance.exchange[options.componentName]) {
  
      clientInstance.event[options.componentName].on(options.eventName, function(data){
  
        try{
          this.expect(data).to.eql(options.expectedData);
          callback();
        }catch(e){
          callback(e);
        }
      });
  
      clientInstance.exchange[options.componentName][options.functionName].apply(clientInstance.exchange[options.componentName], options.methodArguments);
  
    } else callback(new Error('expected exchange and event methods not found'));
  };
  
  testClientData (clientInstance, callback) {
  
    var calledBack = false;
  
    var timeout = setTimeout(function () {
      raiseError('operations timed out');
    }, 2000);
  
    var raiseError = function (message) {
      if (!calledBack) {
        calledBack = true;
        return callback(new Error(message));
      }
    };
  
    var operations = '';
  
    clientInstance.data.on('/test/operations',
  
      function (data, meta) {
  
        operations += meta.action.toUpperCase().split('@')[0].replace(/\//g, '');
  
        if (operations === 'SETREMOVE') {
  
          clearTimeout(timeout);
  
          callback();
        }
  
      }, function (e) {
  
        if (e) return raiseError(e.toString());
  
        clientInstance.data.set('/test/operations', {test: 'data'}, function (e) {
  
          if (e) return raiseError(e.toString());
  
          clientInstance.data.remove('/test/operations', function (e) {
  
            if (e) return raiseError(e.toString());
          });
        });
      });
  };
  
  testService (id, callback) {
  
    var _this = this;
  
    if (!callback) throw new Error('callback cannot be null');
  
    if (id == null || typeof id == 'function') {
      return callback(new Error('id is necessary to test a service.'));
    }
  
    var service = _this.findService(id);
  
    if (!service) return callback(new Error('unable to find service with id: ' + id));
  
    var clientConfig = JSON.parse(JSON.stringify(service.config));
  
    _this.getClient(clientConfig, function (e, client) {
  
      if (e) return callback(e);
  
      _this.testClientData(client.instance, function (e) {
  
        if (e) return callback(e);
  
        _this.testClientComponent(client.instance, client.config.__testOptions, callback);
      });
    });
  }
  
  tearDown (options, callback) {
  
    if (typeof options == 'function') {
      callback = options;
      options = {};
    }
  
    var timeout = Object.keys(this.__activeServices).length * 10000;
  
    var timedOut = false;
  
    if (options.ttl) {
      if (typeof options.ttl != 'number')
        timeout = options.ttl;
    }
  
    var timeoutHandle = setTimeout(function () {
      timedOut = true;
      return callback(new Error('tearDown timed out'));
    }, timeout);
  
    var _this = this;
  
    this.async.eachSeries(Object.keys(_this.__activeServices), function (activeServiceId, activeServiceCB) {
  
      if (timedOut) return activeServiceCB(new Error('timed out'));
  
      _this.stopService(activeServiceId, activeServiceCB);
  
    }, function (e) {
  
      _this.deleteFiles();
  
      if (!timedOut) clearTimeout(timeoutHandle);
  
      callback(e);
    });
  };
}

module.exports = TestHelper;
