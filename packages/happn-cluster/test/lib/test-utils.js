/**
 * Created by grant on 2016/10/05.
 */

var Mongo = require('./mongo');
const Util = require('util');
const mongoUrl = 'mongodb://127.0.0.1:27017';
const mongoCollection = 'happn-cluster';
const path = require('path');
module.exports.clearMongoCollection = function (callback, mongoCollectionArg, mongoUrlArg) {
  Mongo.clearCollection(mongoUrlArg || mongoUrl, mongoCollectionArg || mongoCollection, callback);
};

module.exports.createMemberConfigs = function (
  deploymentId,
  clusterSize,
  happnSecure,
  proxySecure,
  services
) {
  var transport = null;

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
        proxy: {
          config: {
            host: '0.0.0.0',
            port: 0,
            allowSelfSignedCerts: true,
          },
        },
        membership: {
          config: {
            // dynamic (uuid) for the current deployment, so we dont have old membership data being acted on
            deploymentId,
            // a virtual cluster grouping, inside this deployment
            clusterName: 'clusterName',
            // abort start and exit, as dependencies and members not found on startup cycle
            discoverTimeoutMs: 5e3,
            healthReportIntervalMs: 1e3,
            // announce presence every 500ms
            pulseIntervalMs: 5e2,
            // check membership registry every 3 seconds
            memberScanningIntervalMs: 3e3,
            // intra-cluster credentials
            clusterUsername: '_CLUSTER',
            clusterPassword: 'PASSWORD',
            // event paths we want to replicate on, in this case everything
            replicationPaths: ['**'],
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
      config.services.membership.config.clusterPublicKey = path.resolve(
        __dirname,
        '../keys/cluster.key.pub'
      );
      config.services.membership.config.clusterPrivateKey = path.resolve(
        __dirname,
        '../keys/cluster.key'
      );
    }

    if (proxySecure) {
      config.services.proxy.config.certPath = path.resolve(__dirname, '../keys/proxy.com.cert');
      config.services.proxy.config.keyPath = path.resolve(__dirname, '../keys/proxy.com.key');
    }

    ammendConfig(config);

    configs.push(config);
  }

  return configs;
};

module.exports.createMultiServiceMemberConfigs = function (
  deploymentId,
  clusterSize,
  happnSecure,
  proxySecure,
  services,
  clusterConfig
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
        proxy: {
          config: {
            host: '0.0.0.0',
            port: 0,
            allowSelfSignedCerts: true,
          },
        },
        membership: {
          config: {
            // dynamic (uuid) for the current deployment, so we dont have old membership data being acted on
            deploymentId,
            // a virtual cluster grouping, inside this deployment
            clusterName: 'clusterName',
            // classification for the set of services this member provides, members with the same service name should be identical
            serviceName: clusterServiceNameArr[i - 1],
            // abort start and exit, as dependencies and members not found on startup cycle
            discoverTimeoutMs: 5e3,
            healthReportIntervalMs: 1e3,
            // announce presence every 500ms
            pulseIntervalMs: 5e2,
            // check membership registry every 3 seconds
            memberScanningIntervalMs: 3e3,
            // only stabilise if members with correct services and counts are present
            dependencies: Object.fromEntries(
              Object.entries(clusterConfig).filter(([key]) => key !== clusterServiceNameArr[i - 1])
            ),
            // intra-cluster credentials
            clusterUsername: '_CLUSTER',
            clusterPassword: 'PASSWORD',
            // event paths we want to replicate on, in this case everything
            replicationPaths: ['**'],
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
      config.services.membership.config.clusterPublicKey = path.resolve(
        __dirname,
        '../keys/cluster.key.pub'
      );
      config.services.membership.config.clusterPrivateKey = path.resolve(
        __dirname,
        '../keys/cluster.key'
      );
    }

    if (proxySecure) {
      config.services.proxy.config.certPath = 'test/keys/proxy.com.cert';
      config.services.proxy.config.keyPath = 'test/keys/proxy.com.key';
    }

    ammendConfig(config);

    configs.push(config);
  }

  return configs;
};

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
      if (server.services.membership.clusterPeerService.peerCount < count - 1) {
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
      if (server.services.membership.clusterPeerService.peerCount !== count - 1) {
        gotExactCount = false;
      }
    });

    if (gotExactCount) {
      clearInterval(interval);
      callback();
    }
  }, 1e3);
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
