/**
 * Created by Johan on 10/14/2015.
 */

// Uses unit test 2 modules
var path = require('path');

describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    this.timeout(120000);

    var Mesh = require('../../..');
    var test_id = require('shortid').generate();
    var expect = require('expect.js');

    var libFolder =
      path.resolve(__dirname, '../../..') +
      path.sep +
      ['test', '__fixtures', 'test', 'integration', 'web'].join(path.sep) +
      path.sep;

    var config = {
      name: 'middlewareMesh',
      happn: {
        secure: true,
        port: 15000,
        adminPassword: test_id,
        middleware: {
          security: {
            exclusions: [
              '/webmethodtest/test/excluded/specific',
              '/webmethodtest/test/excluded/wildcard/*',
            ],
          },
        },
      },
      modules: {
        middlewareTest: {
          path: libFolder + 'origin-web',
        },
      },
      components: {
        webmethodtest: {
          moduleName: 'middlewareTest',
          web: {
            routes: {
              method1: 'method1',
              method2: 'method2',
            },
          },
        },
      },
    };

    var mesh;

    before(function (done) {
      mesh = new Mesh();
      mesh.initialize(config, function (err) {
        if (err) return done(err);
        mesh.start(done);
      });
    });

    after(function (done) {
      mesh.stop({ reconnect: false }, done);
    });

    function doRequest(path, token, callback) {
      var request = require('request');

      var options = {
        url: 'http://127.0.0.1:15000' + path + '?happn_token=' + token,
      };

      request(options, function (error, response, body) {
        callback(error, response, body);
      });
    }

    it('logs in wth the admin user, we have a token - we run a method that takes in the origin', function (done) {
      var adminClient = new Mesh.MeshClient({ secure: true, port: 15000 });

      var credentials = {
        username: '_ADMIN', // pending
        password: test_id,
      };

      adminClient
        .login(credentials)
        .then(function () {
          doRequest('/webmethodtest/method1', adminClient.token, function (error, response, body) {
            expect(response.statusCode).to.equal(200);

            var bodyParsed = JSON.parse(body);

            expect(bodyParsed.origin.username).to.equal('_ADMIN');
            expect(bodyParsed.origin.info._browser).to.be(false);

            adminClient.disconnect({ reconnect: false });

            done();
          });
        })
        .catch(done);
    });

    it('logs in wth the admin user, we have a token - we run a method that does not take in the origin', function (done) {
      var adminClient = new Mesh.MeshClient({ secure: true, port: 15000 });

      var credentials = {
        username: '_ADMIN', // pending
        password: test_id,
      };

      adminClient
        .login(credentials)
        .then(function () {
          doRequest('/webmethodtest/method2', adminClient.token, function (error, response, body) {
            expect(response.statusCode).to.equal(200);

            var bodyParsed = JSON.parse(body);

            expect(bodyParsed.origin).to.equal('NONE');

            adminClient.disconnect({ reconnect: false });

            done();
          });
        })
        .catch(done);
    });

    it('logs in wth the admin user, we use a bad token', function (done) {
      var adminClient = new Mesh.MeshClient({ secure: true, port: 15000 });

      var credentials = {
        username: '_ADMIN', // pending
        password: test_id,
      };

      adminClient
        .login(credentials)
        .then(function () {
          doRequest('/webmethodtest/method2', 'DODGETOKEN', function (error, response, body) {
            expect(body).to.be('invalid token format or null token');
            adminClient.disconnect({ reconnect: false });
            done();
          });
        })
        .catch(done);
    });

    it('logs in wth the admin user, we have a token - we run a method that takes in the origin again', function (done) {
      var adminClient = new Mesh.MeshClient({ secure: true, port: 15000 });

      var credentials = {
        username: '_ADMIN', // pending
        password: test_id,
      };

      adminClient
        .login(credentials)
        .then(function () {
          doRequest('/webmethodtest/method1', adminClient.token, function (error, response, body) {
            expect(response.statusCode).to.equal(200);

            var bodyParsed = JSON.parse(body);

            expect(bodyParsed.origin.username).to.equal('_ADMIN');

            adminClient.disconnect({ reconnect: false });

            done();
          });
        })
        .catch(done);
    });
  }
);
