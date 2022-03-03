var path = require('path');
var filename = path.basename(__filename);
var net = require('net');

var hooks = require('../lib/hooks');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 1;
var happnSecure = false;

require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  hooks.startCluster({
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
    services: {
      proxy: {
        defer: true,
      },
    },
  });

  it('deferred proxy does not start the proxy until start is called', function (done) {
    var _this = this;

    var port = this.__configs[0].services.proxy.config.port;

    var connection = net.connect(port);

    connection.on('connect', function () {
      connection.destroy();
      done(new Error('should not be listening'));
    });

    connection.on('error', function (e) {
      test.expect(e.code).to.be('ECONNREFUSED');

      _this.servers[0].services.proxy
        .start()

        .then(function () {
          var connection = net.connect(port);

          connection.on('connect', function () {
            connection.destroy();
            done();
          });
        })

        .catch(done);
    });
  });

  hooks.stopCluster();

  after(function () {
    testSequence++;
    process.env.LOG_LEVEL = this.logLevel;
  });
});
