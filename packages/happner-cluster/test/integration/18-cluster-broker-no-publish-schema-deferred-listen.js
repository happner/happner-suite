const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const getSeq = require('../_lib/helpers/getSeq');
require('../_lib/test-helper').describe({ timeout: 40e3 }, (test) => {
  let servers = [];

  beforeEach('clear mongo collection', function (done) {
    stopCluster(servers, function (e) {
      if (e) return done(e);
      servers = [];
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  it('starts the cluster broker first, client connects and receives no further schema updates, when we flip-flop internal host', async () => {
    let schemaPublicationCount = 0;
    let edgeInstance = await startEdge(getSeq.getFirst(), 1);
    let internalInstance = await startInternal(getSeq.getNext(), 2);
    await test.delay(5e3);
    await users.add(edgeInstance, 'username', 'password');
    const client = await testclient.create('username', 'password', getSeq.getPort(1));
    await client.data.on('/mesh/schema/description', () => {
      schemaPublicationCount++;
    });
    await internalInstance.stop({ reconnect: false });
    await test.delay(5e3);
    servers.pop(); //chuck the stopped server away
    await startInternal(getSeq.getCurrent(), 2);
    await test.delay(5e3);
    test.expect(schemaPublicationCount).to.be(0);
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, function () {
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  function startInternal(id, clusterMin) {
    return new Promise((resolve, reject) => {
      return test.HappnerCluster.create(remoteInstanceConfig(id, clusterMin))
        .then(function (instance) {
          servers.push(instance);
          resolve(instance);
        })
        .catch(reject);
    });
  }

  function startEdge(id, clusterMin, dynamic) {
    return new Promise((resolve, reject) => {
      return test.HappnerCluster.create(localInstanceConfig(id, clusterMin, dynamic))
        .then(function (instance) {
          servers.push(instance);
          resolve(instance);
        })
        .catch(reject);
    });
  }

  function localInstanceConfig(seq, sync, dynamic) {
    var config = baseConfig(seq, sync, true);
    let brokerComponentPath = dynamic
      ? libDir + 'integration-10-broker-component-dynamic'
      : libDir + 'integration-09-broker-component';

    config.cluster = config.cluster || {};
    config.cluster.dependenciesSatisfiedDeferListen = true;
    config.modules = {
      localComponent: {
        path: libDir + 'integration-09-local-component',
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
        path: libDir + 'integration-09-remote-component',
      },
      remoteComponent1: {
        path: libDir + 'integration-09-remote-component-1',
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
});
