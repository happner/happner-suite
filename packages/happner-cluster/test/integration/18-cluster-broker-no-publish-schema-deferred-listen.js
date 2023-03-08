const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 40e3 }, (test) => {
  let client;
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  it('starts the cluster broker first, client connects and receives no further schema updates, when we flip-flop internal host', async () => {
    await clusterStarter.startClusterEdgeFirst();
    let schemaPublicationCount = 0;
    let internalInstance = test.servers[1];
    await test.delay(5e3);
    test.clients.push(
      (client = await test.client.create('username', 'password', test.proxyPorts[0]))
    );
    await client.data.on('/mesh/schema/description', () => {
      schemaPublicationCount++;
    });
    await internalInstance.stop({ reconnect: false });
    await test.delay(5e3);
    test.servers.pop(); //chuck the stopped server away
    await clusterStarter.startInternal(1, 2);
    await test.delay(5e3);
    test.expect(schemaPublicationCount).to.be(0);
  });

  function localInstanceConfig(seq, sync, dynamic) {
    var config = baseConfig(seq, sync, true);
    let brokerComponentPath = dynamic
      ? libDir + 'integration-10-broker-component-dynamic'
      : libDir + 'integration-09-broker-component';

    config.cluster = config.cluster || {};
    config.cluster.dependenciesSatisfiedDeferListen = true;
    config.modules = {
      localComponent: {
        path: libDir + 'integration-09-local-component',
      },
      brokerComponent: {
        path: brokerComponentPath,
      },
    };
    config.components = {
      localComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      brokerComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-09-remote-component',
      },
      remoteComponent1: {
        path: libDir + 'integration-09-remote-component-1',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent1: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }
});
