module.exports = TestMesh;

function TestMesh() {}

TestMesh.prototype.method1 = function ($happn, $origin, callback) {
  callback(null, $origin);
};

if (global.TESTING_D1 || global.TESTING_D1_1) return; // When 'requiring' the module above,
// don't run the tests below
//.............

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var unsecureMesh;
  var secureMesh = new test.Mesh();
  var secureClient = new test.Mesh.MeshClient({ secure: true, port: 8000 });
  var unsecureClient = new test.Mesh.MeshClient({ port: 8001 });
  var test_id = Date.now() + '_' + require('shortid').generate();

  before('starts a secure mesh', function (done) {
    global.TESTING_D1 = true; //.............

    secureMesh.initialize(
      {
        name: 'session-injection-secure',
        happn: {
          secure: true,
          adminPassword: test_id,
          port: 8000,
        },
        modules: {
          TestMesh: {
            path: __filename,
          },
        },
        components: {
          TestMesh: {
            moduleName: 'TestMesh',
            schema: {
              exclusive: false,
            },
          },
        },
      },
      function (err) {
        if (err) return done(err);
        secureMesh.start(function (err) {
          if (err) {
            // console.log(err.stack);
            return done(err);
          }

          // Credentials for the login method
          var credentials = {
            username: '_ADMIN', // pending
            password: test_id,
          };

          secureClient
            .login(credentials)
            .then(function () {
              done();
            })
            .catch(done);
        });
      }
    );
  });

  before('starts an insecure mesh', function (done) {
    global.TESTING_D1_1 = true; //.............

    unsecureMesh = this.mesh = new test.Mesh();

    unsecureMesh.initialize(
      {
        name: 'd1-session-injection',
        happn: {
          secure: false,
          adminPassword: test_id,
          port: 8001,
        },
        modules: {
          TestMesh: {
            path: __filename,
          },
        },
        components: {
          TestMesh: {
            moduleName: 'TestMesh',
            schema: {
              exclusive: false,
            },
          },
        },
      },
      function (err) {
        if (err) return done(err);
        unsecureMesh.start(function (err) {
          if (err) {
            // console.log(err.stack);
            return done(err);
          }

          // Credentials for the login method
          var credentials = {
            port: 8001,
          };

          unsecureClient
            .login(credentials)
            .then(function () {
              done();
            })
            .catch(done);
        });
      }
    );
  });

  after(function (done) {
    delete global.TESTING_D1_1;
    delete global.TESTING_D1;

    unsecureMesh.stop({ reconnect: false }, function (e) {
      if (e) return done(e);

      secureMesh.stop({ reconnect: false }, done);
    });
  });

  it('fetches the origin info on a secure mesh', function (done) {
    secureClient.exchange.TestMesh.method1(function (e, result) {
      if (e) return done(e);
      test.expect(result.username).to.equal('_ADMIN');
      done();
    });
  });

  it('fetches the origin info on an unsecure mesh', function (done) {
    unsecureClient.exchange.TestMesh.method1(function (e, result) {
      if (e) return done(e);
      test.expect(result.id).to.not.equal(null);
      test.expect(result.id).to.not.equal(undefined);
      test.expect(result.username).to.equal(undefined);
      done();
    });
  });
});
