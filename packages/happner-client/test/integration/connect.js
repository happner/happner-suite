const test = require('../__fixtures/test-helper').create();
let Happner = require('happner-2');
let HappnerClient = require('../..');
let certPath = test.path.dirname(__dirname) + test.path.sep + 'example.com.cert';
let keyPath = test.path.dirname(__dirname) + test.path.sep + 'example.com.key';

describe(test.name(__filename, 3), function () {
  var server;
  this.timeout(120e3);
  function startServer(done) {
    if (server) return done();
    let error;
    Happner.create({
      util: {
        logLevel: process.env.LOG_LEVEL || 'warn',
      },
      happn: {
        secure: true,
        adminPassword: 'xxx',
        services: {
          transport: {
            config: {
              mode: 'https',
              certPath: certPath,
              keyPath: keyPath,
            },
          },
        },
      },
    })
      .then(
        (result) => {
          server = result;
        },
        (e) => {
          error = e;
        }
      )
      .finally(() => {
        done(error);
      });
  }

  function stopServer(done) {
    if (!server) return done();
    server.stop(function (e) {
      server = undefined;
      done(e);
    });
  }

  function stopServerDisconnect(done) {
    if (!server) return done();
    server.stop({ reconnect: false }, function (e) {
      server = undefined;
      done(e);
    });
  }

  beforeEach('start server', startServer);
  afterEach('stop server', stopServer);

  it('supports callback', function (done) {
    var c = new HappnerClient();
    c.connect(
      {
        host: 'localhost',
        port: 55000,
      },
      {
        protocol: 'https',
        username: '_ADMIN',
        password: 'xxx',
        info: 'fo',
        allowSelfSignedCerts: true,
      },
      function (e) {
        if (e) return done(e);
        c.disconnect(done);
      }
    );
  });

  it('supports promise', function (done) {
    var c = new HappnerClient();
    c.on('error', function () {});
    c.connect(
      {
        host: '127.0.0.1',
        port: 9999, // <------------------- intentionally wrong
      },
      {
        protocol: 'https',
        username: '_ADMIN',
        password: 'xxx',
        allowSelfSignedCerts: true,
      }
    )
      .catch(function (e) {
        test.expect(e.code).to.be('ECONNREFUSED');
      })
      .then(function () {
        c.disconnect(done);
      })
      .catch(function (e) {
        c.disconnect(function () {});
        done(e);
      });
  });

  it('defaults', function (done) {
    // inherits happn defaulting
    var c = new HappnerClient();
    c.connect(
      {
        // host: 'localhost',
        // port: 55000
      },
      {
        protocol: 'https',
        username: '_ADMIN',
        password: 'xxx',
        allowSelfSignedCerts: true,
      },
      function (e) {
        if (e) return done(e);
        c.disconnect(done);
      }
    );
  });

  it('emits connected on connect', function (done) {
    var c = new HappnerClient();
    c.on('connected', function () {
      c.disconnect(done);
    });
    c.connect(
      {
        host: 'localhost',
        port: 55000,
      },
      {
        protocol: 'https',
        username: '_ADMIN',
        password: 'xxx',
        allowSelfSignedCerts: true,
      },
      function () {}
    );
  });

  it('emits disconnected on normal disconnect', function (done) {
    var c = new HappnerClient();
    c.connect(
      {
        host: 'localhost',
        port: 55000,
      },
      {
        protocol: 'https',
        username: '_ADMIN',
        password: 'xxx',
        allowSelfSignedCerts: true,
      },
      function (e) {
        if (e) return done(e);

        c.on('disconnected', function () {
          c.disconnect(function (e) {
            setTimeout(function () {
              // wait for server to finish stopping before next test
              // so that beforeHook knows to restart it
              if (e) return done(e);
              done();
            }, 200);
          });
        });

        stopServerDisconnect(function (e) {
          if (e) return done(e);
        });
      }
    );
  });

  it('emits disconnected even if server was stopped with reconnect true', function (done) {
    var c = new HappnerClient();
    c.connect(
      {
        host: 'localhost',
        port: 55000,
      },
      {
        protocol: 'https',
        username: '_ADMIN',
        password: 'xxx',
        allowSelfSignedCerts: true,
      },
      function (e) {
        if (e) return done(e);

        c.on('disconnected', function () {
          c.disconnect(function (e) {
            // FAILING: happn-3/issues/13
            // disconnect does not callback if already disconnected
            setTimeout(function () {
              if (e) return done(e);
              done();
            }, 200);
          });
        });

        stopServer(function (e) {
          if (e) return done(e);
        });
      }
    );
  });

  it('emits reconnected on reconnect', function (done) {
    this.timeout(20000);
    var c = new HappnerClient();
    c.connect(
      {
        host: 'localhost',
        port: 55000,
      },
      {
        protocol: 'https',
        username: '_ADMIN',
        password: 'xxx',
        allowSelfSignedCerts: true,
      },
      function (e) {
        if (e) return done(e);

        c.on('reconnected', function () {
          c.disconnect(function (e) {
            setTimeout(function () {
              if (e) return done(e);
              done();
            }, 200);
          });
        });

        stopServer(function (e) {
          if (e) return done(e);
          startServer(function (e) {
            if (e) return done(e);
          });
        });
      }
    );
  });

  it('emits reconnecting on reconnecting', function (done) {
    var c = new HappnerClient();
    c.connect(
      {
        host: 'localhost',
        port: 55000,
      },
      {
        protocol: 'https',
        allowSelfSignedCerts: true,
        username: '_ADMIN',
        password: 'xxx',
      },
      function (e) {
        if (e) return done(e);

        c.on('reconnecting', function () {
          c.disconnect(function (e) {
            // FAILING: happn-3/issues/13
            // disconnect does not callback if already disconnected
            setTimeout(function () {
              if (e) return done(e);
              done();
            }, 200);
          });
        });

        stopServer(function (e) {
          if (e) return done(e);
        });
      }
    );
  });

  it('tests token revocation via logout', async () => {
    const connectionOptions = {
      host: 'localhost',
      port: 55000,
      username: '_ADMIN',
      protocol: 'https',
      allowSelfSignedCerts: true,
    };
    const testAdminClient = await HappnerClient.create({ ...connectionOptions, password: 'xxx' });
    let token = testAdminClient.dataClient().session.token;
    let testAdminClient2 = await HappnerClient.create({ ...connectionOptions, token });
    test.expect(testAdminClient2.dataClient().status).to.be(1);
    await testAdminClient.logout();
    await test.delay(2e3);
    test.expect(testAdminClient2.dataClient().status).to.be(2);
  });

  // after('print open handles', () => {
  //   test.listOpenHandles(5e3);
  // });
});
