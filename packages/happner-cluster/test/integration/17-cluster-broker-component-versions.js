const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let localInstance, client;
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  context('exchange', function () {
    it('starts the cluster internal first, connects a client to the local instance, and is not able to access the unimplemented remote component', async function () {
      await clusterStarter.startClusterInternalFirst();
      localInstance = test.servers[0];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        localInstance,
        'username',
        'prereleaseComponent',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        localInstance,
        'username',
        'prereleaseComponentNotFound',
        'brokeredMethod1'
      );
      await test.delay(3e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[1]))
      );
      //first test our broker components methods are directly callable
      let result = await client.exchange.brokerComponent.directMethod();

      test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
      //call to good version of method
      await client.exchange.remoteComponent1.brokeredMethod1();
      //call to prerelease method
      await client.exchange.prereleaseComponent.brokeredMethod1();
      //call to bad version of method
      try {
        await client.exchange.remoteComponent.brokeredMethod1();
        throw new Error('Shouldnt Happn');
      } catch (e) {
        //expect a failure - wrong version
        test.expect(e.message).to.be('Not implemented remoteComponent:^1.0.0:brokeredMethod1');
      }
    });

    it('starts the cluster internal first, connects a client to the local instance, and is not able to access the unimplemented remote component, prerelease not found', async function () {
      await clusterStarter.startClusterInternalFirst();
      localInstance = test.servers[0];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        localInstance,
        'username',
        'prereleaseComponent',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        localInstance,
        'username',
        'prereleaseComponentNotFound',
        'brokeredMethod1'
      );
      await test.delay(3e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[1]))
      );

      //first test our broker components methods are directly callable
      let result = await client.exchange.brokerComponent.directMethod();
      test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
      //call to good version of method
      await client.exchange.remoteComponent1.brokeredMethod1();
      //call to prerelease method
      await client.exchange.prereleaseComponent.brokeredMethod1();
      try {
        //call to bad version of method
        await client.exchange.prereleaseComponentNotFound.brokeredMethod1();
        throw new Error('Shouldnt Happn');
      } catch (e) {
        //expect a failure - wrong version
        test
          .expect(e.message)
          .to.be('Not implemented prereleaseComponentNotFound:^4.0.0:brokeredMethod1');
      }
    });
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      brokerComponent: {
        path: libDir + 'integration-broker-component-versions',
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
        path: libDir + 'integration-remote-component-versions',
      },
      prereleaseComponent: {
        path: libDir + 'integration-remote-component-versions-prerelease',
      },
      prereleaseComponentNotFound: {
        path: libDir + 'integration-remote-component-versions-prerelease-not-found',
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
});
