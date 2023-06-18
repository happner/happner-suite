var Configurator = require('../../../lib/configurators/cluster-configurator');
require('../../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  it('fails to configure', () => {
    let configurator = new Configurator();
    try {
      configurator.configure({});
      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.message).to.equal('services.membership.config.deploymentId not set');
    }
  });
});
