require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let deploymentId = test.newid();
  const libDir = require('../_lib/lib-dir').concat(
    'integration-29-cluster-dependencies-asAdmin-call' + test.path.sep
  );
  const baseConfig = require('../_lib/base-config');
  const users = test.users;
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  it('starts up the edge cluster node first, with * version and forward declared methods, we start the internal node and ensure the extra api methods have been extended', async () => {
    const edgeInstance = await clusterStarter.startEdge(0, 1);
    await users.add(edgeInstance, 'username', 'password');
    await users.allowMethod(edgeInstance, 'username', 'edgeComponent', 'callRemote');
    await users.allowMethod(edgeInstance, 'username', 'remoteComponent', 'remoteMethod');
    let proxyPort = test.servers[0]._mesh.happn.server.config.services.proxy.port;
    const client = await test.client.create('username', 'password', proxyPort);
    let errorMessage;
    try {
      await client.exchange.edgeComponent.callRemote();
    } catch (e) {
      errorMessage = e.message;
    }
    test
      .expect(errorMessage)
      .to.be(
        'invalid endpoint options: [remoteComponent.remoteMethod] method does not exist on the api'
      );
    await clusterStarter.startInternal(1, 2);
    await test.delay(2000);
    await client.exchange.edgeComponent.callRemote();
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    //config.cluster.dependenciesSatisfiedDeferListen = true;
    config.modules = {
      edgeComponent: {
        path: libDir + 'edge-component',
      },
    };
    config.components = {
      edgeComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
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
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
      },
    };
    return config;
  }
});
