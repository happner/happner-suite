const stopCluster = require('../_lib/stop-cluster');
require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let server, client;

  after('stop server', async function () {
    if (server) await stopCluster([server]);
  });

  after('stop client', function (done) {
    if (!client) return done();
    client.disconnect(done);
  });

  it('starts', async function () {
    server = await test.HappnerCluster.create({
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
        },
      },
    });

    client = new test.Happner.MeshClient({});
    await client.login(); // ensures proxy (default 55000) is running
  });
});
