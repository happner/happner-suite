var path = require('path');
var filename = path.basename(__filename);
var HappnCluster = require('../../');

var hooks = require('../lib/hooks');
var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 5;
var happnSecure = true;

// eslint-disable-next-line no-unused-vars
require('../lib/test-helper').describe({ timeout: 90e3 }, function (test) {
  hooks.startCluster({
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
  });

  hooks.stopCluster();

  it('can restart a cluster peer', function (done) {
    var _this = this;
    var config = this.__configs[this.__configs.length - 1];

    function restart() {
      var server = _this.servers.pop();
      return server
        .stop()
        .then(function () {
          return HappnCluster.create(config);
        })
        .then(function (server) {
          _this.servers.push(server);
        });
    }

    restart()
      .then(function () {
        return restart();
      })
      .then(function () {
        return restart();
      })
      .then(function () {
        return restart();
      })
      .then(function () {
        return restart();
      })
      .then(function () {
        return restart();
      })
      .then(function () {
        return restart();
      })
      .then(done)
      .catch(done);
  });
});
