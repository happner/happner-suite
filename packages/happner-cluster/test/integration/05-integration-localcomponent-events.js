const hooks = require('../_lib/helpers/hooks');

require('../_lib/test-helper').describe({ timeout: 20e3 }, () => {
  let config = {
    cluster: {
      functions: [testHapnpConfig],
      localInstance: 0,
    },
  };
  hooks.standardHooks(config);

  it('can subscribe to event from local components', async function () {
    await this.localInstance.exchange.component2.awaitEvent();
  });

  function testHapnpConfig() {
    return {
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
  }
});
