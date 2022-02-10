require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  var path = require('path');
  var server;
  var test_id = Date.now() + '_' + require('shortid').generate();
  var dbFileName = '.' + path.sep + 'temp' + path.sep + test_id + '.nedb';

  before('start server', function (done) {
    try {
      test.commons.fs.unlinkSync(dbFileName);
    } catch (e) {
      // do nothing
    }
    test.Mesh.create({
      name: 'Server',
      happn: {
        persist: true,
        secure: true,
        filename: dbFileName,
        services: {
          security: {
            config: {
              accountLockout: {
                enabled: true,
                attempts: 2,
                retryInterval: 3000,
              },
            },
          },
        },
      },
      modules: {
        ComponentName: {
          instance: {
            allowedMethod: function ($origin, input, callback, $happn) {
              // "max-nasty" injection
              input.meshName = $happn.info.mesh.name;
              input.originUser = $origin.username;
              callback(null, input);
            },
            deniedMethod: function (input, callback) {
              callback(null, input);
            },
          },
        },
      },
      components: {
        ComponentName: {},
      },
    })
      .then(function (mesh) {
        var security = mesh.exchange.security;
        server = mesh;
        return Promise.all([
          security.addGroup({
            name: 'group',
            permissions: {
              events: {},
              // data: {},
              methods: {
                '/Server/ComponentName/allowedMethod': { authorized: true },
              },
            },
          }),
          security.addUser({
            username: 'username',
            password: 'password',
          }),
        ]).then(function (results) {
          return security.linkGroup(...results);
        });
      })
      .then(function () {
        done();
      })
      .catch(done);
  });

  after('stop server', function (done) {
    try {
      test.commons.fs.unlinkSync(dbFileName);
    } catch (e) {
      // do nothing
    }
    if (!server) return done();
    server.stop({ reconnect: false }, done);
  });

  it('tests that accountLockout functionality is ported', function (done) {
    test.commons.async.series(
      [
        function (itemCB) {
          var client = new test.Mesh.MeshClient();
          client
            .login({
              username: 'username',
              password: 'bad password',
            })
            .catch(function (error) {
              error.toString().should.equal('AccessDenied: Invalid credentials');
              itemCB();
            });
        },
        function (itemCB) {
          var client = new test.Mesh.MeshClient();
          client
            .login({
              username: 'username',
              password: 'bad password',
            })
            .catch(function (error) {
              error.toString().should.equal('AccessDenied: Invalid credentials');
              itemCB();
            });
        },
        function (itemCB) {
          var client = new test.Mesh.MeshClient();
          client
            .login({
              username: 'username',
              password: 'bad password',
            })
            .catch(function (error) {
              error.toString().should.equal('AccessDenied: Account locked out');
              setTimeout(itemCB, 3000);
            });
        },
        function (itemCB) {
          var client = new test.Mesh.MeshClient();
          client
            .login({
              username: 'username',
              password: 'password',
            })
            .then(itemCB)
            .catch(itemCB);
        },
      ],
      done
    );
  });
});
