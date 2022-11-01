require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  var server, client;

  after('stop server', function (done) {
    if (!server) return done();
    server.stop({ reconnect: false }, done);
  });

  after('stop client', function (done) {
    if (!client) return done();
    client.disconnect(done);
  });

  it('starts', function (done) {
    this.timeout(20000);

    test.HappnerCluster.create({
      domain: 'DOMAIN_NAME',
      happn: {
        secure: false,
        cluster: {
          requestTimeout: 20 * 1000,
          responseTimeout: 30 * 1000,
        },
        services: {
          data: {
            config: {
              autoUpdateDBVersion: true,
            },
          },
          membership: {
            config: {
              seed: true,
              hosts: ['127.0.0.1:55000'],
            },
          },
        },
      },
    })

      .then(function (_server) {
        server = _server;
      })

      .then(function () {
        client = new test.Happner.MeshClient({});
        return client.login(); // ensures proxy (default 55000) is running
      })

      .then(function () {
        done();
      })

      .catch(done);
  });
});
