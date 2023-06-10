const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 60e3, skip: true }, (test) => {
  let deploymentId = test.newid();
  test.log(`DEPLOYMENT_ID: ${deploymentId}`);
  let client, internalClient;
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  it('internal first, connects a client to the local instance, and is able to access the remote component events via the broker, inter-cluster events on', async () => {
    await clusterStarter.startClusterInternalFirst([false, false]);
    await test.delay(4000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'brokerComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'postEvent');
    await test.users.allowMethod(test.localInstance, 'username', 'localComponent', 'postEvent');
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'remoteComponent',
      'getReceivedEvents'
    );
    await test.users.allowEvent(test.localInstance, 'username', 'remoteComponent', '/remote/event');
    test.clients.push(
      (client = await test.client.create('username', 'password', test.proxyPorts[1]))
    );
    const receivedEvents = [];
    await client.event.remoteComponent.on('/remote/event', function (data) {
      receivedEvents.push(data);
    });
    await client.exchange.remoteComponent.postEvent();
    await client.exchange.localComponent.postEvent();
    await test.delay(4000);
    test.expect(receivedEvents.length).to.be(1);
    const localComponentReceivedEvents = await client.exchange.localComponent.getReceivedEvents();
    const remoteComponentReceivedEvents = await client.exchange.remoteComponent.getReceivedEvents();
    const brokerComponentReceivedEvents = await client.exchange.brokerComponent.getReceivedEvents();
    test.expect(localComponentReceivedEvents.length).to.be(1);
    test.expect(remoteComponentReceivedEvents.length).to.be(1);
    test.expect(brokerComponentReceivedEvents.length).to.be(2);
  });

  it('internal first, connects a client to the local instance, and is able to access the remote component events via the broker, inter-cluster events off', async () => {
    await clusterStarter.startClusterInternalFirst([false, true]);
    await test.delay(4000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'brokerComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'postEvent');
    await test.users.allowMethod(test.localInstance, 'username', 'localComponent', 'postEvent');
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'remoteComponent',
      'getReceivedEvents'
    );
    await test.users.allowEvent(test.localInstance, 'username', 'remoteComponent', '/remote/event');
    test.clients.push(
      (client = await test.client.create('username', 'password', test.proxyPorts[1]))
    );
    const receivedEvents = [];
    await client.event.remoteComponent.on('/remote/event', function (data) {
      receivedEvents.push(data);
    });
    await client.exchange.remoteComponent.postEvent();
    await client.exchange.localComponent.postEvent();
    await test.delay(6000);
    test.expect(receivedEvents.length).to.be(1);
    const localComponentReceivedEvents = await client.exchange.localComponent.getReceivedEvents();
    const remoteComponentReceivedEvents = await client.exchange.remoteComponent.getReceivedEvents();
    const brokerComponentReceivedEvents = await client.exchange.brokerComponent.getReceivedEvents();
    test.expect(localComponentReceivedEvents.length).to.be(1);
    test.expect(remoteComponentReceivedEvents.length).to.be(0);
    test.expect(brokerComponentReceivedEvents.length).to.be(2);

    // check to see that permissions propagation still works
    // we revoke permission to localComponent.postEvent - using the edge instance
    // we ensure that the revocation makes its way to the internal cluster member
    test.clients.push(
      (internalClient = await test.client.create('username', 'password', test.proxyPorts[0]))
    );
    //this should work for now...
    await internalClient.exchange.remoteComponent.postEvent();
    // now deny the method on the edge instance
    await test.users.denyMethod(test.edgeInstance, 'username', 'remoteComponent', 'postEvent');
    await test.delay(4000);
    let errorMessage;
    try {
      // this should fail
      await internalClient.exchange.remoteComponent.postEvent();
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  it('edge first, connects a client to the local instance, and is able to access the remote component events via the broker, inter-cluster events on', async () => {
    await clusterStarter.startClusterEdgeFirst([false, false]);
    await test.delay(4000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'brokerComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'postEvent');
    await test.users.allowMethod(test.localInstance, 'username', 'localComponent', 'postEvent');
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'remoteComponent',
      'getReceivedEvents'
    );
    await test.users.allowEvent(test.localInstance, 'username', 'remoteComponent', '/remote/event');
    test.clients.push(
      (client = await test.client.create('username', 'password', test.proxyPorts[0]))
    );
    const receivedEvents = [];
    await client.event.remoteComponent.on('/remote/event', function (data) {
      receivedEvents.push(data);
    });
    await client.exchange.remoteComponent.postEvent();
    await client.exchange.localComponent.postEvent();
    await test.delay(4000);
    test.expect(receivedEvents.length).to.be(1);
    const localComponentReceivedEvents = await client.exchange.localComponent.getReceivedEvents();
    const remoteComponentReceivedEvents = await client.exchange.remoteComponent.getReceivedEvents();
    const brokerComponentReceivedEvents = await client.exchange.brokerComponent.getReceivedEvents();
    test.expect(localComponentReceivedEvents.length).to.be(1);
    test.expect(remoteComponentReceivedEvents.length).to.be(1);
    test.expect(brokerComponentReceivedEvents.length).to.be(2);
  });

  it('edge first, connects a client to the local instance, and is able to access the remote component events via the broker, inter-cluster events off', async () => {
    await clusterStarter.startClusterEdgeFirst([false, true]);
    await test.delay(4000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'brokerComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent', 'postEvent');
    await test.users.allowMethod(test.localInstance, 'username', 'localComponent', 'postEvent');
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent',
      'getReceivedEvents'
    );
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'remoteComponent',
      'getReceivedEvents'
    );
    await test.users.allowEvent(test.localInstance, 'username', 'remoteComponent', '/remote/event');
    test.clients.push(
      (client = await test.client.create('username', 'password', test.proxyPorts[0]))
    );
    const receivedEvents = [];
    await client.event.remoteComponent.on('/remote/event', function (data) {
      receivedEvents.push(data);
    });
    await client.exchange.remoteComponent.postEvent();
    await client.exchange.localComponent.postEvent();
    await test.delay(4000);
    test.expect(receivedEvents.length).to.be(1);
    const localComponentReceivedEvents = await client.exchange.localComponent.getReceivedEvents();
    const remoteComponentReceivedEvents = await client.exchange.remoteComponent.getReceivedEvents();
    const brokerComponentReceivedEvents = await client.exchange.brokerComponent.getReceivedEvents();
    test.expect(localComponentReceivedEvents.length).to.be(1);
    test.expect(remoteComponentReceivedEvents.length).to.be(0);
    test.expect(brokerComponentReceivedEvents.length).to.be(2);
  });

  function localInstanceConfig(seq, sync, suppress) {
    let suppressInterClusterEvents = suppress[0] || false;
    const replicate = suppressInterClusterEvents ? false : null;
    const config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.modules = {
      localComponent: {
        path: libDir + 'integration-27-local-component',
      },
      brokerComponent: {
        path: libDir + 'integration-27-broker-component',
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

  function remoteInstanceConfig(seq, sync, suppress) {
    let suppressInterClusterEvents = suppress[1] || false;
    const replicate = suppressInterClusterEvents ? false : null;
    const config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-27-remote-component',
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
        securityChangeSetReplicateInterval: 20, // 50 per second
      },
    };
    return config;
  }
});
