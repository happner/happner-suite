// connect old happner endpoint to new happner server
// (use config.domain to support load balancer)
// const log = require('why-is-node-running');
describe(require('../__fixtures/utils/test_helper').create().testName(__filename), function () {
  var OldHappner = require('happner');
  var Happner = require('../..');
  var expect = require('expect.js');
  var async = require('async');
  var fs = require('fs');
  var path = require('path');

  //this may need updating when we add other files
  var OLDFILES_WATCHED = [
    'happn/lib/client/base.js',
    'happner/lib/system/shared/logger.js',
    'happner/lib/system/shared/promisify.js',
    'happner/lib/system/shared/mesh-error.js',
    'happner/lib/system/shared/messenger.js',
    'happner/lib/system/shared/internals.js',
    'happner/lib/system/shared/mesh-client.js',
  ];

  context('secure', function () {
    var server,
      endpoints = [];

    before('start server', function (done) {
      startServer(done);
    });

    before('start endpoints', function (done) {
      async.series([startEndpoint, startEndpoint], function (e, results) {
        if (e) return done(e);
        endpoints = results;
        done();
      });
    });

    after('stop endpoints', function (done) {
      if (endpoints.length === 0) return done();
      async.eachSeries(
        endpoints,
        function (endpoint, endpointCB) {
          stopEndpoint(endpoint, endpointCB, false);
        },
        done
      );
    });

    after('stop server', function (done) {
      stopServer(false, done);
    });

    after('unwatch files', function () {
      //unwatch old happner files

      var nodeModules = [path.resolve(__dirname, '..', '..'), 'node_modules', ''].join('/');

      OLDFILES_WATCHED.forEach(function (filePath) {
        fs.unwatchFile(nodeModules + filePath);
      });
    });

    after('why is node running', function (done) {
      this.timeout(10000);
      setTimeout(function () {
        //log();
        done();
      }, 5000);
    });

    function stopEndpoint(endpoint, done, reconnect) {
      endpoint.stop({ reconnect: reconnect }, done);
    }

    var startPort = 55000;
    function startEndpoint(done) {
      startPort++;

      OldHappner.create({
        port: startPort,
        datalayer: {
          secure: true,
        },
        endpoints: {
          DOMAIN_NAME: {
            config: {
              username: 'username',
              password: 'password',
            },
          },
        },
        modules: {
          localModule: {
            instance: {
              use$happnMethod: function ($happn, callback) {
                $happn.exchange.DOMAIN_NAME.testComponent
                  .method()
                  .then(function (result) {
                    callback(null, result);
                  })
                  .catch(callback);
              },
            },
          },
        },
        components: {
          localModule: {},
        },
      })
        .then(function (_endpoint) {
          done(null, _endpoint);
        })
        .catch(done);
    }

    function executeMethod(callback) {
      endpoints[0].exchange.DOMAIN_NAME.testComponent.method(callback);
    }

    function addUser(done) {
      var security = server.exchange.security;
      var group = {
        name: 'group',
        permissions: {
          events: {
            '/DOMAIN_NAME/testComponent/event': { authorized: true },
          },
          // data: {},
          methods: {
            '/DOMAIN_NAME/testComponent/method': { authorized: true },
            '/DOMAIN_NAME/testComponent/causeEvent': { authorized: true },
            '/DOMAIN_NAME/testComponent/useOwnData': { authorized: true },
            '/DOMAIN_NAME/data/set': { authorized: true },
            '/DOMAIN_NAME/data/get': { authorized: true },
          },
        },
      };
      var user = {
        username: 'username',
        password: 'password',
      };

      Promise.all([security.addGroup(group), security.addUser(user)])
        .then(function (results) {
          return security.linkGroup(...results);
        })
        .then(function () {
          done();
        })
        .catch(done);
    }

    function stopServer(reconnect, done) {
      if (!server) return done();
      server.stop({ reconnect: reconnect }, done);
    }

    function startServer(done) {
      server = undefined;
      Happner.create({
        name: 'MESH_NAME',
        domain: 'DOMAIN_NAME',
        happn: {
          secure: true,
        },
        modules: {
          testComponent: {
            instance: {
              method: function ($happn, callback) {
                callback(null, $happn.info.mesh.domain);
              },
              causeEvent: function ($happn, callback) {
                $happn.emit('event', { da: 'ta' });
                callback();
              },
              useOwnData: function ($happn, callback) {
                var data = { some: 'DATA' };
                $happn.data.set('/some/data', data, function (e) {
                  if (e) return callback(e);
                  $happn.data.get('/some/data', function (e, response) {
                    if (e) return callback(e);
                    delete response._meta;
                    callback(null, response);
                  });
                });
              },
            },
          },
        },
        components: {
          testComponent: {},
          data: {},
        },
      })
        .then(function (_server) {
          server = _server;
          addUser(done);
        })
        .catch(done);
    }

    function expectedCount(subscriptions, expectedCount) {
      var count = 0;
      subscriptions.forEach(function (subscription) {
        if (subscription.data.path.indexOf('/_exchange/responses/DOMAIN_NAME') === 0) {
          count++;
        }
      });
      return count === expectedCount;
    }

    it('it calls components methods from old happner, we flip flop the new server, and ensure that the subscription service does not have hanging subscriptions', function (done) {
      this.timeout(20000);
      var async = require('async');

      async.series([executeMethod, executeMethod, executeMethod, executeMethod], function (e) {
        if (e) return done(e);

        var originalSubscriptions =
          server._mesh.happn.__toListenInstance.services.subscription.subscriptions.searchAll();
        expect(expectedCount(originalSubscriptions, 1)).to.be(true);
        stopServer(true, function (e) {
          if (e) return done(e);
          var subscriptions =
            server._mesh.happn.__toListenInstance.services.subscription.subscriptions.searchAll();
          expect(expectedCount(subscriptions, 0)).to.be(true);
          startServer(function () {
            setTimeout(() => {
              executeMethod(function () {
                var subscriptions =
                  server._mesh.happn.__toListenInstance.services.subscription.subscriptions.searchAll();
                expect(expectedCount(subscriptions, 1)).to.be(true);
                done();
              });
            }, 2000);
          });
        });
      });
    });
  });
});
