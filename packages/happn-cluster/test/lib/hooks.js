process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var path = require('path');
var ChildProcess = require('child_process');
var clone = require('clone');
var HappnCluster = require('../../');
var testUtils = require('./test-utils');
const test = require('happn-commons-test').create();

module.exports.startCluster = function (clusterOpts) {
  var testSequence = clusterOpts.testSequence || 1;
  var clusterSize = clusterOpts.size || 5;
  var happnSecure = typeof clusterOpts.happnSecure === 'boolean' ? clusterOpts.happnSecure : false;
  var proxySecure = typeof clusterOpts.proxySecure === 'boolean' ? clusterOpts.proxySecure : false;
  var services = clusterOpts.services || {};

  before('clear collection (before)', function (done) {
    testUtils.clearMongoCollection(done);
  });

  before('start cluster', async function () {
    var self = this;

    self.__configs = await testUtils.createMemberConfigs(
      testSequence,
      clusterSize,
      happnSecure,
      proxySecure,
      services
    );
    let sequence = 0;
    self.servers = [];
    for (let config of self.__configs) {
      if (sequence > 0) {
        await test.delay(2000);
      }
      HappnCluster.create(clone(config)).then((server) => {
        self.servers.push(server);
      });
      sequence++;
    }
    await test.delay(10000);
  });
};

module.exports.stopCluster = function () {
  after('stop cluster', async function () {
    if (!this.servers) return;
    for (let server of this.servers) {
      await server.stop({ reconnect: false });
    }
  });

  after('clear collection (after)', function (done) {
    testUtils.clearMongoCollection(done);
  });
};

module.exports.startMultiProcessCluster = function (clusterOpts) {
  let Promise = test.bluebird;
  before('multi clear collection (before)', function (done) {
    testUtils.clearMongoCollection(done);
  });

  var testSequence = clusterOpts.testSequence || 1;
  var clusterSize = clusterOpts.size || 5;
  var happnSecure = typeof clusterOpts.happnSecure === 'boolean' ? clusterOpts.happnSecure : false;
  var proxySecure = typeof clusterOpts.proxySecure === 'boolean' ? clusterOpts.proxySecure : false;
  var services = clusterOpts.services || {};

  var peerPath = __dirname + path.sep + 'peer.js';

  before('start cluster', function (done) {
    var self = this;

    testUtils.createMemberConfigs(
      testSequence,
      clusterSize,
      happnSecure,
      proxySecure,
      services,
      function (err, result) {
        if (err) return done(err);

        self.__configs = result;

        Promise.resolve(self.__configs)
          .map(function (config) {
            var configJson = [JSON.stringify(config)];

            return new Promise(function (resolve) {
              var peerProcess = ChildProcess.fork(peerPath, configJson);
              peerProcess.on('message', function (message) {
                if (message === 'ready') return resolve(peerProcess);
              });
            });
          })

          .then(function (processes) {
            self.peerProcesses = processes;
            self.servers = 'see .peerProcesses[n].send';
          })
          .then(function (e) {
            done(e);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });
};

module.exports.stopMultiProcessCluster = function () {
  after('stop cluster', function (done) {
    if (!this.peerProcesses) return done();
    this.peerProcesses.forEach(function (proc) {
      proc.kill();
    });
    done();
  });

  after('multi clear collection (after)', function (done) {
    testUtils.clearMongoCollection(done);
  });
};
