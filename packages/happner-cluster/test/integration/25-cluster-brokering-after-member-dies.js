const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const { fork } = require('child_process');

require('../_lib/test-helper').describe({ timeout: 50e3 }, (test) => {
  let deploymentId = test.newid();
  test.hooks.clusterStartedSeperatelyHooks(test);

  it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker', async function () {
    let client;
    let child;
    await startEdge(0, 1);
    child = fork(libDir + 'test-25-sub-process.js', ['1', deploymentId]);
    child.on('message', (msg) => {
      if (msg === 'kill') child.kill('SIGKILL');
    });
    await test.delay(6e3);
    let proxyPort = test.servers[0]._mesh.happn.server.config.services.proxy.port;
    test.clients.push((client = await test.client.create('username', 'password', proxyPort)));
    let result = await client.exchange.breakingComponent.happyMethod();
    test.expect(result).to.be('MESH_1:brokenComponent:happyMethod');
    result = await client.exchange.breakingComponent.breakingMethod(1, 2);
    test.expect(result).to.be('I am happy!');
    try {
      await client.exchange.breakingComponent.breakingMethod(1); // Too few arguments
      throw new Error("shouldn't happen");
    } catch (e) {
      test.expect(e.message).to.be('Request timed out');
      child.kill('SIGKILL');
    }
    child = await fork(libDir + 'test-25-sub-process.js', ['2', deploymentId]);
    await test.delay(5e3);
    result = await client.exchange.breakingComponent.happyMethod();
    test.expect(result).to.be('MESH_2:brokenComponent:happyMethod');
    result = await client.exchange.breakingComponent.breakingMethod(1, 2);
    test.expect(result).to.be('I am happy!');
    child.kill('SIGKILL');
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.authorityDelegationOn = true;
    let brokerComponentPath = libDir + 'integration-25-broker-component';
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 20, // 50 per second
      },
    };
    return config;
  }

  async function startEdge(id, clusterMin, dynamic) {
    const server = await test.HappnerCluster.create(localInstanceConfig(id, clusterMin, dynamic));
    test.servers.push(server);
    return server;
  }
});
