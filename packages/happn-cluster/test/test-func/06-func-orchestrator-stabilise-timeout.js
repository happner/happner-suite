var path = require('path');
var filename = path.basename(__filename);

var HappnCluster = require('../..');
var hooks = require('../lib/hooks');
var testUtils = require('../lib/test-utils');

var testSequence = parseInt(filename.split('-')[0]);
var clusterSize = 3;
var happnSecure = false;

require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  hooks.startCluster({
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
  });

  it('stops the server after timeout on failure to stabilise', function (done) {
    var _this = this;

    this.timeout(8000);

    Promise.resolve()

      .then(function () {
        return testUtils.createMemberConfigs(testSequence, clusterSize + 1, happnSecure, false, {
          orchestrator: {
            minimumPeers: clusterSize + 2,
            stabiliseTimeout: 2000,
          },
        });
      })

      .then(function (configs) {
        return configs.pop();
      })

      .then(function (config) {
        return HappnCluster.create(config);
      })

      .then(function (server) {
        _this.servers.push(server); // for hooks.stopCluster()
        done(new Error('should not have started'));
      })

      .catch(function (error) {
        test.expect(error.name).to.match(/StabiliseTimeout/);
        done();
      });
  });

  hooks.stopCluster();

  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
