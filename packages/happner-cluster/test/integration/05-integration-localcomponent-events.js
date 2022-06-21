const stopCluster = require('../_lib/stop-cluster');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let server;

  before('start server', async function () {
    server = await test.HappnerCluster.create(testHapnpConfig);
  });

  after('stop server', async function () {
    if (server) await stopCluster([server]);
  });

  it('can subscribe to event from local components', async function () {
    await server.exchange.component2.awaitEvent();
  });

  let testHapnpConfig = {
    name: 'NODE-01',
    domain: 'DOMAIN_NAME',
    port: 0,
    modules: {
      component1: {
        instance: {
          start: function ($happn, callback) {
            this.interval = setInterval(function () {
              $happn.emit('test/event', { some: 'data' });
            }, 1000);
            callback();
          },
          stop: function ($happn, callback) {
            clearInterval(this.interval);
            callback();
          },
        },
      },
      component2: {
        instance: {
          awaitEvent: function ($happn, callback) {
            var subscriberId;
            $happn.event.component1.on(
              'test/event',
              function (data) {
                $happn.event.component1.off(subscriberId);
                callback(null, data);
              },
              function (e, _subscriberId) {
                if (e) return callback(e);
                subscriberId = _subscriberId;
              }
            );
          },
        },
      },
    },
    components: {
      component1: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      component2: {},
    },
  };
});
