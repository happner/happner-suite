const Promise = require('bluebird');
const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const { fork } = require('child_process');

require('../_lib/test-helper').describe({ timeout: 50e3 }, (test) => {
  const servers = [];
  beforeEach('clear mongo collection', function (done) {
    this.timeout(20000);
    stopCluster(servers, function (e) {
      if (e) return done(e);
      servers.splice(0, servers.length);
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  after('Move up getSeq sequence to account for subprocesses', (done) => {
    getSeq.getNext();
    getSeq.getNext();
    done();
  });

  after('stop cluster', function (done) {
    this.timeout(30000);
    stopCluster(servers, function () {
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker', async function () {
    let client;
    let child;
    let first = getSeq.getFirst();
    await startEdge(first, 1);
    // getSeq.getNext();
    child = fork(libDir + 'test-25-sub-process.js', ['2', getSeq.lookupFirst().toString()]);
    child.on('message', (msg) => {
      if (msg === 'kill') child.kill('SIGKILL');
    });
    await test.delay(7000);

    client = await testclient.create('username', 'password', getSeq.getPort(1));
    let result = await client.exchange.breakingComponent.happyMethod();
    test.expect(result).to.be(getSeq.getMeshName(2) + ':brokenComponent:happyMethod');
    result = await client.exchange.breakingComponent.breakingMethod(1, 2);
    test.expect(result).to.be('I am happy!');
    try {
      await client.exchange.breakingComponent.breakingMethod(1); // Too few arguments
      throw new Error("shouldn't happen");
    } catch (e) {
      test.expect(e).to.be('Request timed out');
    }
    child = await fork(libDir + 'test-25-sub-process.js', ['3', getSeq.lookupFirst().toString()]);
    await test.delay(8000);
    result = await client.exchange.breakingComponent.happyMethod();
    test.expect(result).to.be(getSeq.getMeshName(3) + ':brokenComponent:happyMethod');
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
