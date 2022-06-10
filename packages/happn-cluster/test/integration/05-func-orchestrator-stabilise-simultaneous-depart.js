var path = require('path');
var filename = path.basename(__filename);

var HappnCluster = require('../..');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 3;
var happnSecure = false;

// eslint-disable-next-line no-unused-vars
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
  require('../lib/test-helper').describe({ timeout: 120e3 }, function () {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(testConfig);

    it('starting a new member survives when stopping an existing member simultaneously', async function () {
      // the starting member receives the membership list which includes the departed member
      // so it attempts to login to the departed member - only discovering later (swim lag)
      // that the departed member is departed.
      //
      // so it gets ECONNREFUSED
      //
      // safe at this point to assume the member is not there (literally no socket listening)
      // so the member is removed from the test.expectation list of members-that-must-be-connected-to-for-stabilise
      let config;
      if (!testConfig.clusterConfig)
        config = (
          await testUtils.createMemberConfigs(testSequence, clusterSize + 1, false, false, {})
        ).pop();
      else {
        config = (
          await testUtils.createMultiServiceMemberConfigs(
            testSequence,
            clusterSize,
            false,
            false,
            {},
            {
              'cluster-service-1': 1,
              'cluster-service-2': 2,
            }
          )
        ).pop();
      }

      // increment ports to one beyond last existing peer
      config.port++;
      // config.services.membership.config.port++;
      config.services.proxy.config.port++;
      // console.log(config)
      var stopServer = this.servers.pop();
      setTimeout(function () {
        stopServer.stop({ reconnect: false });
      }, 1500);

      config.services.orchestrator.config.minimumPeers--;
      let newServer = await HappnCluster.create(config);

      this.servers.push(newServer);

      await testUtils.awaitExactMembershipCount(this.servers);
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
