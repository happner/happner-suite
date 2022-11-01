require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  it('is able to startup an instance based on an old keypair (bitcore)', async () => {
    const filename = require('path').resolve(
      __dirname,
      '../../__fixtures/test/integration/security/old-keypair.nedb'
    );
    const originalfilename = require('path').resolve(
      __dirname,
      '../../__fixtures/test/integration/security/old-keypair-original.nedb'
    );
    test.fs.writeFileSync(filename, test.fs.readFileSync(originalfilename));
    const config = {
      secure: true,
      services: {
        data: {
          config: {
            autoUpdateDBVersion: true,
            datastores: [
              {
                name: 'nedb',
                provider: 'happn-db-provider-nedb',
                settings: {
                  filename,
                },
              },
            ],
          },
        },
      },
    };
    //just create and destroy instance, startup should not be impacted
    await test.destroyInstance(await test.createInstance(config));
  });
});
