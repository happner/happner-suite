/**
 * Created by grant on 2016/09/27.
 */

var path = require('path');
var filename = path.basename(__filename);
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 3;
var happnSecure = false;

var async = require('async');

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
  require('../lib/test-helper').describe({ timeout: 60e3 }, function () {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(testConfig);

    it('can create a happn client and send a get request via each proxy instance', function (done) {
      var self = this;

      async.eachSeries(
        self.servers,
        function (server, configCB) {
          let config = server.config;
          var port = config.services.proxy.config.port;
          var host = config.services.proxy.config.host;

          // create happn client instance and log in
          testUtils.createClientInstance(host, port, function (err, instance) {
            if (err) return configCB(err);

            // send get request for wildcard resources in root
            instance.get('/*', null, function (e) {
              if (e) return configCB(e);

              instance.disconnect(configCB);
            });
          });
        },
        done
      );
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
