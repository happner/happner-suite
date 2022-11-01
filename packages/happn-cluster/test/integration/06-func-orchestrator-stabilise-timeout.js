var path = require('path');
var filename = path.basename(__filename);

var HappnCluster = require('../..');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 3;
var happnSecure = false;

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
      'cluster-service-2': 2,
    }, //Multiple services
  },
];
testConfigs.forEach((testConfig) => {
  require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(testConfig);

    it('stops the server after timeout on failure to stabilise', async function () {
      this.timeout(25000);
      try {
        await testUtils.awaitExactPeerCount(this.servers, clusterSize);
        let config;
        if (!testConfig.clusterConfig)
          config = (
            await testUtils.createMemberConfigs(testSequence, clusterSize + 1, false, false, {
              orchestrator: {
                minimumPeers: clusterSize + 2,
                stabiliseTimeout: 4000,
              },
            })
          ).pop();
        else {
          config = (
            await testUtils.createMultiServiceMemberConfigs(
              testSequence,
              clusterSize + 1,
              false,
              false,
              {
                orchestrator: {
                  stabiliseTimeout: 4000,
                },
              },
              {
                'cluster-service-1': 1,
                'cluster-service-2': 4,
              }
            )
          ).pop();
        }

        let server = await HappnCluster.create(config);
        this.servers.push(server); // for hooks.stopCluster()
        throw new Error('should not have started');
      } catch (error) {
        test.expect(error.name).to.match(/StabiliseTimeout/);
      }
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
