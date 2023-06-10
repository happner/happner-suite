require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let deploymentId = test.newid();
  const libDir = require('../_lib/lib-dir').concat(
    'integration-28-cluster-broker-wildcard-version' + test.path.sep
  );
  const baseConfig = require('../_lib/base-config');
  const users = test.users;

  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  it('starts up the edge cluster node first, with * version and forward declared methods, we start the internal node and ensure the extra api methods have been extended', async () => {
    await clusterStarter.startClusterEdgeFirst();
    await test.delay(3e3);
    await users.allowMethod(test.localInstance, 'username', 'brokerComponent', 'directMethod');
    await users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
    await users.allowMethod(test.localInstance, 'username', 'remoteComponent1', 'declaredMethod');
    await users.allowMethod(test.localInstance, 'username', 'remoteComponent1', 'undeclaredMethod');
    await test.delay(5e3);
    const client = await test.client.create('username', 'password', test.proxyPorts[0]);
    let result = await client.exchange.brokerComponent.directMethod();
    test.expect(result).to.be('MESH_0:brokerComponent:directMethod');
    result = await client.exchange.remoteComponent.brokeredMethod1();
    test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod1');
    result = await client.exchange.remoteComponent1.declaredMethod();
    test.expect(result).to.be('MESH_1:remoteComponent1:declaredMethod');
    result = await client.exchange.remoteComponent1.undeclaredMethod();
    test.expect(result).to.be('MESH_1:remoteComponent1:undeclaredMethod');
  });

  it('starts up the internal cluster node first, with * version and forward declared methods, we start the edge node and ensure the extra api methods have been extended', async () => {
    await clusterStarter.startClusterInternalFirst();
    await test.delay(3e3);
    await users.allowMethod(test.localInstance, 'username', 'brokerComponent', 'directMethod');
    await users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
    await users.allowMethod(test.localInstance, 'username', 'remoteComponent1', 'declaredMethod');
    await users.allowMethod(test.localInstance, 'username', 'remoteComponent1', 'undeclaredMethod');
    await test.delay(5e3);
    const client = await test.client.create('username', 'password', test.proxyPorts[1]);
    let result = await client.exchange.brokerComponent.directMethod();
    test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
    result = await client.exchange.remoteComponent.brokeredMethod1();
    test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
    result = await client.exchange.remoteComponent1.declaredMethod();
    test.expect(result).to.be('MESH_0:remoteComponent1:declaredMethod');
    result = await client.exchange.remoteComponent1.undeclaredMethod();
    test.expect(result).to.be('MESH_0:remoteComponent1:undeclaredMethod');
  });

  function localInstanceConfig(seq, sync, dynamic) {
    var config = baseConfig(seq, sync, true);
    config.authorityDelegationOn = true;
    let brokerComponentPath = dynamic
      ? libDir + 'broker-component-dynamic'
      : libDir + 'broker-component';
    config.modules = {
      localComponent: {
        path: libDir + 'local-component',
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 20, // 50 per second
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      remoteComponent: {
        path: libDir + 'remote-component',
      },
      remoteComponent1: {
        path: libDir + 'remote-component-1',
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 20, // 50 per second
      },
    };
    return config;
  }
});
