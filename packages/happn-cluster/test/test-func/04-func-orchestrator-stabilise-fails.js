var path = require('path');
var filename = path.basename(__filename);

var HappnCluster = require('../..');
var Member = require('../../lib/services/orchestrator/member');
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

  before('create extra config', function (done) {
    var _this = this;
    testUtils.createMemberConfigs(
      testSequence,
      clusterSize + 1,
      false,
      false,
      {},
      function (e, configs) {
        if (e) return done(e);
        _this.extraConfig = configs.pop();
        done();
      }
    );
  });

  before('backup functions being stubbed', function () {
    this.originalSubscribe = Member.prototype.__subscribe;
  });

  after('restore functions being stubbed', function () {
    Member.prototype.__subscribe = this.originalSubscribe;
  });

  it('stops the server on failure to stabilise', function (done) {
    Member.prototype.__subscribe = function () {
      return new Promise(function (resolve, reject) {
        reject(new Error('Fake failure to subscribe'));
      });
    };

    HappnCluster.create(this.extraConfig)

      .then(function (server) {
        return server.stop({ reconnect: false });
      })

      .then(function () {
        throw new Error('should not have started');
      })

      .catch(function (error) {
        test.expect(error.message).to.equal('Fake failure to subscribe');
        done();
      })

      .catch(done);
  });

  hooks.stopCluster();

  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
