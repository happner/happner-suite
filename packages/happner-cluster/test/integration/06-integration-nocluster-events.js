const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const getSeq = require('../_lib/helpers/getSeq');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let servers, localInstance, remoteInstance;

  beforeEach('start cluster', async function () {
    servers = await Promise.all([
      test.HappnerCluster.create(localInstanceConfig(0)),
      test.HappnerCluster.create(remoteInstanceConfig(1)),
    ]);
    localInstance = servers[0];
    remoteInstance = servers[1];
    await test.delay(3000);
  });

  afterEach('stop cluster', async function () {
    if (servers) await stopCluster(servers);
  });

  it('gets local and global events where local', async function () {
    let result = await localInstance.exchange.component1.awaitEvents();
    test.expect(result).to.eql({
      'event/global': { some: 'thing1' },
      'event/local': { some: 'thing2' },
    });
  });

  it('gets only global events where remote', async function () {
    let result = await remoteInstance.exchange.component2.awaitEvents();
    test.expect(result).to.eql({
      'event/global': { some: 'thing1' },
    });
  });

  function localInstanceConfig(seq) {
    let config = baseConfig(seq, 2);
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
