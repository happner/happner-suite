var ipAddress = require('../../lib/utils/get-address')();

module.exports = function (seq, name) {
  var config = {
    name: name,
    // announceHost: '192.168.0.101',
    secure: true,
    services: {
      security: {
        config: {
          adminUser: {
            username: '_ADMIN',
            password: 'happn',
          },
        },
      },
      data: {
        config: {
          datastores: [
            //mongo is defaulted:
            // {
            //     name: 'mongo',
            //     provider: 'happn-db-provider-mongo',
            //     settings: {
            //         collection: process.env.MONGO_COLLECTION || 'happn-cluster',
            //         database: process.env.MONGO_DATABASE || 'happn-cluster',,
            //         url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
            //     },
            //     isDefault: true,
            // },
          ],
        },
      },
      orchestrator: {
        config: {
          // minimumPeers: 6,
          // replicate: ['/*'], //  ['/something/*', '/else'],
          // stableReportInterval: 2000,
          // stabiliseTimeout: 10 * 1000,
        },
      },
      membership: {
        config: {
          join: 'static',
          seed: seq === 0,
          port: 56000 + seq,
          hosts: [ipAddress + ':56000', ipAddress + ':56001', ipAddress + ':56002'],
          // hosts: ['192.168.0.101' + ':56000' , '192.168.0.101' + ':56001', '192.168.0.101' + ':56002']
        },
      },
      proxy: {
        config: {
          port: 55000 + seq,
        },
      },
    },
    port: 57000 + seq,
  };

  return config;
};
