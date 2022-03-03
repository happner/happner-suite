
var path = require('path');
var filename = path.basename(__filename);

var HappnCluster = require('../..');
var Member = require('../../lib/services/orchestrator/member');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 3;
var happnSecure = false;

let configs = [
  {
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
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
configs.forEach((config) => {
  require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(config);

    before('create extra config', async function () {
      if (!config.clusterConfig)
        this.extraConfig = (
          await testUtils.createMemberConfigs(testSequence, clusterSize + 1, false, false, {})
        ).pop();
      else {
        this.extraConfig = (
          await testUtils.createMultiServiceMemberConfigs(
            testSequence,
            clusterSize + 1,
            false,
            false,
            {},
            {
              'cluster-service-1': 2,
              'cluster-service-2': 2,
            }
          )
        ).pop();
      }
    });

    before('backup functions being stubbed', function () {
      this.originalSubscribe = Member.prototype.__subscribe;
    });

    after('restore functions being stubbed', function () {
      Member.prototype.__subscribe = this.originalSubscribe;
    });

    it('stops the server on failure to stabilise', async function () {
      Member.prototype.__subscribe = async function () {
        return new Promise(function (resolve, reject) {
          reject(new Error('Fake failure to subscribe'));
        });
      };
      await testUtils.awaitExactPeerCount(this.servers, clusterSize);

      try {
        let server = await HappnCluster.create(this.extraConfig);
        if (server) this.servers.push(server); //For stop
        throw new Error('should not have started');
      } catch (error) {
        test.expect(error.message).to.equal('Fake failure to subscribe');
      }
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
