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
      let orchestrator = this.servers[0].services.orchestrator;
      let memberClient = getMemberClientNotSelf(orchestrator);
      memberClient.set('test/big/message', getBigMessage(), (e) => {
        // eslint-disable-next-line no-console
        console.log(e);
      });
      setTimeout(() => {
        test.expect(Object.keys(orchestrator.members).length).to.be(2);
        done();
      }, 5000);
    });

    function getMemberClientNotSelf(orchestrator) {
      let client;
      Object.keys(orchestrator.peers).forEach((peerId) => {
        const peer = orchestrator.peers[peerId];
        if (!peer.self) client = peer.client;
      });
      return client;
    }

    function getBigMessage() {
      let content = require('fs').readFileSync(path.resolve(__dirname, '../files/100kb.txt'));
      return {
        content,
      };
    }
  });
});
