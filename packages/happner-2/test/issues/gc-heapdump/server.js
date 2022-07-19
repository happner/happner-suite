const test = require('../../__fixtures/utils/test_helper').create();

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
            statisticsInterval: 5e3,
          },
        },
        data: {
          config: {
            datastores: [
              {
                name: 'mongo',
                provider: 'happn-db-provider-mongo',
                isDefault: true,
                collection: 'stress-tests',
              },
              {
                name: 'loki',
                provider: require.resolve('happn-db-provider-loki'),
                patterns: ['/LOCAL/*'],
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
            $happn.emit('event1');
            const timestamp = Date.now();
            await $happn.data.set(`stress/test/${timestamp}`, { timestamp });
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
    },
    components: {
      component: {
        module: 'module',
        web: {
          routes: {
            webmethod1: 'webmethod1',
            webmethod2: 'webmethod2',
          },
        },
      },
    },
  };
  await test.Mesh.create(config);
}

start();
