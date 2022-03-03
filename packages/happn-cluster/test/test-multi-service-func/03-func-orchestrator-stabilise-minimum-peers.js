var path = require('path');
var filename = path.basename(__filename);
var expect = require('expect.js');
var HappnCluster = require('../..');
var Orchestrator = require('../../lib/services/orchestrator');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');
const wait = require('await-delay');
var testSequence = parseInt(filename.split('-')[0]);
var clusterSize = 3;

describe(filename, function () {
  this.timeout(35000);

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

    // set waiting interval to start last peer

    interval = setInterval(function () {
      if (Object.keys(readyNames).length !== clusterSize - 1) return;
      clearInterval(interval);

      HappnCluster.create(lastConfig).then(function (server) {
        self.servers.push(server);
      });
      // .catch();
    }, 10);

    // start the first clusterSize - 1 peers

    configs = await testUtils.createMemberConfigs(testSequence, clusterSize, false, false, {});

    expect(configs[0].services.orchestrator.config.minimumPeers).to.equal(clusterSize);
    lastConfig = configs.pop();
    let servers = [];
    servers.push(HappnCluster.create(configs[0]));
    await wait(1000);
    // start first peer immediately and others a moment
    // later so they don't all fight over creating the
    // admin user in the shared database
    for (let [sequence, config] of configs.entries()) {
      if (sequence === 0) {
        continue;
      }
      servers.push(HappnCluster.create(config));
    }
    self.servers = await Promise.all(servers);

    //   await Promise.all(return Promise.resolve(configs).map(function(config, sequence) {
    //     if (sequence === 0) {
    //       return (
    //         HappnCluster.create(config)
    //           .then(function(server) {
    //             self.servers.push(server);
    //           })
    //           // can't reject the entire set on one failure,
    //           // because we need to accumulate those that did start
    //           // for hooks.stopCluster();
    //           .catch(function() {})
    //       );
    //     }
    //     return Promise.delay(500)
    //       .then(function() {
    //         return HappnCluster.create(config);
    //       })
    //       .then(function(server) {
    //         self.servers.push(server);
    //       })
    //       .catch(function() {});
    //   });
    // })

    // .then(function() {
    await testUtils.awaitExactMembershipCount(self.servers, clusterSize);

    await testUtils.awaitExactPeerCount(self.servers, clusterSize);
    // })

    // .then(done)
    // .catch(done)

    // .finally(function() {
    clearInterval(interval);
    // });
  });

  hooks.stopCluster();

  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
