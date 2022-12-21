const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  test.hooks.clusterStartedSeperatelyHooks(test);
  let localInstance, proxyPorts;

  it('1. connects a client to the blank instance,checks data events', async function () {
    let test1Server, client;
    let handler = test.sinon.stub();
    test.servers.push((test1Server = await startBlank(0, 1)));
    proxyPorts = test.servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
    await test.users.add(test1Server, 'username', 'password');
    await test.users.allowEvent(test1Server, 'username', 'data', '/brokered/event');
    await test.users.allowDataPath(test1Server, 'username', '*');
    await test.users.allowDataPath(test1Server, 'username', '/brokered/event');
    await test.users.allowMethod(test1Server, 'username', 'data', 'set');
    test.clients.push((client = await test.client.create('username', 'password', proxyPorts[0])));

    await client.data.on('_data/data/brokered/event', handler);
    await test1Server.exchange.data.set('/brokered/event', { data: 'data1' }, {});
    await test.delay(3e3);
    test.sinon.assert.calledOnce(handler);
  });

  it('2. connects 2 clients to a cluster with 2 blank instances, checks for _data/data events', async function () {
    let test2Server1, test2Server2;
    let test2Client1, test2Client2;
    let client1handler1 = test.sinon.stub();
    let client1handler2 = test.sinon.stub();
    let client2handler1 = test.sinon.stub();
    let client2handler2 = test.sinon.stub();
    test.servers.push((test2Server1 = await startBlank(0, 1)));
    test.servers.push((test2Server2 = await startBlank(1, 2)));
    await test.delay(2e3);
    await test.users.add(test2Server1, 'username', 'password');
    proxyPorts = test.servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
    await test.users.allowEvent(test2Server1, 'username', 'data', '/test/event1');
    await test.users.allowEvent(test2Server1, 'username', 'data', '/test/event2');
    await test.users.allowEvent(test2Server2, 'username', 'data', '/test/event1');
    await test.users.allowEvent(test2Server2, 'username', 'data', '/test/event2');
    await test.users.allowDataPath(test2Server1, 'username', '*');
    await test.users.allowDataPath(test2Server2, 'username', '*');
    await test.users.allowMethod(test2Server2, 'username', 'data', 'set');
    test.clients.push(
      (test2Client1 = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (test2Client2 = await test.client.create('username', 'password', proxyPorts[1]))
    );

    await test2Client1.data.on('/_data/data/test/event1', client1handler1);
    await test2Client2.data.on('/_data/data/test/event1', client2handler1);
    await test2Server1.exchange.data.set('test/event1', { data: 'data1' }, {});
    await test.delay(3e3);
    test.sinon.assert.calledOnce(client1handler1);
    test.sinon.assert.notCalled(client2handler1);

    await test2Client1.data.on('_data/data/test/event2', client1handler2);
    await test2Client2.data.on('_data/data/test/event2', client2handler2);
    await test2Server2.exchange.data.set('test/event2', { data: 'data2' }, {});
    await test.delay(3e3);

    test.sinon.assert.notCalled(client1handler2);
    test.sinon.assert.calledOnce(client2handler2);
  });

  it('3. connects 2 clients to a cluster with 2 blank instances,  checks for /_events/DOMAIN_NAME/data/events', async function () {
    let test3Server1, test3Server2;
    let test3Client1, test3Client2;
    let client1handler1 = test.sinon.stub();
    let client1handler2 = test.sinon.stub();
    let client2handler1 = test.sinon.stub();
    let client2handler2 = test.sinon.stub();
    test.servers.push((test3Server1 = await startBlank(0, 1)));
    test.servers.push((test3Server2 = await startBlank(1, 2)));

    await test.users.add(test3Server1, 'username', 'password');
    proxyPorts = test.servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
    await test.users.allowEvent(test3Server1, 'username', 'data', '/test/event1');
    await test.users.allowEvent(test3Server1, 'username', 'data', '/test/event2');
    await test.users.allowEvent(test3Server2, 'username', 'data', '/test/event1');
    await test.users.allowEvent(test3Server2, 'username', 'data', '/test/event2');

    await test.users.allowDataPath(test3Server1, 'username', '*');
    await test.users.allowDataPath(test3Server2, 'username', '*');
    await test.users.allowMethod(test3Server1, 'username', 'data', 'set');
    await test.users.allowMethod(test3Server2, 'username', 'data', 'set');
    test.clients.push(
      (test3Client1 = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (test3Client2 = await test.client.create('username', 'password', proxyPorts[1]))
    );

    await test3Client1.data.on('/_events/DOMAIN_NAME/data/test/event1', client1handler1);
    await test3Client2.data.on('/_events/DOMAIN_NAME/data/test/event1', client2handler1);
    await test3Server1.exchange.data.set('test/event1', { data: 'data1' }, {});
    await test.delay(3e3);

    test.sinon.assert.calledOnce(client1handler1);
    test.sinon.assert.calledOnce(client2handler1);

    await test3Client1.data.on('/_events/DOMAIN_NAME/data/test/event2', client1handler2);
    await test3Client2.data.on('/_events/DOMAIN_NAME/data/test/event2', client2handler2);
    await test3Server2.exchange.data.set('test/event2', { data: 'data2' }, {});
    await test.delay(3e3);

    test.sinon.assert.calledOnce(client1handler2);
    test.sinon.assert.calledOnce(client2handler2);
  });

  it('4. connects 2 clients to a cluster with a remote component instances and broker instance, remote component starts first, checks events on /_data/data', async function () {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    await startClusterInternalFirst();
    remoteServer = test.servers[0];
    brokerServer = test.servers[1];

    await test.users.allowEvent(remoteServer, 'username', 'data', '*');
    await test.users.allowEvent(brokerServer, 'username', 'data', '*');
    await test.users.allowDataPath(remoteServer, 'username', '*');
    await test.users.allowDataPath(brokerServer, 'username', '*');
    await test.users.allowMethod(remoteServer, 'username', 'data', 'set');
    await test.users.allowMethod(brokerServer, 'username', 'data', 'set');

    test.clients.push(
      (remoteClient = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (brokerClient = await test.client.create('username', 'password', proxyPorts[1]))
    );

    await brokerClient.data.on('/_data/data/test/event1', brokerHandler);
    await remoteClient.data.on('/_data/data/test/event1', listenerHandler);
    await brokerClient.data.on('/_data/data/test/event2', brokerHandler2);
    await remoteClient.data.on('/_data/data/test/event2', listenerHandler2);

    await remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
    await brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
    await test.delay(3e3);

    test.sinon.assert.calledOnce(listenerHandler);
    test.sinon.assert.notCalled(brokerHandler);

    test.sinon.assert.notCalled(listenerHandler2);
    test.sinon.assert.calledOnce(brokerHandler2);
  });

  it('5.  connects 2 clients to a cluster with a remote component instances and broker instance, remote component starts first, checks events on /_events/DOMAIN_NAME/data', async function () {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    await startClusterInternalFirst();

    remoteServer = test.servers[0];
    brokerServer = test.servers[1];
    await test.users.allowEvent(remoteServer, 'username', 'data', '*');
    await test.users.allowEvent(brokerServer, 'username', 'data', '*');
    await test.users.allowDataPath(remoteServer, 'username', '*');
    await test.users.allowDataPath(brokerServer, 'username', '*');
    await test.users.allowMethod(remoteServer, 'username', 'data', 'set');
    await test.users.allowMethod(brokerServer, 'username', 'data', 'set');

    test.clients.push(
      (remoteClient = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (brokerClient = await test.client.create('username', 'password', proxyPorts[1]))
    );

    await brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event1', brokerHandler);
    await remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event1', listenerHandler);
    await brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event2', brokerHandler2);
    await remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event2', listenerHandler2);
    await test.delay(3e3);
    await remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
    await brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
    await test.delay(3e3);

    test.sinon.assert.calledOnce(listenerHandler);
    test.sinon.assert.calledOnce(brokerHandler);

    test.sinon.assert.calledOnce(listenerHandler2);
    test.sinon.assert.calledOnce(brokerHandler2);
  });

  it('6. connects 2 clients to a cluster with a remote component instances and broker instance, broker component starts first, checks events on /_data/data', async function () {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    await startClusterEdgeFirst();
    remoteServer = test.servers[0];
    brokerServer = test.servers[1];
    await test.users.allowEvent(remoteServer, 'username', 'data', '*');
    await test.users.allowEvent(brokerServer, 'username', 'data', '*');

    await test.users.allowDataPath(remoteServer, 'username', '*');
    await test.users.allowDataPath(brokerServer, 'username', '*');

    await test.users.allowMethod(remoteServer, 'username', 'data', 'set');
    await test.users.allowMethod(brokerServer, 'username', 'data', 'set');

    test.clients.push(
      (remoteClient = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (brokerClient = await test.client.create('username', 'password', proxyPorts[1]))
    );

    await brokerClient.data.on('/_data/data/test/event1', brokerHandler);
    await remoteClient.data.on('/_data/data/test/event1', listenerHandler);
    await brokerClient.data.on('/_data/data/test/event2', brokerHandler2);
    await remoteClient.data.on('/_data/data/test/event2', listenerHandler2);
    await test.delay(3000);

    await remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
    await brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
    await test.delay(3000);

    test.sinon.assert.calledOnce(listenerHandler);
    test.sinon.assert.notCalled(brokerHandler);

    test.sinon.assert.notCalled(listenerHandler2);
    test.sinon.assert.calledOnce(brokerHandler2);
  });

  it('7. connects 2 clients to a cluster with a remote component instances and broker instance, broker component starts first, checks events on /_events/DOMAIN_NAME/data', async function () {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;

    await startClusterEdgeFirst();
    remoteServer = test.servers[0];
    brokerServer = test.servers[1];

    await test.users.allowEvent(remoteServer, 'username', 'data', '*');
    await test.users.allowEvent(brokerServer, 'username', 'data', '*');
    await test.users.allowDataPath(remoteServer, 'username', '*');
    await test.users.allowDataPath(brokerServer, 'username', '*');
    await test.users.allowMethod(remoteServer, 'username', 'data', 'set');
    await test.users.allowMethod(brokerServer, 'username', 'data', 'set');

    test.clients.push(
      (remoteClient = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (brokerClient = await test.client.create('username', 'password', proxyPorts[1]))
    );
    await brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event1', brokerHandler);
    await remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event1', listenerHandler);
    await brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event2', brokerHandler2);
    await remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event2', listenerHandler2);
    await test.delay(3e3);

    await remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
    await brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
    await test.delay(3000);

    test.sinon.assert.calledOnce(listenerHandler);
    test.sinon.assert.calledOnce(brokerHandler);

    test.sinon.assert.calledOnce(listenerHandler2);
    test.sinon.assert.calledOnce(brokerHandler2);
  });

  it('8. connects 2 clients to a cluster with a remote component instances and broker instance, broker has no data component, checks events on /_events/DOMAIN_NAME/data', async function () {
    let brokerHandler = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;

    await startClusterNoDataInBroker();
    remoteServer = test.servers[0];
    brokerServer = test.servers[1];

    await test.users.allowEvent(remoteServer, 'username', 'data', '*');
    await test.users.allowEvent(brokerServer, 'username', 'data', '*');
    await test.users.allowDataPath(remoteServer, 'username', '*');
    await test.users.allowDataPath(brokerServer, 'username', '*');
    await test.users.allowMethod(remoteServer, 'username', 'data', 'set');
    await test.users.allowMethod(brokerServer, 'username', 'data', 'set');

    test.clients.push(
      (remoteClient = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (brokerClient = await test.client.create('username', 'password', proxyPorts[1]))
    );

    await brokerClient.data.on('/_data/data/test/event1', brokerHandler);
    await remoteClient.data.on('/_data/data/test/event1', listenerHandler);
    await test.delay(3000);

    await remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
    await test.delay(3000);

    test.sinon.assert.calledOnce(listenerHandler);
    test.sinon.assert.notCalled(brokerHandler);
  });

  it('9. connects 2 clients to a cluster with a remote component instances and broker instance, broker has no data component, checks events on /_data/data', async function () {
    let brokerHandler = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    await startClusterNoDataInBroker();
    remoteServer = test.servers[0];
    brokerServer = test.servers[1];

    await test.users.allowEvent(remoteServer, 'username', 'data', '*');
    await test.users.allowEvent(brokerServer, 'username', 'data', '*');
    await test.users.allowDataPath(remoteServer, 'username', '*');
    await test.users.allowDataPath(brokerServer, 'username', '*');
    await test.users.allowMethod(remoteServer, 'username', 'data', 'set');
    await test.users.allowMethod(brokerServer, 'username', 'data', 'set');

    test.clients.push(
      (remoteClient = await test.client.create('username', 'password', proxyPorts[0]))
    );
    test.clients.push(
      (brokerClient = await test.client.create('username', 'password', proxyPorts[1]))
    );

    await brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event1', brokerHandler);
    await remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event1', listenerHandler);
    await test.delay(3000);

    await remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
    await test.delay(3000);
    test.sinon.assert.calledOnce(listenerHandler);
    test.sinon.assert.calledOnce(brokerHandler);
  });

  function localInstanceConfig(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.modules = {
      brokerComponent: {
        path: libDir + 'integration-21-broker-component',
      },
    };
    config.components = {
      brokerComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      data: {},
    };
    return config;
  }

  function localInstanceConfigNoData(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.modules = {
      brokerComponent: {
        path: libDir + 'integration-21-broker-component',
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

  function blankInstanceConfig(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.modules = {
      dependentComponent: {
        path: libDir + 'integration-21-dependant-component',
      },
    };
    config.components = {
      dependentComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      data: {},
    };
    return config;
  }

  function remoteInstanceConfig(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-21-remote-component',
      },
    };
    config.components = {
      remoteComponent: {},
      data: {},
    };
    return config;
  }

  function startInternal(id, clusterMin, replicate) {
    return test.HappnerCluster.create(remoteInstanceConfig(id, clusterMin, replicate));
  }

  function startEdge(id, clusterMin, replicate) {
    return test.HappnerCluster.create(localInstanceConfig(id, clusterMin, replicate));
  }

  function startEdgeNoData(id, clusterMin, replicate) {
    return test.HappnerCluster.create(localInstanceConfigNoData(id, clusterMin, replicate));
  }

  function startBlank(id, clusterMin, replicate) {
    return test.HappnerCluster.create(blankInstanceConfig(id, clusterMin, replicate));
  }

  async function startClusterInternalFirst(replicate) {
    test.servers.push((localInstance = await startInternal(0, 1, replicate)));
    test.servers.push(await startEdge(1, 2, replicate));
    test.servers.push(await startBlank(2, 3, replicate));
    await test.users.add(localInstance, 'username', 'password');
    proxyPorts = test.servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  async function startClusterEdgeFirst(replicate) {
    test.servers.push(await startEdge(0, 1, replicate));
    localInstance = await startInternal(1, 2, replicate);
    test.servers.push(localInstance);
    await test.users.add(localInstance, 'username', 'password');
    proxyPorts = test.servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  async function startClusterNoDataInBroker(replicate) {
    test.servers.push((localInstance = await startInternal(0, 1, replicate)));
    test.servers.push(await startEdgeNoData(1, 2, replicate));
    test.servers.push(await startBlank(2, 3, replicate));
    await test.users.add(localInstance, 'username', 'password');
    proxyPorts = test.servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }
});
