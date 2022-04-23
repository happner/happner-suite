require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const Mesh = require('../../..');
  let users = require('../../__fixtures/utils/users');
  let mesh;

  const adminClient = new Mesh.MeshClient({
    secure: true,
    port: 8004,
    reconnect: {
      max: 2000,
    },
  });

  const testClient = new Mesh.MeshClient({
    secure: true,
    port: 8004,
    reconnect: {
      max: 2000,
    },
  });

  const badClient = new Mesh.MeshClient({
    secure: true,
    port: 8004,
    reconnect: {
      max: 2000,
    },
  });

  var adminPassword = 'PASSWORD';
  let filename = require('path').resolve(__dirname, '../../tmp/client-reconnection.nedb');
  var startMesh = function (callback) {
    Mesh.create(
      {
        name: 'client-reconnection',
        happn: {
          filename,
          defaultRoute: 'mem',
          compactInterval: 600000,
          //disableDefaultAdminNetworkConnections: true,
          secure: true,
          port: 8004,
          services: {
            security: {
              config: {
                persistPermissions: false,
                adminUser: {
                  password: adminPassword,
                },
              },
            },
            data: {
              config: {
                datastores: [
                  {
                    name: 'persist',
                    provider: 'happn-db-provider-nedb',
                    settings: {
                      filename,
                      compactInterval: 600000,
                    },
                  },
                  {
                    name: 'memory',
                    provider: 'happn-db-provider-nedb',
                    isDefault: true,
                  },
                ],
              },
            },
          },
        },
        modules: {
          test: {
            instance: {
              method: async () => {
                return 1;
              },
            },
          },
        },
        components: {
          data: {},
          test: {},
        },
      },
      function (e, instance) {
        if (e) return callback(e);
        mesh = instance;
        setTimeout(() => {
          createTestUser(mesh, (e) => {
            if (e) return callback(e);
            callback();
          });
        }, 1000);
      }
    );
  };

  before(function (done) {
    //test.commons.unlinkFiles([filename]);
    startMesh(function (e) {
      if (e) return done(e);
      testClient
        .login({ username: 'test', password: 'test' })
        .then(() => {
          return adminClient.login({ username: '_ADMIN', password: adminPassword });
        })
        .then(() => {
          done();
        })
        .catch((e) => {
          done(e);
        });
    });
  });

  let __stopped = false;

  after(function (done) {
    //test.commons.unlinkFiles([filename]);
    if (adminClient) adminClient.disconnect();
    if (testClient) testClient.disconnect();
    if (__stopped) return done();
    mesh.stop(done);
  });

  let eventsToFire = ['reconnect/successful', 'reconnect/scheduled'];

  function createTestUser(server, callback) {
    users
      .add(server, 'test', 'test', {
        methods: {
          //in a /Mesh name/component name/method name - with possible wildcards
          '/client-reconnection/test/method': { authorized: true },
        },
      })
      .then(callback);
  }

  it('tests the client bad login with callback', function (done) {
    badClient.login({ username: '_ADMIN', password: 'bad' }, (e) => {
      test.expect(e.message).to.be('Invalid credentials');
      setTimeout(done, 2000);
    });
  });

  it('tests the client reconnection', function (done) {
    testClient.exchange.test.method((e) => {
      if (e) {
        return done(new Error(`oh dear: ${e.message}`));
      }
      var fireEvent = function (key) {
        if (eventsToFire.length === 0) return;
        if (eventsToFire.indexOf(key) > -1) test.log(`fired: ${eventsToFire.pop()}`);
        if (eventsToFire.length > 0) return;
        testClient.exchange.test.method((e) => {
          if (e) {
            test.log(`oh dear: ${e.message}`);
          }
          done();
        });
      };

      testClient.on('reconnect/scheduled', function () {
        fireEvent('reconnect/scheduled');
      });

      testClient.on('reconnect/successful', function () {
        fireEvent('reconnect/successful');
      });

      mesh.stop(function (e) {
        if (e) return done(e);
        startMesh(function (e) {
          if (e) return done(e);
        });
      });
    });
  });

  var __doneMeasuring = false;

  it('tests the client reconnection configuration', function (done) {
    adminClient.exchange.data.set('/test/path', { test: 'data' }, function (e) {
      if (e) return done(e);

      var lastMeasurement;
      var measuredCount = 0;
      var measuredDifference = 0;

      adminClient.on('reconnect/scheduled', function () {
        if (__doneMeasuring) return;

        if (measuredCount === 0) {
          lastMeasurement = Date.now();
          return measuredCount++;
        }

        measuredCount++;
        measuredDifference += Date.now() - lastMeasurement;
        lastMeasurement = Date.now();

        if (measuredCount === 4) {
          __doneMeasuring = true;
          var measuredAverage = measuredDifference / 3;

          // use try/catch to avoid process.exit (issue 222)
          try {
            test.expect(measuredAverage < 3300).to.be(true); // allow 10% grace for windows
          } catch (e) {
            return done(e);
          }
          done();
        }
      });

      mesh.stop({ reconnect: true }, function (e) {
        if (e) return done(e);
        __stopped = true;
      });
    });
  });
});
