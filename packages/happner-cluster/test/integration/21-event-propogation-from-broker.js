const Promise = require('bluebird');
const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const delay = require('await-delay');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const getSeq = require('../_lib/helpers/getSeq');

require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  var servers = [],
    localInstance;

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

  beforeEach('clear mongo collection', function (done) {
    stopCluster(servers, function () {
      servers = [];
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

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

  function startClusterInternalFirst(replicate) {
    return new Promise(function (resolve, reject) {
      startInternal(getSeq.getFirst(), 1, replicate)
        .then(function (server) {
          servers.push(server);
          localInstance = server;
          return startEdge(getSeq.getNext(), 2, replicate);
        })
        .then(function (server) {
          servers.push(server);
          return startBlank(getSeq.getNext(), 3, replicate);
        })
        .then(function (server) {
          servers.push(server);
          return users.add(localInstance, 'username', 'password');
        })
        .then(resolve)
        .catch(reject);
    });
  }

  function startClusterNoDataInBroker(replicate) {
    return new Promise(function (resolve, reject) {
      startInternal(getSeq.getFirst(), 1, replicate)
        .then(function (server) {
          servers.push(server);
          localInstance = server;
          return startEdgeNoData(getSeq.getNext(), 2, replicate);
        })
        .then(function (server) {
          servers.push(server);
          return startBlank(getSeq.getNext(), 3, replicate);
        })
        .then(function (server) {
          servers.push(server);
          return users.add(localInstance, 'username', 'password');
        })
        .then(resolve)
        .catch(reject);
    });
  }

  function startClusterEdgeFirst() {
    return new Promise(function (resolve, reject) {
      startEdge(getSeq.getFirst(), 1)
        .then(function (server) {
          servers.push(server);
          return startInternal(getSeq.getNext(), 2);
        })
        .then(function (server) {
          servers.push(server);
          localInstance = server;
          return users.add(localInstance, 'username', 'password');
        })
        .then(resolve)
        .catch(reject);
    });
  }

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, function () {
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  it('1. connects a client to the blank instance,checks data events', function (done) {
    let test1Server;
    let handler = test.sinon.stub();
    startBlank(getSeq.getFirst(), 1)
      .then((server) => {
        servers.push(server);
        test1Server = server;
        return users.add(test1Server, 'username', 'password');
      })
      .then(function () {
        return users.allowEvent(test1Server, 'username', 'data', '/brokered/event');
      })
      .then(function () {
        users.allowDataPath(test1Server, 'username', '*');
        return users.allowDataPath(test1Server, 'username', '/brokered/event');
      })
      .then(function () {
        return users.allowMethod(test1Server, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        return client.data.on('_data/data/brokered/event', handler);
      })
      .then(() => {
        return test1Server.exchange.data.set('/brokered/event', { data: 'data1' }, {});
      })
      .then(() => {
        return delay(2500);
      })
      .then(() => {
        test.sinon.assert.calledOnce(handler);
        done();
      })
      .catch(done);
  });

  it('2. connects 2 clients to a cluster with 2 blank instances, checks for _data/data events', function (done) {
    let test2Server1, test2Server2;
    let test2Client1, test2Client2;
    let client1handler1 = test.sinon.stub();
    let client1handler2 = test.sinon.stub();
    let client2handler1 = test.sinon.stub();
    let client2handler2 = test.sinon.stub();
    startBlank(getSeq.getFirst(), 1)
      .then((server) => {
        servers.push(server);
        test2Server1 = server;
        return startBlank(getSeq.getNext(), 2);
      })
      .then((server) => {
        servers.push(server);
        test2Server2 = server;
        return users.add(test2Server1, 'username', 'password');
      })
      .then(function () {
        users.allowEvent(test2Server1, 'username', 'data', '/test/event1');
        users.allowEvent(test2Server1, 'username', 'data', '/test/event2');
        users.allowEvent(test2Server2, 'username', 'data', '/test/event1');
        return users.allowEvent(test2Server2, 'username', 'data', '/test/event2');
      })
      .then(function () {
        users.allowDataPath(test2Server1, 'username', '*');
        return users.allowDataPath(test2Server2, 'username', '*');
      })
      .then(function () {
        // users.allowMethod(test2Server1, 'username', 'data', 'set');
        return users.allowMethod(test2Server2, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        test2Client1 = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then(async (client) => {
        test2Client2 = client;
        await test2Client1.data.on('/_data/data/test/event1', client1handler1);
        await test2Client2.data.on('/_data/data/test/event1', client2handler1);
        await test2Server1.exchange.data.set('test/event1', { data: 'data1' }, {});
        return delay(4000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(client1handler1);
        test.sinon.assert.notCalled(client2handler1);
      })
      .then(async () => {
        await test2Client1.data.on('_data/data/test/event2', client1handler2);
        await test2Client2.data.on('_data/data/test/event2', client2handler2);
        await test2Server2.exchange.data.set('test/event2', { data: 'data2' }, {});
        return delay(4000);
      })
      .then(() => {
        test.sinon.assert.notCalled(client1handler2);
        test.sinon.assert.calledOnce(client2handler2);
        done();
      })
      .catch(done);
  });

  it('3. connects 2 clients to a cluster with 2 blank instances,  checks for /_events/DOMAIN_NAME/data/events', function (done) {
    let test3Server1, test3Server2;
    let test3Client1, test3Client2;
    let client1handler1 = test.sinon.stub();
    let client1handler2 = test.sinon.stub();
    let client2handler1 = test.sinon.stub();
    let client2handler2 = test.sinon.stub();
    startBlank(getSeq.getFirst(), 1)
      .then((server) => {
        servers.push(server);
        test3Server1 = server;
        return startBlank(getSeq.getNext(), 2);
      })
      .then((server) => {
        servers.push(server);
        test3Server2 = server;
        return users.add(test3Server1, 'username', 'password');
      })
      .then(function () {
        users.allowEvent(test3Server1, 'username', 'data', '/test/event1');
        users.allowEvent(test3Server1, 'username', 'data', '/test/event2');
        users.allowEvent(test3Server2, 'username', 'data', '/test/event1');
        return users.allowEvent(test3Server2, 'username', 'data', '/test/event2');
      })
      .then(function () {
        users.allowDataPath(test3Server1, 'username', '*');
        users.allowDataPath(test3Server2, 'username', '*');
      })
      .then(function () {
        users.allowMethod(test3Server1, 'username', 'data', 'set');
        return users.allowMethod(test3Server2, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        test3Client1 = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then((client) => {
        test3Client2 = client;
        test3Client1.data.on('/_events/DOMAIN_NAME/data/test/event1', client1handler1);
        test3Client2.data.on('/_events/DOMAIN_NAME/data/test/event1', client2handler1);
        test3Server1.exchange.data.set('test/event1', { data: 'data1' }, {});
        return delay(4000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(client1handler1);
        test.sinon.assert.calledOnce(client2handler1);
      })
      .then(() => {
        test3Client1.data.on('/_events/DOMAIN_NAME/data/test/event2', client1handler2);
        test3Client2.data.on('/_events/DOMAIN_NAME/data/test/event2', client2handler2);
        test3Server2.exchange.data.set('test/event2', { data: 'data2' }, {});
        return delay(4000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(client1handler2);
        test.sinon.assert.calledOnce(client2handler2);
        done();
      })
      .catch(done);
  });

  it('4. connects 2 clients to a cluster with a remote component instances and broker instance, remote component starts first, checks events on /_data/data', function (done) {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    startClusterInternalFirst()
      .then(() => {
        remoteServer = servers[0];
        brokerServer = servers[1];
        users.allowEvent(remoteServer, 'username', 'data', '*');
        return users.allowEvent(brokerServer, 'username', 'data', '*');
      })
      .then(() => {
        users.allowDataPath(remoteServer, 'username', '*');
        return users.allowDataPath(brokerServer, 'username', '*');
      })
      .then(() => {
        users.allowMethod(remoteServer, 'username', 'data', 'set');
        return users.allowMethod(brokerServer, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        remoteClient = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then((client) => {
        brokerClient = client;
        brokerClient.data.on('/_data/data/test/event1', brokerHandler);
        remoteClient.data.on('/_data/data/test/event1', listenerHandler);
        brokerClient.data.on('/_data/data/test/event2', brokerHandler2);
        remoteClient.data.on('/_data/data/test/event2', listenerHandler2);
        return delay(3000);
      })
      .then(() => {
        remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
        brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
        return delay(3000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(listenerHandler);
        test.sinon.assert.notCalled(brokerHandler);

        test.sinon.assert.notCalled(listenerHandler2);
        test.sinon.assert.calledOnce(brokerHandler2);
        done();
      })
      .catch(done);
  });

  it('5.  connects 2 clients to a cluster with a remote component instances and broker instance, remote component starts first, checks events on /_events/DOMAIN_NAME/data', function (done) {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    startClusterInternalFirst()
      .then(() => {
        remoteServer = servers[0];
        brokerServer = servers[1];
        users.allowEvent(remoteServer, 'username', 'data', '*');
        return users.allowEvent(brokerServer, 'username', 'data', '*');
      })
      .then(() => {
        users.allowDataPath(remoteServer, 'username', '*');
        return users.allowDataPath(brokerServer, 'username', '*');
      })
      .then(() => {
        users.allowMethod(remoteServer, 'username', 'data', 'set');
        return users.allowMethod(brokerServer, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        remoteClient = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then((client) => {
        brokerClient = client;
        brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event1', brokerHandler);
        remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event1', listenerHandler);
        brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event2', brokerHandler2);
        remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event2', listenerHandler2);
        return delay(3000);
      })
      .then(() => {
        remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
        brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
        return delay(3000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(listenerHandler);
        test.sinon.assert.calledOnce(brokerHandler);

        test.sinon.assert.calledOnce(listenerHandler2);
        test.sinon.assert.calledOnce(brokerHandler2);
        done();
      })
      .catch(done);
  });

  it('6. connects 2 clients to a cluster with a remote component instances and broker instance, broker component starts first, checks events on /_data/data', function (done) {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    startClusterEdgeFirst()
      .then(() => {
        remoteServer = servers[0];
        brokerServer = servers[1];
        users.allowEvent(remoteServer, 'username', 'data', '*');
        return users.allowEvent(brokerServer, 'username', 'data', '*');
      })
      .then(() => {
        users.allowDataPath(remoteServer, 'username', '*');
        return users.allowDataPath(brokerServer, 'username', '*');
      })
      .then(() => {
        users.allowMethod(remoteServer, 'username', 'data', 'set');
        return users.allowMethod(brokerServer, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        remoteClient = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then((client) => {
        brokerClient = client;
        brokerClient.data.on('/_data/data/test/event1', brokerHandler);
        remoteClient.data.on('/_data/data/test/event1', listenerHandler);
        brokerClient.data.on('/_data/data/test/event2', brokerHandler2);
        remoteClient.data.on('/_data/data/test/event2', listenerHandler2);
        return delay(3000);
      })
      .then(() => {
        remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
        brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
        return delay(3000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(listenerHandler);
        test.sinon.assert.notCalled(brokerHandler);

        test.sinon.assert.notCalled(listenerHandler2);
        test.sinon.assert.calledOnce(brokerHandler2);
        done();
      })
      .catch(done);
  });

  it('7. connects 2 clients to a cluster with a remote component instances and broker instance, broker component starts first, checks events on /_events/DOMAIN_NAME/data', function (done) {
    let brokerHandler = test.sinon.stub();
    let brokerHandler2 = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let listenerHandler2 = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    startClusterEdgeFirst()
      .then(() => {
        remoteServer = servers[0];
        brokerServer = servers[1];
        users.allowEvent(remoteServer, 'username', 'data', '*');
        return users.allowEvent(brokerServer, 'username', 'data', '*');
      })
      .then(() => {
        users.allowDataPath(remoteServer, 'username', '*');
        return users.allowDataPath(brokerServer, 'username', '*');
      })
      .then(() => {
        users.allowMethod(remoteServer, 'username', 'data', 'set');
        return users.allowMethod(brokerServer, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        remoteClient = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then((client) => {
        brokerClient = client;
        brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event1', brokerHandler);
        remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event1', listenerHandler);
        brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event2', brokerHandler2);
        remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event2', listenerHandler2);
        return delay(3000);
      })
      .then(() => {
        remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
        brokerServer.exchange.data.set('test/event2', { data: 'data2' }, {});
        return delay(3000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(listenerHandler);
        test.sinon.assert.calledOnce(brokerHandler);

        test.sinon.assert.calledOnce(listenerHandler2);
        test.sinon.assert.calledOnce(brokerHandler2);
        done();
      })
      .catch(done);
  });

  it('8. connects 2 clients to a cluster with a remote component instances and broker instance, broker has no data component, checks events on /_events/DOMAIN_NAME/data', function (done) {
    let brokerHandler = test.sinon.stub();
    let listenerHandler = test.sinon.stub();

    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    startClusterNoDataInBroker()
      .then(() => {
        remoteServer = servers[0];
        brokerServer = servers[1];

        users.allowEvent(remoteServer, 'username', 'data', '*');
        return users.allowEvent(brokerServer, 'username', 'data', '*');
      })
      .then(() => {
        users.allowDataPath(remoteServer, 'username', '*');
        return users.allowDataPath(brokerServer, 'username', '*');
      })
      .then(() => {
        users.allowMethod(remoteServer, 'username', 'data', 'set');
        return users.allowMethod(brokerServer, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        remoteClient = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then((client) => {
        brokerClient = client;
        brokerClient.data.on('/_data/data/test/event1', brokerHandler);
        remoteClient.data.on('/_data/data/test/event1', listenerHandler);
        return delay(3000);
      })
      .then(() => {
        remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
        return delay(3000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(listenerHandler);
        test.sinon.assert.notCalled(brokerHandler);
        done();
      })
      .catch(done);
  });

  it('9. connects 2 clients to a cluster with a remote component instances and broker instance, broker has no data component, checks events on /_data/data', function (done) {
    let brokerHandler = test.sinon.stub();
    let listenerHandler = test.sinon.stub();
    let remoteServer, brokerServer;
    let remoteClient, brokerClient;
    startClusterNoDataInBroker()
      .then(() => {
        remoteServer = servers[0];
        brokerServer = servers[1];

        users.allowEvent(remoteServer, 'username', 'data', '*');
        return users.allowEvent(brokerServer, 'username', 'data', '*');
      })
      .then(() => {
        users.allowDataPath(remoteServer, 'username', '*');
        return users.allowDataPath(brokerServer, 'username', '*');
      })
      .then(() => {
        users.allowMethod(remoteServer, 'username', 'data', 'set');
        return users.allowMethod(brokerServer, 'username', 'data', 'set');
      })
      .then(() => {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then((client) => {
        remoteClient = client;
        return testclient.create('username', 'password', getSeq.getPort(2));
      })
      .then((client) => {
        brokerClient = client;
        brokerClient.data.on('/_events/DOMAIN_NAME/data/test/event1', brokerHandler);
        remoteClient.data.on('/_events/DOMAIN_NAME/data/test/event1', listenerHandler);
        return delay(3000);
      })
      .then(() => {
        remoteServer.exchange.data.set('test/event1', { data: 'data1' }, {});
        return delay(3000);
      })
      .then(() => {
        test.sinon.assert.calledOnce(listenerHandler);
        test.sinon.assert.calledOnce(brokerHandler);
        done();
      })
      .catch(done);
  });
});
