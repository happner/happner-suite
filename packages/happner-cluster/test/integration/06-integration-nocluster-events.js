const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

let deploymentId;
require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  deploymentId = test.newid();
  let config = {
    cluster: {
      functions: [localInstanceConfig, remoteInstanceConfig],
      localInstance: 0,
      remoteInstance: 1,
    },
  };
  test.hooks.standardHooks(test, config);

  it('gets local and global events where local', async function () {
    let result = await test.localInstance.exchange.component1.awaitEvents();
    test.expect(result).to.eql({
      'event/global': { some: 'thing1' },
      'event/local': { some: 'thing2' },
    });
  });

  it('gets only global events where remote', async function () {
    let result = await test.remoteInstance.exchange.component2.awaitEvents();
    test.expect(result).to.eql({
      'event/global': { some: 'thing1' },
    });
  });

  function localInstanceConfig(seq) {
    let config = baseConfig(seq, 2);
    config.happn.services.membership.config.serviceName = 'local-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
    config.modules = {
      component1: {
        path: libDir + 'integration-06-component1',
      },
    };
    config.components = {
      component1: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    let config = baseConfig(seq, 2);
    config.happn.services.membership.config.serviceName = 'remote-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
    config.modules = {
      component2: {
        path: libDir + 'integration-06-component2',
      },
    };
    config.components = {
      component2: {},
    };
    return config;
  }
});
