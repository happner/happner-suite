require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var Happner = require('../../..');
  var fs = require('fs');
  var fsExtra = require('fs-extra');
  var homedir = require('homedir');
  var sep = require('path').sep;
  var version = require('../../../package.json').version;
  var cachedDirname = homedir() + sep + '.happner';
  var cachedFilename = cachedDirname + sep + 'api-client-' + version + '.min.js.gz';
  var request = require('request');
  var md5 = require('md5');

  var server;
  var previousEnv = process.env.NODE_ENV;

  before('remove cached file', function (done) {
    try {
      fsExtra.removeSync(cachedDirname);
      done();
    } catch (e) {
      done(e);
    }
  });

  before('start server', function (done) {
    process.env.NODE_ENV = 'production';
    Happner.create({ name: 'TEST1' })
      .then(function (_server) {
        server = _server;
      })
      .then(done)
      .catch(done);
  });

  after('stop server', function (done) {
    if (!server) return done();
    server.stop({ reconnect: false }, done);
    process.env.NODE_ENV = previousEnv;
  });

  it('caches api client to disk in production mode', function (done) {
    try {
      fs.lstatSync(cachedFilename);
      done();
    } catch (e) {
      done(e);
    }
  });

  it('uses cached script in production mode', function (done) {
    var anotherServer;
    var reAssembled = false;
    var Packager = require('../../../lib/system/packager');
    var originalAssemble = Packager.prototype.assemble;

    Packager.prototype.assemble = function () {
      reAssembled = true;
    };

    Happner.create({ name: 'TEST2', port: 55001 })
      .then(function (_server) {
        anotherServer = _server;
      })

      .then(function () {
        test.expect(reAssembled).to.be(false);
      })

      .then(function () {
        return new Promise(function (resolve, reject) {
          request('http://127.0.0.1:55001/api/client', function (e, response, body) {
            if (e) return reject(e);
            if (response.statusCode !== 200)
              return reject(new Error('untest.expected ' + response.statusCode));

            resolve(body);
          });
        });
      })

      .then(function (apiClientGzip) {
        var version = parseInt(process.version.toString().split('.')[0].replace('v', ''));

        if (version < 5) return;

        var file = fs.readFileSync(cachedFilename);
        test.expect(md5(file.toString())).to.be(md5(apiClientGzip));
      })

      .then(function () {
        Packager.prototype.assemble = originalAssemble;
        anotherServer.stop({ reconnect: false }, done);
      })

      .catch(function (error) {
        Packager.prototype.assemble = originalAssemble;
        if (!anotherServer) return done(error);
        anotherServer.stop({ reconnect: false }, function () {
          done(error);
        });
      });
  });

  it('does not use cached script in development mode', function (done) {
    var anotherServer;
    var reAssembled = false;
    var Packager = require('../../../lib/system/packager');
    var originalAssemble = Packager.prototype.assemble;

    Packager.prototype.assemble = function () {
      reAssembled = true;
    };

    delete process.env.NODE_ENV;

    Happner.create({ name: 'TEST3', port: 55002 })
      .then(function (_server) {
        anotherServer = _server;
      })

      .then(function () {
        test.expect(reAssembled).to.be(true);
      })

      .then(function () {
        Packager.prototype.assemble = originalAssemble;
        anotherServer.stop({ reconnect: false }, done);
      })

      .catch(function (error) {
        Packager.prototype.assemble = originalAssemble;
        if (!anotherServer) return done(error);
        anotherServer.stop({ reconnect: false }, function () {
          done(error);
        });
      });
  });
});
