var path = require('path');
var filename = path.basename(__filename);
var hooks = require('../lib/hooks');
const { MongoClient } = require('mongodb');
const { STABLE } = require('../../lib/constants/member-statuses');
const client = new MongoClient('mongodb://127.0.0.1:27017');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 10;
let membershipDs = {
  name: 'mongo-membership',
  provider: 'happn-db-provider-mongo',
  patterns: ['/SYSTEM/DEPLOYMENT/*'],
  settings: {
    collection: 'happn-cluster',
    database: 'happn-cluster',
    url: 'mongodb://127.0.0.1:27017',
  },
};

let configs = [
  {
    testSequence: testSequence,
    size: clusterSize,
    datastore: membershipDs,
  }, // Single service ('happn-cluster-node')
  {
    testSequence: testSequence,
    size: clusterSize,
    datastore: membershipDs,
    clusterConfig: {
      'cluster-service-1': 4,
      'cluster-service-2': 6,
    }, //Multiple services
  },
];
configs.forEach((config) => {
  require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.clearNamedCollection('happn-cluster-membership');

    hooks.startCluster(config);

    it('each server stabilised with all 10 peers', async function () {
      const peerCounts = this.servers.map(
        (server) => server.container.dependencies.clusterPeerService.peerCount
      );
      const totalPeerCount = peerCounts.reduce((total, peerCount) => total + peerCount);
      test.expect(totalPeerCount).to.eql((clusterSize - 1) * clusterSize);
      test
        .expect(
          this.servers.every(
            (server) => server.container.dependencies.membershipService.status === STABLE
          )
        )
        .to.be(true);
      await client.connect();
      let stored = await client
        .db(config.datastore.settings.database)
        .collection(config.datastore.settings.collection)
        .find({
          path: {
            $regex: /^\/_SYSTEM\/DEPLOYMENT\//,
          },
        })
        .toArray();
      try {
        stored.shift();
        let now = Date.now();
        test.expect(stored.length).to.be(clusterSize - 1);
        stored.forEach((result, index) => {
          test.expect(now - result.modified).to.be.below(5000);
          if (!config.clusterConfig) {
            test
              .expect(
                result.path.startsWith(
                  `/_SYSTEM/DEPLOYMENT/${this.deploymentId}/clusterName/default-service`
                )
              )
              .to.be(true);
          } else {
            stored.sort((resultA, resultB) => {
              return resultA.path < resultB.path ? -1 : 1;
            });

            if (index < 3) {
              test
                .expect(
                  result.path.startsWith(
                    `/_SYSTEM/DEPLOYMENT/${this.deploymentId}/clusterName/cluster-service-1`
                  )
                )
                .to.be(true);
            } else {
              test
                .expect(
                  result.path.startsWith(
                    `/_SYSTEM/DEPLOYMENT/${this.deploymentId}/clusterName/cluster-service-2`
                  )
                )
                .to.be(true);
            }
          }
          // test.expect(result.path.split('/').pop()).to.eql(result.data.endpoint);
        });

        let stored2 = await client.db('happn-cluster').collection('happn-cluster').find({}).toArray();
        test
          .expect(stored2.every((result) => !result.path.startsWith('/SYSTEM/DEPLOYMENT/myDeploy/')))
          .to.be(true); //Membership paths should not be stored in the mmain/default DB.
      } finally {
        await client.close();
      }
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
