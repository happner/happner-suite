const hooks = require('../_lib/helpers/hooks');
require('../_lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  let server, client;
  hooks.standardHooks();

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
    this.servers.push(server);
    client = new test.Happner.MeshClient({});
    await client.login(); // ensures proxy (default 55000) is running
    this.clients.push(client);
  });
});
