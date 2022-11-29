require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  const libDir = require('../_lib/lib-dir').concat(
    'integration-28-cluster-broker-wildcard-version' + test.path.sep
  );
  const baseConfig = require('../_lib/base-config');
  const stopCluster = require('../_lib/stop-cluster');
  const users = require('../_lib/users');
  const testclient = require('../_lib/client');
  const clearMongoCollection = require('../_lib/clear-mongo-collection');

  let servers = [],
    localInstance,
    proxyPorts;

  beforeEach('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
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

  it('starts up the edge cluster node first, with * version and forward declared methods, we start the internal node and ensure the extra api methods have been extended', async () => {
    await startClusterEdgeFirst();
    await test.delay(3e3);
    await users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
    await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
    await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'declaredMethod');
    await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'undeclaredMethod');
    await test.delay(5e3);
    const client = await testclient.create('username', 'password', proxyPorts[0]);
    let result = await client.exchange.brokerComponent.directMethod();
    test.expect(result).to.be('MESH_0:brokerComponent:directMethod');
    result = await client.exchange.remoteComponent.brokeredMethod1();
    test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod1');
    result = await client.exchange.remoteComponent1.declaredMethod();
    test.expect(result).to.be('MESH_1:remoteComponent1:declaredMethod');
    result = await client.exchange.remoteComponent1.undeclaredMethod();
    test.expect(result).to.be('MESH_1:remoteComponent1:undeclaredMethod');
    await test.delay(4e3);
  });

  it('starts up the internal cluster node first, with * version and forward declared methods, we start the edge node and ensure the extra api methods have been extended', async () => {
    await startClusterInternalFirst();
    await test.delay(3e3);
    await users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
    await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
    await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'declaredMethod');
    await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'undeclaredMethod');
    await test.delay(5e3);
    const client = await testclient.create('username', 'password', proxyPorts[1]);
    let result = await client.exchange.brokerComponent.directMethod();
    test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
    result = await client.exchange.remoteComponent.brokeredMethod1();
    test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
    result = await client.exchange.remoteComponent1.declaredMethod();
    test.expect(result).to.be('MESH_0:remoteComponent1:declaredMethod');
    result = await client.exchange.remoteComponent1.undeclaredMethod();
    test.expect(result).to.be('MESH_0:remoteComponent1:undeclaredMethod');
    await test.delay(2000);
  });

  function localInstanceConfig(seq, sync, dynamic) {
    var config = baseConfig(seq, sync, true);
    config.authorityDelegationOn = true;
    let brokerComponentPath = dynamic
      ? libDir + 'broker-component-dynamic'
      : libDir + 'broker-component';
    config.modules = {
      localComponent: {
        path: libDir + 'local-component',
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
    config.modules = {
      remoteComponent: {
        path: libDir + 'remote-component',
      },
      remoteComponent1: {
        path: libDir + 'remote-component-1',
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

  async function startInternal(id, clusterMin) {
    const server = await test.HappnerCluster.create(remoteInstanceConfig(id, clusterMin));
    return server;
  }

  async function startEdge(id, clusterMin, dynamic) {
    const server = await test.HappnerCluster.create(localInstanceConfig(id, clusterMin, dynamic));
    return server;
  }

  async function startClusterInternalFirst(dynamic) {
    servers.push((localInstance = await startInternal(0, 1, dynamic)));
    servers.push(await startEdge(1, 2, dynamic));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  async function startClusterEdgeFirst(dynamic) {
    servers.push(await startEdge(0, 1, dynamic));
    servers.push((localInstance = await startInternal(1, 2, dynamic)));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }
});
