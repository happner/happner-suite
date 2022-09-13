const test = require('../../__fixtures/utils/test_helper').create();
let i = 0;
let ii = 0;
async function start() {
  //test.heapDump.start(60e3);
  const config = {
    name: 'meshname',
    happn: {
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
                  inactivity_threshold: '30 minutes',
                  ttl: '30 minutes',
                },
              },
            ],
          },
        },
        cache: {
          config: {
            // statisticsInterval: 5e3,
          },
        },
        data: {
          config: {
            datastores: [
              {
                name: 'nedb',
                isDefault: true,
                provider: 'happn-db-provider-nedb',
                settings: {
                  // no settings - so memory store
                },
              },
            ],
          },
        },
      },
    },
    modules: {
      module: {
        instance: {
          method1: async function ($happn) {
            const timestamp = Date.now();
            const eventData = { timestamp };
            $happn.emit(`stress/test/${timestamp}`, eventData);
            await $happn.exchange.data.set(`stress/test/currentTimestamp`, eventData);
            return $happn.exchange.component1.method2();
          },
          webmethod1: function (req, res) {
            res.end('ok1');
          },
          webmethod2: function (req, res) {
            res.end('ok2');
          },
          doHeapDump: function (callback) {
            test.heapDump.dump(callback);
          },
        },
      },
      module1: {
        instance: {
          start: async function ($happn) {
            // eslint-disable-next-line no-console
            console.log('starting module1...');
            await $happn.event.component.on('stress/test/*', async (data) => {
              if (ii % 100 === 0) {
                // eslint-disable-next-line no-console
                console.log(`received ${ii} events, last timestamp: ${data.timestamp}`);
                const lastStoredTimestamp = await $happn.exchange.data.get(
                  'stress/test/currentTimestamp'
                );
                // eslint-disable-next-line no-console
                console.log(`last stored timestamp: `, lastStoredTimestamp.timestamp);
              }
              ii++;
            });
          },
          method2: async function () {
            return i++;
          },
        },
      },
    },
    components: {
      data: {},
      component: {
        module: 'module',
        web: {
          routes: {
            webmethod1: 'webmethod1',
            webmethod2: 'webmethod2',
          },
        },
      },
      component1: {
        module: 'module1',
        startMethod: 'start',
      },
    },
  };
  await test.Mesh.create(config);
}

start();
