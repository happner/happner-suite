const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client-light');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const testnormalclient = require('../_lib/client');
require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let servers = [],
    localInstance,
    currentClient,
    proxyPorts;

  beforeEach('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  afterEach('disconnect clients', function (done) {
    if (currentClient) {
      currentClient.disconnect(done);
    }
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, function () {
      servers = [];
      done();
    });
  });

  after('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  it('starts the cluster edge first, connects a normal client to the broker instance', async () => {
    await startClusterEdgeFirst();
    await test.delay(2000);
    await setUpSecurity(localInstance);
    await test.delay(2000);
    currentClient = await testnormalclient.create('username', 'password', proxyPorts[0]);
    const result2 = await currentClient.exchange.$call({
      component: 'remoteComponent1',
      method: 'brokeredMethod1',
    });
    test.expect(result2).to.be('MESH_1:remoteComponent:brokeredMethod1');
  });

  it('starts the cluster edge first, connects a light-client to the broker instance', async () => {
    await startClusterEdgeFirst();
    await test.delay(2000);
    await setUpSecurity(localInstance);
    await test.delay(2000);
    currentClient = await testclient.create('DOMAIN_NAME', 'username', 'password', proxyPorts[0]);
    const result2 = await currentClient.exchange.$call({
      component: 'remoteComponent1',
      method: 'brokeredMethod1',
    });
    test.expect(result2).to.be('MESH_1:remoteComponent:brokeredMethod1');
  });

  function startInternal(id, clusterMin) {
    return test.HappnerCluster.create(remoteInstanceConfig(id, clusterMin));
  }

  function startEdge(id, clusterMin) {
    return test.HappnerCluster.create(localInstanceConfig(id, clusterMin));
  }

  async function startClusterEdgeFirst() {
    servers.push(await startEdge(0, 1));
    servers.push((localInstance = await startInternal(1, 2)));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

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
    return config;
  }

  async function setUpSecurity(instance) {
    await users.allowMethod(
      instance,
      'username',
      'brokerComponent',
      'subscribeToRemoteAndGetEvent'
    );
    await users.allowMethod(instance, 'username', 'brokerComponent', 'directMethod');
    await users.allowMethod(instance, 'username', 'remoteComponent', 'brokeredMethod1');
    await users.allowMethod(instance, 'username', 'remoteComponent1', 'brokeredMethod1');
    await users.allowEvent(instance, 'username', 'remoteComponent1', '*');
    await users.allowEvent(instance, 'username', 'brokerComponent', '*');
    await users.allowMethod(instance, 'username', 'prereleaseComponent', 'brokeredMethod1');
    await users.allowMethod(instance, 'username', 'prereleaseComponentNotFound', 'brokeredMethod1');
    await users.allowMethod(instance, 'username', 'prereleaseComponentNotFound', 'brokeredMethod1');
  }
});
