const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let deploymentId = test.newid();
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);
  let client;

  context('exchange', function () {
    it('starts the cluster edge first, connects a client to the local instance, and is not able to access the unimplemented remote component', async () => {
      let emitted;
      await clusterStarter.startClusterEdgeFirst();
      await setUpSecurity(test.localInstance);
      await test.delay(2000);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      const result1 = await client.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be('MESH_0:brokerComponent:directMethod');
      await client.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        (data) => {
          emitted = data;
        }
      );
      const result2 = await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      test.expect(result2).to.be('MESH_1:remoteComponent:brokeredMethod1');
      await test.delay(2000);

      const result3 = await client.exchange.$call({
        component: 'prereleaseComponent',
        method: 'brokeredMethod1',
      });

      test.expect(result3).to.be('MESH_1:prereleaseComponent:brokeredMethod1');
      try {
        await client.exchange.$call({
          component: 'prereleaseComponent',
          method: 'unknownMethod',
        });
        throw new Error('was not meant to happen');
      } catch (e) {
        test
          .expect(e.message)
          .to.be(
            'invalid endpoint options: [prereleaseComponent.unknownMethod] method does not exist on the api'
          );
        test.expect(emitted).to.eql({
          topic: 'MESH_1:remoteComponent:brokeredMethod1',
        });
      }
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $once', async () => {
      let emitted = [];
      await clusterStarter.startClusterEdgeFirst();
      await setUpSecurity(test.localInstance);
      await test.delay(3000);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      const result1 = await client.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be('MESH_0:brokerComponent:directMethod');
      await client.event.$once(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        (data) => {
          emitted.push(data);
        }
      );
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test.expect(emitted).to.eql([{ topic: 'MESH_1:remoteComponent:brokeredMethod1' }]);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $off', async () => {
      let emitted = [];
      await clusterStarter.startClusterEdgeFirst();
      await setUpSecurity(test.localInstance);
      await test.delay(2000);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      const result1 = await client.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be('MESH_0:brokerComponent:directMethod');
      const id = await client.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      await client.event.$off({
        component: 'remoteComponent1',
        id,
      });
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test.expect(emitted).to.eql([{ topic: 'MESH_1:remoteComponent:brokeredMethod1' }]);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $offPath', async () => {
      let emitted = [];
      await clusterStarter.startClusterEdgeFirst();
      await setUpSecurity(test.localInstance);
      await test.delay(2000);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      const result1 = await client.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be('MESH_0:brokerComponent:directMethod');
      await client.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await client.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      await client.event.$offPath({
        component: 'remoteComponent1',
        path: '*',
      });
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test
        .expect(emitted)
        .to.eql([
          { topic: 'MESH_1:remoteComponent:brokeredMethod1' },
          { topic: 'MESH_1:remoteComponent:brokeredMethod1' },
        ]);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests inter-mesh $on', async () => {
      await clusterStarter.startClusterEdgeFirst();
      await setUpSecurity(test.localInstance);
      await test.delay(2000);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      const events = [];
      await client.event.$on(
        {
          component: 'brokerComponent',
          path: '*',
        },
        (data) => {
          events.push(data);
        }
      );

      await test.delay(2000);
      let result;
      result = await client.exchange.$call({
        component: 'brokerComponent',
        method: 'subscribeToRemoteAndGetEvent',
      });
      test.expect(result.length).to.be(1);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $offPath - negative', async () => {
      let emitted = [];
      await clusterStarter.startClusterEdgeFirst();
      await setUpSecurity(test.localInstance);
      await test.delay(2000);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      const result1 = await client.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be('MESH_0:brokerComponent:directMethod');
      await client.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await client.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test
        .expect(emitted)
        .to.eql([
          { topic: 'MESH_1:remoteComponent:brokeredMethod1' },
          { topic: 'MESH_1:remoteComponent:brokeredMethod1' },
          { topic: 'MESH_1:remoteComponent:brokeredMethod1' },
          { topic: 'MESH_1:remoteComponent:brokeredMethod1' },
        ]);
    });

    it('starts the cluster internal first, connects a client to the local instance, and is not able to access the unimplemented remote component, prerelease not found', async function () {
      await clusterStarter.startClusterInternalFirst();

      await test.users.allowMethod(
        test.localInstance,
        'username',
        'brokerComponent',
        'directMethod'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'remoteComponent',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'prereleaseComponent',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'prereleaseComponentNotFound',
        'brokeredMethod1'
      );
      await test.delay(3e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[1]))
      );
      //first test our broker components methods are directly callable
      let result = await client.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });

      test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
      //call to good version of method
      await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });

      //call to prerelease method
      await client.exchange.$call({
        component: 'prereleaseComponent',
        method: 'brokeredMethod1',
      });
      //call to bad version of method
      try {
        await client.exchange.$call({
          component: 'prereleaseComponentNotFound',
          method: 'brokeredMethod1',
        });
        throw new Error('Sholud not happn!');
      } catch (e) {
        //expect a failure - wrong version
        test
          .expect(e.message)
          .to.be(
            'invalid endpoint options: [prereleaseComponentNotFound.brokeredMethod1] method does not exist on the api'
          );
      }
    });

    it('starts the cluster internal first, tries to call a non-existent component', async function () {
      await clusterStarter.startClusterInternalFirst();

      await test.users.allowMethod(
        test.localInstance,
        'username',
        'brokerComponent',
        'directMethod'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'remoteComponent',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'prereleaseComponent',
        'brokeredMethod1'
      );
      await test.users.allowMethod(
        test.localInstance,
        'username',
        'unknownComponent',
        'brokeredMethod1'
      );
      await test.delay(2e3);

      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[1]))
      );
      try {
        await client.exchange.$call({
          component: 'unknownComponent',
          method: 'brokeredMethod1',
        });
        throw new Error('Should not happn!');
      } catch (e) {
        //expect a failure - wrong version
        test
          .expect(e.message)
          .to.be(
            'invalid endpoint options: [unknownComponent] component does not exist on the api'
          );
      }
    });
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
      },
    };
    return config;
  }

  async function setUpSecurity(instance) {
    await test.users.allowMethod(
      instance,
      'username',
      'brokerComponent',
      'subscribeToRemoteAndGetEvent'
    );
    await test.users.allowMethod(instance, 'username', 'brokerComponent', 'directMethod');
    await test.users.allowMethod(instance, 'username', 'remoteComponent', 'brokeredMethod1');
    await test.users.allowMethod(instance, 'username', 'remoteComponent1', 'brokeredMethod1');
    await test.users.allowEvent(instance, 'username', 'remoteComponent1', '*');
    await test.users.allowEvent(instance, 'username', 'brokerComponent', '*');
    await test.users.allowMethod(instance, 'username', 'prereleaseComponent', 'brokeredMethod1');
    await test.users.allowMethod(
      instance,
      'username',
      'prereleaseComponentNotFound',
      'brokeredMethod1'
    );
    await test.users.allowMethod(
      instance,
      'username',
      'prereleaseComponentNotFound',
      'brokeredMethod1'
    );
  }
});
