require('../../../__fixtures/utils/test_helper').describe({ timeout: 20000 }, (test) => {
  const happn = require('../../../../lib/index');
  const tempFile1 = test.newTestFile();
  let service, client;

  const getService = async function (config) {
    return await happn.service.create(config);
  };

  const getClient = function (service) {
    return new Promise((resolve, reject) => {
      service.services.session.localAdminClient(function (e, instance) {
        if (e) return reject(e);
        resolve(instance);
      });
    });
  };

  after('delete the test file', async () => {
    test.commons.fs.unlinkSync(tempFile1);
    await service.stop();
  });

  before('should initialize the service', async () => {
    let serviceConfig = {
      secure: true,
      services: {
        data: {
          config: {
            datastores: [
              {
                name: 'memory',
                isDefault: true,
                patterns: ['/_SYSTEM/_SECURITY/_PERMISSIONS/*'],
              },
              {
                name: 'persisted',
                provider: 'happn-db-provider-nedb',
                settings: {
                  filename: tempFile1,
                  compactInterval: 5e3, // every second
                },
                patterns: ['/_SYSTEM/*', '/persisted/*'],
              },
            ],
          },
        },
      },
    };

    service = await getService(serviceConfig);
    client = await getClient(service);
  });

  it('should save group information with dot paths, while doing nedb compactions', async () => {
    for (var i = 0; i < 10; i++) {
      await service.services.security.groups.upsertGroup({
        name: 'TEST-GROUP',
        permissions: {
          '/test.with.dot/*': {
            actions: ['*'],
          },
        },
      });
      await test.delay(1e3);
    }
  });

  it('ensures modifications to a set result does not mutate the database', async () => {
    const result = await client.set('/persisted/1', { test: 'data' });
    result.test = 'data1';
    const found = await client.get('/persisted/1');
    test.expect(found.test).to.equal('data');
  });
});
