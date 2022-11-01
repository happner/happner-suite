const test = require('../../__fixtures/utils/test_helper').create();
describe(test.testName(__filename, 3), function () {
  this.timeout(11e5);
  const happn = require('../../../lib/index');
  let serviceInstance;
  let testClients = [];
  let USERCOUNT = 200;
  let RUN_FOR = 10e5;

  before('it starts secure service', function (done) {
    this.timeout(20e3);
    getService(
      {
        secure: true,
        services: {
          security: {
            config: {
              accountLockout: { enabled: true },
              __cache_checkpoint_authorization: { max: 10e3 },
              updateSubscriptionsOnSecurityDirectoryChanged: true,
              profiles: [
                {
                  name: 'short-session',
                  session: {
                    'user.username': {
                      $ne: '_ADMIN',
                    },
                  },
                  policy: {
                    inactivity_threshold: '5 minutes',
                    ttl: '10 minutes',
                  },
                },
              ],
            },
          },
          cache: {
            config: {
              statisticsInterval: 5e3,
            },
          },
        },
      },
      function (e, service) {
        if (e) return done(e);
        serviceInstance = service;
        // start heap dumping
        test.heapDump.start(60e3);
        done();
      }
    );
  });

  before('logs in with admin and creates the test users', async () => {
    for (let i = 0; i < USERCOUNT; i++) {
      let testGroup = {
        name: 'TEST GROUP' + i,
        custom_data: {
          customString: 'custom1',
          customNumber: 0,
        },
        permissions: {
          [`allowed/${i}/any/*`]: { actions: ['*'] },
          [`allowed/${i}/specific/{{user.username}}/*`]: { actions: ['*'] },
        },
      };
      let username = `user${i}`,
        password = 'password';
      let testUser = {
        username,
        password,
      };
      let addedTestGroup = await serviceInstance.services.security.users.upsertGroup(testGroup, {
        overwrite: false,
      });
      let addedTestUser = await serviceInstance.services.security.users.upsertUser(testUser, {
        overwrite: false,
      });
      await serviceInstance.services.security.users.linkGroup(addedTestGroup, addedTestUser);
      testClients.push(await happn.client.create({ username, password }));
    }
  });

  it(`create traffic for ${RUN_FOR}ms`, async () => {
    let active = true;
    setTimeout(() => {
      active = false;
    }, RUN_FOR);

    while (active) {
      let i = 0;
      for (let testClient of testClients) {
        try {
          await testClient.set('/not/allowed', { test: i });
        } catch (e) {
          //do nothing
        }
        await testClient.set(`allowed/${i}/any/1`, { test: i });
        await testClient.set(`allowed/${i}/specific/${testClient.session.user.username}/2`, {
          test: i,
        });
        i++;
      }
      await test.delay(1e3);
    }
  });

  after('disconnect clients and stop server', async () => {
    for (let client of testClients) {
      await client.disconnect();
    }
    await serviceInstance.stop();
    test.heapDump.stop();
  });

  function getService(config, callback) {
    happn.service.create(config, callback);
  }
});
