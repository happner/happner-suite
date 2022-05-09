['loki', 'nedb'].forEach((provider) => {
  require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3, only: true }, (test) => {
    let mesh;
    const Mesh = test.Mesh;
    const client = new Mesh.MeshClient({ secure: true, port: 8003 });
    const username = 'username';
    const password = 'xxx';
    const filename = test.createTempfilePath(__dirname, provider, '../../tmp');

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
                    name: 'mem',
                    provider: `happn-db-provider-${provider}`,
                    isDefault: true,
                  },
                  {
                    name: 'volatile_permissions',
                    provider: `happn-db-provider-${provider}`,
                    patterns: ['/_SYSTEM/_SECURITY/_PERMISSIONS/*'],
                  },
                  {
                    name: 'persist',
                    provider: `happn-db-provider-${provider}`,
                    settings: {
                      filename,
                    },
                    patterns: ['/_SYSTEM/*'],
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
        if (provider !== 'loki') return;
        //delete loki temp file
        test.commons.fs.unlinkSync(
          test.commons.path
            .dirname(filename)
            .concat(test.commons.path.sep)
            .concat('temp_')
            .concat(test.commons.path.basename(filename))
        );
      } catch (e) {
        // do nothing
      }
    });

    it('runs the mesh once and connects with the test client', async () => {
      await client.login({
        username,
        password,
      });
    });

    it('restarts the mesh connects with the test client', async () => {
      await client.login({
        username,
        password,
      });
    });
  });
});
