const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const testclient = require('../_lib/client');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const { fork } = require('child_process');

require('../_lib/test-helper').describe({ timeout: 50e3 }, (test) => {
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

  it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker', async function () {
    let client;
    let child;
    await startEdge(0, 1);
    child = fork(libDir + 'test-25-sub-process.js', ['1']);
    child.on('message', (msg) => {
      if (msg === 'kill') child.kill('SIGKILL');
    });
    await test.delay(7000);
    let proxyPort = servers[0]._mesh.happn.server.config.services.proxy.port;
    client = await testclient.create('username', 'password', proxyPort);
    let result = await client.exchange.breakingComponent.happyMethod();
    test.expect(result).to.be('MESH_1:brokenComponent:happyMethod');
    result = await client.exchange.breakingComponent.breakingMethod(1, 2);
    test.expect(result).to.be('I am happy!');
    try {
      await client.exchange.breakingComponent.breakingMethod(1); // Too few arguments
      throw new Error("shouldn't happen");
    } catch (e) {
      test.expect(e.message).to.be('Request timed out');
    }
    child = await fork(libDir + 'test-25-sub-process.js', ['2']);
    await test.delay(8000);
    result = await client.exchange.breakingComponent.happyMethod();
    test.expect(result).to.be('MESH_2:brokenComponent:happyMethod');
    result = await client.exchange.breakingComponent.breakingMethod(1, 2);
    test.expect(result).to.be('I am happy!');
    child.kill('SIGKILL');
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.authorityDelegationOn = true;
    let brokerComponentPath = libDir + 'integration-25-broker-component';
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

  async function startEdge(id, clusterMin, dynamic) {
    const server = await test.HappnerCluster.create(localInstanceConfig(id, clusterMin, dynamic));
    servers.push(server);
    return server;
  }
});
