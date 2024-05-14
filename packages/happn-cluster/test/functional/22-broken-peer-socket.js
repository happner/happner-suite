var path = require('path');
var filename = path.basename(__filename);

var hooks = require('../lib/hooks');
var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 2;
var happnSecure = true;
let testConfigs = [
  {
    testSequence: testSequence,
    size: clusterSize,
    happnSceure: happnSecure,
  }, // Single service ('happn-cluster-node')
  {
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
    clusterConfig: {
      'cluster-service-1': 1,
      'cluster-service-2': 1,
    }, //Multiple services
  },
];
testConfigs.forEach((testConfig) => {
  require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
    hooks.startCluster({
      ...testConfig,
      services: {
        session: {
          primusOpts: {
            maxLength: 100000, // 100kb
          },
        },
      },
    });

    after(() => {
      testSequence++;
    });

    hooks.stopCluster();

    it('it sends a big message to a specific cluster peer, causing the socket to break - we ensure the cluster is reconstructed', function (done) {
      let clusterPeerService = this.servers[0].container.dependencies.clusterPeerService;
      test.expect(clusterPeerService.peerCount).to.be(1);
      let memberClient = clusterPeerService.peerConnectors[0].client;
      memberClient.set('test/big/message', getBigMessage(), (e) => {
        // eslint-disable-next-line no-console
        console.log(e);
      });
      setTimeout(() => {
        test.expect(clusterPeerService.peerCount).to.be(1);
        done();
      }, 5000);
    });

    function getBigMessage() {
      let content = require('fs').readFileSync(path.resolve(__dirname, '../files/100kb.txt'));
      return {
        content,
      };
    }
  });
});
