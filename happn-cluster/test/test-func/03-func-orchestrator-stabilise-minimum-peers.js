var path = require('path');
var filename = path.basename(__filename);
var HappnCluster = require('../..');
var Orchestrator = require('../../lib/services/orchestrator');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]);
var clusterSize = 3;

require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  // hooks.startCluster({
  //   size: clusterSize,
  //   happnSecure: happnSecure
  // });

  before('backup functions being mocked', function () {
    this.original__stateUpdate = Orchestrator.prototype.__stateUpdate;
  });

  after('restore functions being mocked', function () {
    Orchestrator.prototype.__stateUpdate = this.original__stateUpdate;
  });

  it('pends the stabilise callback till after minimumPeers are fully connected', function (done) {
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

    // set waiting interval to start last peer

    interval = setInterval(function () {
      if (Object.keys(readyNames).length !== clusterSize - 1) return;
      clearInterval(interval);

      HappnCluster.create(lastConfig)
        .then(function (server) {
          self.servers.push(server);
        })
        .catch(done);
    }, 10);

    // start the first clusterSize - 1 peers

    Promise.resolve()

      .then(function () {
        return testUtils.createMemberConfigs(testSequence, clusterSize, false, false, {});
      })

      .then(function (_configs) {
        configs = _configs;
        // relying on minimumPeers being configured in createMemberConfigs
        test.expect(configs[0].services.orchestrator.config.minimumPeers).to.equal(clusterSize);
        lastConfig = configs.pop();
      })

      .then(function () {
        return createClusters(self, configs);
      })

      .then(function () {
        return testUtils.awaitExactMembershipCount(self.servers, clusterSize);
      })

      .then(function () {
        return testUtils.awaitExactPeerCount(self.servers, clusterSize);
      })

      .then(done)
      .catch(done)

      .finally(function () {
        clearInterval(interval);
      });
  });

  async function createClusters(self, configs) {
    let sequence = 0;
    let unresolved = [];
    for (let config of configs) {
      if (sequence > 0) {
        await test.delay(500);
      }
      unresolved.push(HappnCluster.create(config));

      sequence++;
    }
    await test.delay(2000);
    for (let promise of unresolved) {
      self.servers.push(await promise);
    }
  }

  hooks.stopCluster();

  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
