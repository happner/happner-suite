var path = require('path');
var filename = path.basename(__filename);
var hooks = require('../lib/hooks');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 10;

let configs = [
  {
    testSequence: testSequence,
    size: clusterSize,
  }, // Single service ('happn-cluster-node')
  {
    testSequence: testSequence,
    size: clusterSize,
    clusterConfig: {
      'cluster-service-1': 4,
      'cluster-service-2': 6,
    }, //Multiple services
  },
].reduce(
  (arr, current) =>
    arr.concat([
      { ...current, happnSecure: true },
      { ...current, happnSecure: false },
    ]),
  []
);
configs.forEach((config) => {
  require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(config);

    it('each server stabilised with all 10 peers', async function () {
      const peerCounts = this.servers.map(
        (server) => server.container.dependencies.clusterPeerService.peerCount
      );
      const totalPeerCount = peerCounts.reduce((total, peerCount) => total + peerCount);
      test.expect(totalPeerCount).to.eql((clusterSize - 1) * clusterSize);
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
