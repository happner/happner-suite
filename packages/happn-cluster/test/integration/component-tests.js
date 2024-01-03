const Component = require('../../lib/component');
require('../lib/test-helper').describe({ timeout: 5e3 }, function () {
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
    await component.stop();
  });
});
