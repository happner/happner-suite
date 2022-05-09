require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  let mesh;
  const Mesh = test.Mesh;
  const client = new Mesh.MeshClient({ secure: true, port: 8003 });
  const username = 'username';
  const password = 'xxx';
  const filename = test.createTempfilePath(__dirname, 'nedb', '../../tmp');

  beforeEach(async () => {
    if (mesh) {
      await mesh.stop();
    }
    mesh = await Mesh.create({
      name: 'system-groups-stop-start',
      happn: {
        secure: true,
        adminPassword: password,
        port: 8003,
        services: {
          data: {
            config: {
              datastores: [
                {
                  name: 'persist',
                  provider: 'happn-db-provider-nedb',
                  isDefault: true,
                  settings: {
                    filename,
                  },
                },
                {
                  name: 'volatile_permissions',
                  provider: 'happn-db-provider-nedb',
                  patterns: ['/_SYSTEM/_SECURITY/_PERMISSIONS/*'],
                },
              ],
            },
          },
        },
      },
    });
    await mesh.exchange.security.upsertUser({
      username,
      password,
    });
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
      await mesh.stop();
    }
  });

  after(async () => {
    try {
      test.commons.fs.unlinkSync(filename);
    } catch (e) {
      // do nothing
    }
  });

  it('runs the mesh once and connects with the admin client', async () => {
    await client.login({
      username,
      password,
    });
  });

  it('restarts the mesh connects with the admin client', async () => {
    await client.login({
      username,
      password,
    });
  });
});
