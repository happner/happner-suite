require('../../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  it('is able to startup an instance based on an old keypair (bitcore)', async () => {
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
                  filename: require('path').resolve(
                    __dirname,
                    '../../../__fixtures/test/integration/data/old-keypair.nedb'
                  ),
                },
              },
            ],
          },
        },
      },
    };
    await test.createInstance(config);
  });
});
