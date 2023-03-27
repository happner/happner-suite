const Component = require('../../lib/component');
require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  it('creates a component', async () => {
    const component = await Component.create({
      services: {
        membership: {
          config: {
            deploymentId: 'test',
          },
        },
      },
    });
    test.expect(component.container.dependencies).to.eql({});
  });

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
    test.expect(component.container.dependencies).to.eql({});
    await component.start();
    await component.stop();
  });
});
