require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  const libDir = require('../_lib/lib-dir').concat(
    'integration-29-cluster-dependencies-asAdmin-call' + test.path.sep
  );
  const baseConfig = require('../_lib/base-config');
  const stopCluster = require('../_lib/stop-cluster');
  const users = require('../_lib/users');
  const testclient = require('../_lib/client');
  const clearMongoCollection = require('../_lib/clear-mongo-collection');
  let servers = [];

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
    const edgeInstance = await startEdge(0, 1);
    await users.add(edgeInstance, 'username', 'password');
    await users.allowMethod(edgeInstance, 'username', 'edgeComponent', 'callRemote');
    await users.allowMethod(edgeInstance, 'username', 'remoteComponent', 'remoteMethod');
    let proxyPort = servers[0]._mesh.happn.server.config.services.proxy.port;
    const client = await testclient.create('username', 'password', proxyPort);
    let errorMessage;
    try {
      await client.exchange.edgeComponent.callRemote();
    } catch (e) {
      errorMessage = e.message;
    }
    test
      .expect(errorMessage)
      .to.be(
        'invalid endpoint options: [remoteComponent.remoteMethod] method does not exist on the api'
      );
    await startInternal(1, 2);
    await test.delay(2000);
    await client.exchange.edgeComponent.callRemote();
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    //config.cluster.dependenciesSatisfiedDeferListen = true;
    config.modules = {
      edgeComponent: {
        path: libDir + 'edge-component',
      },
    };
    config.components = {
      edgeComponent: {
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

  async function startEdge(id, clusterMin, dynamic) {
    const server = await test.HappnerCluster.create(localInstanceConfig(id, clusterMin, dynamic));
    servers.push(server);
    return server;
  }
});
