var path = require('path');
var filename = path.basename(__filename);
var hooks = require('../lib/hooks');

var testSequence = parseInt(filename.split('-')[0]);
var clusterSize = 10;
var happnSecure = true;

require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  context('test container', function () {
    hooks.startCluster({
      testSequence,
      size: clusterSize,
      happnSecure: happnSecure,
    });

    it('each server stabilised with all 10 peers', function (done) {
      var self = this;

      var peerCounts = [];
      self.servers.forEach(function (server) {
        var count = Object.keys(server.services.orchestrator.peers).length;
        peerCounts.push(count);
      });

      test.expect(peerCounts).to.eql([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
      done();
    });

    hooks.stopCluster();

    after(function () {
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
