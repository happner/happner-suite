require('../../__fixtures/utils/test_helper').describe({ timeout: 5e3 }, (test) => {
  var path = require('path');
  var test_id = test.newid();
  var logFileName = path.resolve(__dirname, '../../tmp') + '/' + test_id + '.log';
  var dbFileName = path.resolve(__dirname, '../../tmp') + '/' + test_id + '.loki';
  let server;

  before('start server', function (done) {
    if (process.env.RUNNING_IN_ACTIONS || process.env.SILENCE) return done();

    try {
      test.commons.fs.unlinkSync(logFileName);
    } catch (e) {
      // do nothing
    }
    test.Mesh.create({
      name: 'Server',
      util: {
        logFile: logFileName,
      },
      happn: {
        secure: true,
      },
      modules: {
        ComponentName: {
          instance: {
            logMethod: function ($happn, callback) {
              // "max-nasty" injection
              $happn.log.error('test error');
              callback();
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
                '/Server/ComponentName/logMethod': { authorized: true },
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

  it('logs an error without an Error object, we read the logfile and check we have a location the error occurred on', function (done) {
    if (process.env.RUNNING_IN_ACTIONS || process.env.SILENCE) return done();

    var client = new test.Mesh.MeshClient();
    client
      .login({
        username: 'username',
        password: 'password',
      })
      .then(function () {
        client.exchange.ComponentName.logMethod().then(function () {
          server.stop({ reconnect: false }).then(function () {
            var logged = test.commons.fs.readFileSync(logFileName).toString();
            logged.should.match(/\/test\/integration\/logger\/logs-line-number-error.js:29:26/);
            done();
          });
        });
      })
      .catch(done);
  });

  after('delete file', function (done) {
    if (process.env.RUNNING_IN_ACTIONS || process.env.SILENCE) return done();

    try {
      test.commons.fs.unlinkSync(dbFileName);
    } catch (e) {
      // do nothing
    }
    done();
  });
});
