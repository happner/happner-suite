const HappnCluster = require('../..');
const hooks = require('../lib/hooks');
const testUtils = require('../lib/test-utils');
const clusterSize = 10;
const happnSecure = false;
const EventKeys = require('../../lib/constants/event-keys');
let configs = [
  {
    size: clusterSize,
    happnSecure: happnSecure,
  }, // Single service ('happn-cluster-node')
  {
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
    config.deploymentId = test.commons.uuid.v4();
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(config);

    before('create extra config', async function () {
      if (!config.clusterConfig)
        this.extraConfig = (
          await testUtils.createMemberConfigs(config.deploymentId, 1, false, false, {})
        ).pop();
      else {
        this.extraConfig = (
          await testUtils.createMultiServiceMemberConfigs(
            config.deploymentId,
            1,
            false,
            false,
            {},
            {
              'cluster-service-1': 4,
              'cluster-service-2': 6,
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
        server.services.membership.clusterPeerService.on(
          EventKeys.PEER_CONNECTED,
          function (peerInfo) {
            emittedAdd[i] = peerInfo;
          }
        );

        server.services.membership.clusterPeerService.on(
          EventKeys.PEER_DISCONNECTED,
          function (peerInfo) {
            emittedRemove[i] = peerInfo;
          }
        );
      });

      HappnCluster.create(this.extraConfig)

        .then(function (server) {
          _this.servers.push(server); // add new server at end
        })

        .then(function () {
          return testUtils.awaitExactPeerCount(_this.servers);
        })

        .then(function () {
          _this.servers.pop().stop({ reconnect: false }); // remove and stop new server
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
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
