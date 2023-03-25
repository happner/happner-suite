const Component = require('../../lib/component');
require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  it('creates a component', async () => {
    const component = await Component.create();
    test.expect(component.container.dependencies).to.eql({});
  });
});
