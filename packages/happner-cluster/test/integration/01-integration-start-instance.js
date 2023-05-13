require('../_lib/test-helper').describe({ timeout: 120e3, only: true }, function (test) {
  let server, client;
  test.hooks.standardHooks(test);

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
          membership: {
            config: {
              deploymentId: test.newid(),
            },
          },
        },
      },
    });
    test.servers.push(server);
    test.clients.push((client = new test.Happner.MeshClient({})));
    await client.login(); // ensures proxy (default 55000) is running
  });
});
