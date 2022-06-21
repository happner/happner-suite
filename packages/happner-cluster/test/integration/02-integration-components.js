const HappnerCluster = require('../..');
const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let servers, localInstance;

  before('start cluster', async function () {
    servers = await Promise.all([
      HappnerCluster.create(localInstanceConfig(0)),
      HappnerCluster.create(remoteInstance1Config(1)),
      HappnerCluster.create(remoteInstance2Config(2)),
    ]);
    localInstance = servers[0];
  });

  after('stop cluster', async function () {
    if (servers) await stopCluster(servers);
  });

  context('exchange', function () {
    it('uses happner-client to mount all $happn components', async () => {
      // ... and apply models from each component's
      //     package.json happner dependency declaration
      // ... and round robbin second call to second remote component

      await test.delay(5000); //wait for discovery

      let results = {};

      results[
        await localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1')
      ] = 1;

      results[
        await localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1')
      ] = 1;

      test.expect(results).to.eql({
        'MESH_1:component3:method1': 1,
        'MESH_2:component3:method1': 1,
      });
    });

    it('overwrites local components that are wrong version', async function () {
      let result = await localInstance.exchange.localComponent1.callDependency(
        'remoteComponent4',
        'method1'
      );
      test.expect(result.split(':')[1]).to.be('component4-v2');
    });

    it('responds with not implemented', async function () {
      try {
        await localInstance.exchange.localComponent1.callDependency('remoteComponent0', 'method1');
      } catch (e) {
        test.expect(e.message).to.be('Not implemented remoteComponent0:^1.0.0:method1');
      }
    });
  });

  context('events', function () {
    it('can subscribe cluster wide', async function () {
      let result = await localInstance.exchange.localComponent2.listTestEvents();
      test.expect(result).to.eql({
        '/_events/DOMAIN_NAME/remoteComponent3/testevent/MESH_2': 1,
        '/_events/DOMAIN_NAME/remoteComponent3/testevent/MESH_1': 1,
      });
    });

    it('does not receive events from incompatible component versions', async function () {
      let result = await localInstance.exchange.localComponent2.listTestCompatibleEvents();
      test.expect(result).to.eql({
        '/_events/DOMAIN_NAME/remoteComponent5/testevent/v2/MESH_2': 1,
      });
    });
  });

  function localInstanceConfig(seq) {
    let config = baseConfig(seq);
    config.modules = {
      localComponent1: {
        path: libDir + 'integration-02-local-component1',
      },
      localComponent2: {
        path: libDir + 'integration-02-local-component2',
      },
      remoteComponent4: {
        path: libDir + 'integration-02-remote-component4-v1',
      },
    };
    config.components = {
      localComponent1: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      localComponent2: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent4: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstance1Config(seq) {
    let config = baseConfig(seq);
    config.modules = {
      remoteComponent3: {
        path: libDir + 'integration-02-remote-component3',
      },
      remoteComponent4: {
        path: libDir + 'integration-02-remote-component4-v2',
      },
      remoteComponent5: {
        path: libDir + 'integration-02-remote-component5-v1',
      },
    };
    config.components = {
      remoteComponent3: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent4: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent5: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstance2Config(seq) {
    let config = baseConfig(seq);
    config.modules = {
      remoteComponent3: {
        path: libDir + 'integration-02-remote-component3',
      },
      remoteComponent4: {
        path: libDir + 'integration-02-remote-component4-v2',
      },
      remoteComponent5: {
        path: libDir + 'integration-02-remote-component5-v2',
      },
    };
    config.components = {
      remoteComponent3: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent4: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent5: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }
});
