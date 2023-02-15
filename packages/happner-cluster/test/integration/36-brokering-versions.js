const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let thisClient;
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  it('can broker with version "*", no methods defined, lower version joins first', async function () {
    await clusterStarter.startClusterInternalFirst();
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'getVersion');

    test.clients.push(
      (thisClient = await test.client.create('username', 'password', test.proxyPorts[1]))
    );
    let version = await thisClient.exchange.remoteComponent.getVersion();
    test
      .expect(version)
      .to.eql({ mesh: 'MESH_0', version: '2.1.2', component: 'remoteComponent1' });
    await startInternal2(2, 2);
    await test.delay(3000);
    let version2;
    [version, version2] = await Promise.all([
      thisClient.exchange.remoteComponent.getVersion(),
      thisClient.exchange.remoteComponent.getVersion(), //To test that it doesn't round robin to a lower version component
    ]);
    test
      .expect(version)
      .to.eql({ mesh: 'MESH_2', version: '3.4.5', component: 'remoteComponent2' });
    test
      .expect(version2)
      .to.eql({ mesh: 'MESH_2', version: '3.4.5', component: 'remoteComponent2' });
  });

  it('can broker with version "*", no methods defined, higher version joins first', async function () {
    await startClusterHighVersionFirst();
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'getVersion');
    test.clients.push(
      (thisClient = await test.client.create('username', 'password', test.proxyPorts[1]))
    );
    let version = await thisClient.exchange.remoteComponent.getVersion();
    test
      .expect(version)
      .to.eql({ mesh: 'MESH_0', version: '3.4.5', component: 'remoteComponent2' });
    await clusterStarter.startInternal(2, 2);
    await test.delay(2e3);
    version = await thisClient.exchange.remoteComponent.getVersion();
    let version2 = await thisClient.exchange.remoteComponent.getVersion(); //To test that it doesn't round robin to a lower version component
    test
      .expect(version)
      .to.eql({ mesh: 'MESH_0', version: '3.4.5', component: 'remoteComponent2' });
    test
      .expect(version2)
      .to.eql({ mesh: 'MESH_0', version: '3.4.5', component: 'remoteComponent2' });
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.authorityDelegationOn = true;
    let brokerComponentPath = libDir + 'integration-36/broker-component';

    config.modules = {
      brokerComponent: {
        path: brokerComponentPath,
      },
    };
    config.components = {
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
        path: libDir + 'integration-36/remote-component-1',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstanceConfig2(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-36/remote-component-2',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  async function startInternal2(id, clusterMin) {
    const server = await test.HappnerCluster.create(remoteInstanceConfig2(id, clusterMin));
    test.servers.push(server);
    return server;
  }

  async function startClusterHighVersionFirst(dynamic) {
    test.localInstance = await startInternal2(0, 1, dynamic);
    await clusterStarter.startEdge(1, 2, dynamic);
    await test.delay(2e3);
    await test.users.add(test.localInstance, 'username', 'password');
    test.proxyPorts = test.servers.map(
      (server) => server._mesh.happn.server.config.services.proxy.port
    );
  }
});
