const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let currentClient;
  const users = test.users;

  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  it('starts the cluster edge first, connects a normal client to the broker instance', async () => {
    await clusterStarter.startClusterEdgeFirst();
    await test.delay(2000);
    await setUpSecurity(test.localInstance);
    await test.delay(2000);
    test.clients.push(
      (currentClient = await test.client.create('username', 'password', test.proxyPorts[0]))
    );
    const result2 = await currentClient.exchange.$call({
      component: 'remoteComponent1',
      method: 'brokeredMethod1',
    });
    test.expect(result2).to.be('MESH_1:remoteComponent:brokeredMethod1');
  });

  it('starts the cluster edge first, connects a light-client to the broker instance', async () => {
    await clusterStarter.startClusterEdgeFirst();
    await test.delay(2000);
    await setUpSecurity(test.localInstance);
    await test.delay(2000);
    test.clients.push(
      (currentClient = await test.lightClient.create(
        'DOMAIN_NAME',
        'username',
        'password',
        test.proxyPorts[0]
      ))
    );
    const result2 = await currentClient.exchange.$call({
      component: 'remoteComponent1',
      method: 'brokeredMethod1',
    });
    test.expect(result2).to.be('MESH_1:remoteComponent:brokeredMethod1');
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      brokerComponent: {
        path: libDir + 'integration-broker-component-versions-call-on',
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
        path: libDir + 'integration-remote-component-versions-call-on',
      },
      prereleaseComponent: {
        path: libDir + 'integration-remote-component-versions-prerelease-call-on',
      },
      prereleaseComponentNotFound: {
        path: libDir + 'integration-remote-component-versions-prerelease-not-found-call-on',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent1: {
        module: 'remoteComponent',
        startMethod: 'start',
        stopMethod: 'stop',
      },
      prereleaseComponent: {
        module: 'prereleaseComponent',
        startMethod: 'start',
        stopMethod: 'stop',
      },
      prereleaseComponentNotFound: {
        module: 'prereleaseComponentNotFound',
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  async function setUpSecurity(instance) {
    await users.allowMethod(
      instance,
      'username',
      'brokerComponent',
      'subscribeToRemoteAndGetEvent'
    );
    await users.allowMethod(instance, 'username', 'brokerComponent', 'directMethod');
    await users.allowMethod(instance, 'username', 'remoteComponent', 'brokeredMethod1');
    await users.allowMethod(instance, 'username', 'remoteComponent1', 'brokeredMethod1');
    await users.allowEvent(instance, 'username', 'remoteComponent1', '*');
    await users.allowEvent(instance, 'username', 'brokerComponent', '*');
    await users.allowMethod(instance, 'username', 'prereleaseComponent', 'brokeredMethod1');
    await users.allowMethod(instance, 'username', 'prereleaseComponentNotFound', 'brokeredMethod1');
    await users.allowMethod(instance, 'username', 'prereleaseComponentNotFound', 'brokeredMethod1');
  }
});
