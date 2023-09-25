const Component = require('../../lib/component');
require('../lib/test-helper').describe({ timeout: 10e3 }, function (test) {
  it('creates, starts and stops a component', async () => {
    const component = await Component.create({
      services: {
        membership: {
          config: {
            deploymentId: 'test',
          },
        },
      },
    });
    // TODO: remove this delay - and there is some lifecycle weirdness with kafka consumer
    await test.delay(5e3);
    await component.stop();
  });

  it('creates, starts and stops a component, via callbacks', function (done) {
    Component.create(
      {
        services: {
          membership: {
            config: {
              deploymentId: 'test',
            },
          },
        },
      },
      (e, component) => {
        if (e) return done(e);
        test.delay(5e3).then(() => {
          component.stop(done);
        });
      }
    );
  });
});
