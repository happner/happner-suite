if (process.platform === 'win32') return;
require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var Happner = require('../../..');
  var server;
  var dbFileName = test.newTempFilename('nedb');
  test.tryDeleteTestFilesAfter([dbFileName]);

  before('start server', function (done) {
    Happner.create({
      name: 'Server',
      happn: {
        persist: true,
        secure: true,
        filename: dbFileName,
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
              data: {
                '/allowed/get/*': { actions: ['get'] },
                '/allowed/on/*': { actions: ['on', 'set'] },
                '/allowed/remove/*': { actions: ['set', 'remove', 'get'] },
                '/allowed/all/*': { actions: ['*'] },
              },
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

    if (server)
      server.stop({ reconnect: false }).then(function () {
        done();
      });
    else done();
  });

  it('rejects login promise on bad credentials', function (done) {
    var client = new Happner.MeshClient();
    client
      .login({
        username: 'username',
        password: 'bad password',
      })
      .then(function () {
        client.disconnect();
        done(new Error('should not allow'));
      })
      .catch(function (error) {
        error.toString().should.equal('AccessDenied: Invalid credentials');
        done();
      })
      .catch(done);
  });

  it('emits login/deny on bad credentials', function (done) {
    var client = new Happner.MeshClient();
    client.on('login/deny', function (error) {
      try {
        error.toString().should.equal('AccessDenied: Invalid credentials');
        done();
      } catch (e) {
        done(e);
      }
    });
    client
      .login({
        username: 'username',
        password: 'bad password',
      })
      .then(function () {
        client.disconnect();
        done(new Error('should not allow'));
      })
      .catch(() => {
        //do nothing
      });
  });

  it('emits login/allow on good credentials', function (done) {
    var client = new Happner.MeshClient();
    client.on('login/allow', function () {
      done();
    });
    client
      .login({
        username: 'username',
        password: 'password',
      })
      .catch(done);
  });

  context('events', function () {
    // might already be implicitly tested in elsewhere
    //
    // publish allowed/denied
    // subscribe allowed/denied
  });

  context('data', function () {
    var client;

    before('start client', function (done) {
      client = new Happner.MeshClient();
      client
        .login({
          username: 'username',
          password: 'password',
        })
        .then(function () {
          done();
        })
        .catch(done);
    });

    after('stop client', function () {
      client.disconnect();
    });

    it('allows access to allowed "on" data points', function (done) {
      client.data.on(
        '/allowed/on/*',
        function (data) {
          test.expect(data.test).to.be('data');
          done();
        },
        function (e) {
          if (e) return done(e);
          client.data.set('/allowed/on/1', { test: 'data' }, function (e) {
            if (e) return done(e);
          });
        }
      );
    });

    it('denies access to denied data points', function (done) {
      client.data.set('/not/allowed/on/1', { test: 'data' }, function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        done();
      });
    });

    it('prevents any attempts to save data permissions that may interfere with _events', function (done) {
      var security = server.exchange.security;

      security
        .addGroup({
          name: 'badgroup',
          permissions: {
            data: {
              '/_events/*': { actions: ['*'] },
            },
          },
        })
        .catch(function (e) {
          test
            .expect(e.toString())
            .to.be('Error: data permissions cannot start with /_events, /_exchange or /@HTTP');
          done();
        });
    });

    it('prevents any attempts to save data permissions that may interfere with /_exchange', function (done) {
      var security = server.exchange.security;

      security
        .addGroup({
          name: 'badgroup',
          permissions: {
            data: {
              '/_exchange/*': { actions: ['*'] },
            },
          },
        })
        .catch(function (e) {
          test
            .expect(e.toString())
            .to.be('Error: data permissions cannot start with /_events, /_exchange or /@HTTP');
          done();
        });
    });

    it('prevents any attempts to save data permissions that may interfere with /@HTTP', function (done) {
      var security = server.exchange.security;

      security
        .addGroup({
          name: 'badgroup',
          permissions: {
            data: {
              '/@HTTP/*': { actions: ['*'] },
            },
          },
        })
        .catch(function (e) {
          test
            .expect(e.toString())
            .to.be('Error: data permissions cannot start with /_events, /_exchange or /@HTTP');
          done();
        });
    });

    it('adds group data permissions, we check we have access to the new path', function (done) {
      client.data.set('/updated/1', { test: 'data' }, function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        var addPermissions = {
          data: {
            '/updated/*': { actions: ['on', 'set'] },
          },
        };

        var security = server.exchange.security;

        security
          .addGroupPermissions('group', addPermissions)

          .then(function () {
            client.data.set('/updated/1', { test: 'data' }, done);
          })
          .catch(done);
      });
    });

    it('removes group data permissions, we check we no longer have access to the new path, but still have access to other paths', function (done) {
      client.data.set('/toremove/1', { test: 'data' }, function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        var addPermissions = {
          data: {
            '/toremove/*': { actions: ['on', 'set'] },
          },
        };

        var security = server.exchange.security;

        security
          .addGroupPermissions('group', addPermissions)

          .then(function () {
            return client.data.set('/toremove/1', { test: 'data' });
          })
          .then(function () {
            return security.removeGroupPermissions('group', addPermissions);
          })
          .then(function () {
            //ensure we only removed one permission
            return client.data.get('/allowed/get/*');
          })
          .then(function () {
            client.data.set('/toremove/1', { test: 'data' }, function (e) {
              test.expect(e.toString()).to.be('AccessDenied: unauthorized');
              done();
            });
          })
          .catch(done);
      });
    });

    it('adds group data permissions via a group upsert, we check we have access to the new path and the previous permissions', function (done) {
      var security = server.exchange.security;

      client.data.set('/upserted/1', { test: 'data' }, function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');

        security
          .upsertGroup({
            name: 'group',
            permissions: {
              data: {
                '/upserted/*': { actions: ['get', 'set'] },
              },
            },
          })
          .then(function () {
            return client.data.set('/upserted/1', { test: 'data' });
          })
          .then(function () {
            return client.data.get('/upserted/1', { test: 'data' });
          })
          .then(function () {
            return client.data.get('/allowed/get/*', done);
          })
          .catch(done);
      });
    });
  });

  context('exchange', function () {
    var client;

    before('start client', function (done) {
      client = new Happner.MeshClient();
      client
        .login({
          username: 'username',
          password: 'password',
        })
        .then(function () {
          done();
        })
        .catch(done);
    });

    after('stop client', function () {
      client.disconnect();
    });

    it('allows access to allowed methods', function (done) {
      client.exchange.ComponentName.allowedMethod({ key: 'value' })
        .then(function (result) {
          ({
            key: 'value',
            meshName: 'Server',
            originUser: 'username',
          }).should.eql(result);
          done();
        })
        .catch(done);
    });

    it('denies access to denied methods', function (done) {
      client.exchange.ComponentName.deniedMethod({ key: 'value' })
        .then(function () {
          done(new Error('should not allow'));
        })
        .catch(function (error) {
          error.toString().should.equal('AccessDenied: unauthorized');
          done();
        })
        .catch(done);
    });
  });
});
