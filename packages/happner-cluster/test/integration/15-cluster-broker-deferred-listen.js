var libDir = require('../_lib/lib-dir');
var baseConfig = require('../_lib/base-config');

let deploymentId;
require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  deploymentId = test.newid();
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  context('exchange', function () {
    it('starts the cluster broker first, fails to connect a client to the broker instance because listening is deferred, we start the internal brokered node, the client is now able to connect as we have the full API dynamically loaded', async function () {
      var client;
      var gotToFinalAttempt = false;
      var edgeInstance;
      let proxyPorts = [];
      edgeInstance = await clusterStarter.startEdge(0, 1);
      try {
        await test.client.create('username', 'password', proxyPorts[0]);
        throw new Error('not meant to happen');
      } catch (e) {
        if (e.message.indexOf('connect ECONNREFUSED') !== 0) throw 'unexpected error: ' + e.message;
      }
      await test.users.add(edgeInstance, 'username', 'password');

      let instance = await clusterStarter.startInternal(1, 2);
      await test.delay(3e3);
      proxyPorts.push(edgeInstance._mesh.happn.server.config.services.proxy.port);
      proxyPorts.push(instance._mesh.happn.server.config.services.proxy.port);
      await test.users.allowMethod(edgeInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(edgeInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      await test.users.allowMethod(edgeInstance, 'username', 'remoteComponent1', 'brokeredMethod1');
      await test.delay(3e3);

      test.clients.push((client = await test.client.create('username', 'password', proxyPorts[0])));
      let result = await client.exchange.brokerComponent.directMethod();
      test.expect(result).to.be('MESH_0:brokerComponent:directMethod');

      //call an injected method
      result = await client.exchange.remoteComponent.brokeredMethod1();
      test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod1');
      result = await client.exchange.remoteComponent1.brokeredMethod1();
      test.expect(result).to.be('MESH_1:remoteComponent1:brokeredMethod1');
      await test.users.denyMethod(edgeInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      try {
        gotToFinalAttempt = true;
        await client.exchange.remoteComponent.brokeredMethod1();
        throw new Error('not meant to happen');
      } catch (e) {
        test.expect(gotToFinalAttempt).to.be(true);
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
      }
    });
  });

  function localInstanceConfig(seq, sync, dynamic) {
    var config = baseConfig(seq, sync, true);
    let brokerComponentPath = dynamic
      ? libDir + 'integration-10-broker-component-dynamic'
      : libDir + 'integration-09-broker-component';

    config.happn.services.membership.config.serviceName = 'remote-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
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
    config.happn.services.membership.config.serviceName = 'remote-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
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
