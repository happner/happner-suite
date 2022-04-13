var path = require('path');
var filename = path.basename(__filename);
var HappnCluster = require('../..');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 10;
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
      'cluster-service-1': 4,
      'cluster-service-2': 6,
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
              'cluster-service-1': 4,
              'cluster-service-2': 7,
            }
          )
        ).pop();
      }
    });

    it('arriving and departing peers become known to all nodes', function (done) {
      var _this = this;

      var emittedAdd = {};
      var emittedRemove = {};

      this.servers.forEach(function (server, i) {
        server.services.orchestrator.on('peer/add', function (name, member) {
          emittedAdd[i] = member;
        });

        server.services.orchestrator.on('peer/remove', function (name, member) {
          emittedRemove[i] = member;
        });
      });

      HappnCluster.create(this.extraConfig)

        .then(function (server) {
          _this.servers.push(server); // add new server at end
        })

        .then(function () {
          return testUtils.awaitExactPeerCount(_this.servers);
        })

        .then(function () {
          var server = _this.servers.pop(); // remove and stop new server
          return server.stop({ reconnect: false });
        })
        .then(function () {
          return test.delay(6000); //Need time for peer to become stale in DB
        })
        .then(function () {
          return testUtils.awaitExactPeerCount(_this.servers);
        })

        .then(function () {
          // console.log(emittedAdd);
          test.expect(Object.keys(emittedAdd).length).to.equal(clusterSize);
          test.expect(Object.keys(emittedRemove).length).to.equal(clusterSize);
        })

        .then(done)
        .catch(done);
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
