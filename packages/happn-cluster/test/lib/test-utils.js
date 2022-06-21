/**
 * Created by grant on 2016/10/05.
 */

var Mongo = require('./mongo');
const Util = require('util');
var mongoUrl = 'mongodb://127.0.0.1:27017';
var mongoCollection = 'happn-cluster';
module.exports.clearMongoCollection = function (callback, mongoCollectionArg, mongoUrlArg) {
  Mongo.clearCollection(mongoUrlArg || mongoUrl, mongoCollectionArg || mongoCollection, callback);
};

module.exports.createMemberConfigs = Util.promisify(function (
  testSequence,
  clusterSize,
  happnSecure,
  proxySecure,
  services,
  callback
) {
  var transport = null;

  // var happnPortBase = testSequence * 200 + 1025;
  // var swimPortBase = happnPortBase + clusterSize * 2;
  // var proxyPortBase = swimPortBase + clusterSize * 2;

  if (happnSecure) {
    transport = {
      mode: 'https',
      certPath: 'test/keys/happn.com.cert',
      keyPath: 'test/keys/happn.com.key',
    };
  }

  var configs = [];
  var i = 0;

  function ammendConfig(config) {
    Object.keys(services).forEach(function (serviceName) {
      var ammendDefaultService = services[serviceName];
      Object.keys(ammendDefaultService).forEach(function (keyName) {
        if (!config.services[serviceName])
          config.services[serviceName] = {
            config: {},
          };
        config.services[serviceName].config[keyName] = ammendDefaultService[keyName];
      });
    });
  }

  while (i < clusterSize) {
    i++;

    var config = {
      port: 0, // happnPortBase + i,
      transport: transport,
      services: {
        data: {
          config: {
            datastores: [
              {
                name: 'mongo',
                provider: 'happn-db-provider-mongo',
                isDefault: true,
                settings: {
                  collection: mongoCollection,
                  database: mongoCollection,
                  url: mongoUrl,
                },
              },
            ],
          },
        },
        orchestrator: {
          config: {
            clusterName: 'cluster1',
            minimumPeers: clusterSize,
            deployment: 'myDeploy',
            timing: {
              keepAlive: 1e3,
              memberRefresh: 2e3,
              keepAliveThreshold: 2e3,
            },
          },
        },
        proxy: {
          config: {
            host: '0.0.0.0',
            port: 0, // proxyPortBase + i,
            allowSelfSignedCerts: true,
          },
        },
      },
    };

    if (happnSecure) {
      config.secure = true;
      config.services.security = {
        config: {
          adminUser: {
            username: '_ADMIN',
            password: 'secret',
          },
        },
      };
    }

    if (proxySecure) {
      config.services.proxy.config.certPath = 'test/keys/proxy.com.cert';
      config.services.proxy.config.keyPath = 'test/keys/proxy.com.key';
    }

    ammendConfig(config);

    configs.push(config);
  }

  callback(null, configs);
});

module.exports.createMultiServiceMemberConfigs = Util.promisify(function (
  testSequence,
  clusterSize,
  happnSecure,
  proxySecure,
  services,
  clusterConfig,
  callback
) {
  var transport = null;


  if (happnSecure) {
    transport = {
      mode: 'https',
      certPath: 'test/keys/happn.com.cert',
      keyPath: 'test/keys/happn.com.key',
    };
  }
  let clusterServiceNameArr = Object.entries(clusterConfig).reduce(
    (serviceNameArray, [name, number]) => {
      return serviceNameArray.concat(Array(number).fill(name));
    },
    []
  );
  var configs = [];
  var i = 0;

  function ammendConfig(config) {
    Object.keys(services).forEach(function (serviceName) {
      var ammendDefaultService = services[serviceName];
      Object.keys(ammendDefaultService).forEach(function (keyName) {
        if (!config.services[serviceName])
          config.services[serviceName] = {
            config: {},
          };
        config.services[serviceName].config[keyName] = ammendDefaultService[keyName];
      });
    });
  }

  while (i < clusterSize) {
    i++;

    var config = {
      port: 0,
      transport: transport,
      services: {
        data: {
          config: {
            datastores: [
              {
                name: 'mongo',
                provider: 'happn-db-provider-mongo',
                isDefault: true,
                settings: {
                  collection: mongoCollection,
                  database: mongoCollection,
                  url: mongoUrl,
                },
              },
            ],
          },
        },
        orchestrator: {
          config: {
            clusterName: 'cluster1',
            minimumPeers: clusterSize,
            deployment: 'myDeploy',
            cluster: clusterConfig,
            serviceName: clusterServiceNameArr[i - 1],
            timing: {
              keepAlive: 2e3,
              memberRefresh: 3e3,
              keepAliveThreshold: 3e3,
              stabilisedTimeout: 7e3,
            },
          },
        },
        proxy: {
          config: {
            host: '0.0.0.0',
            port: 0,
            allowSelfSignedCerts: true,
          },
        },
      },
    };

    if (happnSecure) {
      config.secure = true;
      config.services.security = {
        config: {
          adminUser: {
            username: '_ADMIN',
            password: 'secret',
          },
        },
      };
    }

    if (proxySecure) {
      config.services.proxy.config.certPath = 'test/keys/proxy.com.cert';
      config.services.proxy.config.keyPath = 'test/keys/proxy.com.key';
    }

    ammendConfig(config);

    configs.push(config);
  }

  callback(null, configs);
});

module.exports.awaitExactMembershipCount = Util.promisify(function (servers, count, callback) {
  // Changed to await > or equal member count, as members are updated faster
  var interval,
    gotExactCount = false;

  if (typeof count === 'function') {
    callback = count;
    count = servers.length;
  }

  interval = setInterval(function () {
    if (servers.length !== count) return;
    gotExactCount = true;

    servers.forEach(function (server) {
      if (Object.keys(server.services.orchestrator.members).length < count - 1) {
        gotExactCount = false;
      }
    });

    if (gotExactCount) {
      clearInterval(interval);
      callback();
    }
  }, 100);
});

module.exports.awaitExactPeerCount = Util.promisify(function (servers, count, callback) {
  var interval,
    gotExactCount = false;

  if (typeof count === 'function') {
    callback = count;
    count = servers.length;
  }

  interval = setInterval(function () {
    if (servers.length !== count) return;

    gotExactCount = true;

    servers.forEach(function (server) {
      if (Object.keys(server.services.orchestrator.peers).length !== count) {
        gotExactCount = false;
      }
    });

    if (gotExactCount) {
      clearInterval(interval);
      callback();
    }
  }, 100);
});

module.exports.createClientInstance = function (host, port, callback) {
  require('happn-3').client.create(
    {
      config: {
        secure: true,
        host: host,
        port: port,
        protocol: 'http',
        allowSelfSignedCerts: true,
        username: '_ADMIN',
        password: 'secret',
      },
    },
    function (err, response) {
      if (err) return callback(err);

      callback(null, response);
    }
  );
};
