var path = require('path');
var filename = path.basename(__filename);
var hooks = require('../lib/hooks');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 10;
let membershipDs = {
  name: 'mongo-membership',
  provider: 'happn-db-provider-mongo',
  patterns: ['/SYSTEM/DEPLOYMENT/*'],
  settings: {
    collection: 'happn-cluster-membership',
    database: 'happn-cluster-membership',
    url: 'mongodb://127.0.0.1:27017',
  },
};
let configs = [
  {
    testSequence: testSequence,
    size: clusterSize,
    datastore: membershipDs,
  }, // Single service ('happn-cluster-node')
//   {
//     testSequence: testSequence,
//     size: clusterSize,
//     clusterConfig: {
//       'cluster-service-1': 4,
//       'cluster-service-2': 6,
//     }, //Multiple services
//   },
];
configs.forEach((config) => {
  require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(config);

    xit('each server stabilised with all 10 peers', function (done) {
      const peerCounts = this.servers.map(
        (server) => Object.keys(server.services.orchestrator.peers).length
      );
      test.expect(peerCounts).to.eql([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
      test
        .expect(this.servers.every((server) => server.services.orchestrator.state === 'STABLE'))
        .to.be(true);
      done();
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
