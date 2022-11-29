const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let servers = [],
    localInstance,
    proxyPorts;

  beforeEach('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  afterEach('stop cluster', function (done) {
    stopCluster(servers, function () {
      servers = [];
      done();
    });
  });
  after('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  it('can broker with version "*", no methods defined, lower version joins first', async function () {
    await startClusterInternalFirst();
    await users.allowMethod(localInstance, 'username', 'remoteComponent', 'getVersion');

    let thisClient = await testclient.create('username', 'password', proxyPorts[1]);
    let version = await thisClient.exchange.remoteComponent.getVersion();
    test
      .expect(version)
      .to.eql({ mesh: getSeq.getMeshName(1), version: '2.1.2', component: 'remoteComponent1' });
    await startInternal2(2, 2);
    await test.delay(3000);
    let version2;
    [version, version2] = await Promise.all([
      thisClient.exchange.remoteComponent.getVersion(),
      thisClient.exchange.remoteComponent.getVersion(), //To test that it doesn't round robin to a lower version component
    ]);
    test
      .expect(version)
      .to.eql({ mesh: getSeq.getMeshName(3), version: '3.4.5', component: 'remoteComponent2' });
    test
      .expect(version2)
      .to.eql({ mesh: getSeq.getMeshName(3), version: '3.4.5', component: 'remoteComponent2' });
  });

  it('can broker with version "*", no methods defined, higher version joins first', async function () {
    await startClusterHighVersionFirst();
    await users.allowMethod(localInstance, 'username', 'remoteComponent', 'getVersion');

    let thisClient = await testclient.create('username', 'password', proxyPorts[1]);
    let version = await thisClient.exchange.remoteComponent.getVersion();
    test
      .expect(version)
      .to.eql({ mesh: getSeq.getMeshName(1), version: '3.4.5', component: 'remoteComponent2' });
    await startInternal(2, 2);
    await test.delay(1000);
    version = await thisClient.exchange.remoteComponent.getVersion();
    let version2 = await thisClient.exchange.remoteComponent.getVersion(); //To test that it doesn't round robin to a lower version component
    test
      .expect(version)
      .to.eql({ mesh: getSeq.getMeshName(1), version: '3.4.5', component: 'remoteComponent2' });
    test
      .expect(version2)
      .to.eql({ mesh: getSeq.getMeshName(1), version: '3.4.5', component: 'remoteComponent2' });
  });
  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.authorityDelegationOn = true;
    let brokerComponentPath = libDir + 'integration-36/broker-component';

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
    return config;
  }

  function remoteInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-36/remote-component-1',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstanceConfig2(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-36/remote-component-2',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  async function startInternal(id, clusterMin) {
    const server = await test.HappnerCluster.create(remoteInstanceConfig(id, clusterMin));
    servers.push(server);
    return server;
  }

  async function startInternal2(id, clusterMin) {
    const server = await test.HappnerCluster.create(remoteInstanceConfig2(id, clusterMin));
    servers.push(server);
    return server;
  }
  async function startEdge(id, clusterMin) {
    const server = await test.HappnerCluster.create(localInstanceConfig(id, clusterMin));
    servers.push(server);
    return server;
  }
  async function startClusterInternalFirst(dynamic) {
    localInstance = await startInternal(0, 1, dynamic);
    await startEdge(1, 2, dynamic);
    await test.delay(2e3);
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  async function startClusterHighVersionFirst(dynamic) {
    localInstance = await startInternal2(0, 1, dynamic);
    await startEdge(1, 2, dynamic);
    await test.delay(2e3);
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }
});
