var path = require('path');
var filename = path.basename(__filename);
var HappnCluster = require('../..');
var Orchestrator = require('../../lib/services/orchestrator');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 3;

let clusterConfigs = [
  null,
  {
    'cluster-service-1': 1,
    'cluster-service-2': 2,
  },
];
clusterConfigs.forEach((clusterConfig) => {
  require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    before('backup functions being mocked', function () {
      this.original__stateUpdate = Orchestrator.prototype.__stateUpdate;
    });

    after('restore functions being mocked', function () {
      Orchestrator.prototype.__stateUpdate = this.original__stateUpdate;
    });

    it('pends the stabilise callback till after minimumPeers are fully connected', async function () {
      var self = this;
      var configs;
      var lastConfig;
      var interval;

      self.servers = []; // servers for hooks.stopCluster(); to stop

      // because we get no callback before stabilise we need to intercept internally in order
      // to know when to start the last server such that we're actually testing for minimumPeers

      var readyNames = {};
      Orchestrator.prototype.__stateUpdate = function () {
        // call original so that nothing is out of the ordinary,
        // `this` refers to the orchestrator instance for the necessary context
        self.original__stateUpdate.call(this);
        if (Object.keys(this.peers).length === clusterSize - 1) {
          // got all the peers we should have in order to trigger starting the last one
          readyNames[this.happn.name] = 1;
        }
      };

      // set test.delaying interval to start last peer

      // start the first clusterSize - 1 peers
      if (clusterConfig) {
        configs = await testUtils.createMultiServiceMemberConfigs(
          testSequence,
          clusterSize,
          false,
          false,
          {},
          clusterConfig
        );
      } else {
        configs = await testUtils.createMemberConfigs(testSequence, clusterSize, false, false, {});
        test.expect(configs[0].services.orchestrator.config.minimumPeers).to.equal(clusterSize);
      }
      lastConfig = configs.pop();
      let servers = [];
      interval = setInterval(async function () {
        if (Object.keys(readyNames).length < clusterSize - 1) return;
        clearInterval(interval);
        let server = await HappnCluster.create(lastConfig);
        self.servers.push(server);
      }, 100);

      servers.push(HappnCluster.create(configs[0]));
      await test.delay(1000);
      // start first peer immediately and others a moment
      // later so they don't all fight over creating the
      // admin user in the shared database
      for (let [sequence, config] of configs.entries()) {
        if (sequence === 0) {
          continue;
        }
        servers.push(HappnCluster.create(config));
      }
      //We actually hear back from the last server created above first, so need to concat;
      self.servers = self.servers.concat(await Promise.all(servers));
      await testUtils.awaitExactMembershipCount(self.servers, clusterSize);
      await testUtils.awaitExactPeerCount(self.servers, clusterSize);
      clearInterval(interval);
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
