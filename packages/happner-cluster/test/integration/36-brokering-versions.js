const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  const servers = [];
  let localInstance;

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

  after('stop cluster', function (done) {
    this.timeout(20000);
    stopCluster(servers, function () {
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  it('can broker with version "*", no methods defined, lower version joins first', async function () {
    await startClusterInternalFirst();
    await users.allowMethod(localInstance, 'username', 'remoteComponent', 'getVersion');

    let thisClient = await testclient.create('username', 'password', getSeq.getPort(2));
    let version = await thisClient.exchange.remoteComponent.getVersion();
    test
      .expect(version)
      .to.eql({ mesh: getSeq.getMeshName(1), version: '2.1.2', component: 'remoteComponent1' });
    await startInternal2(getSeq.getNext(), 2);
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

    let thisClient = await testclient.create('username', 'password', getSeq.getPort(2));
    let version = await thisClient.exchange.remoteComponent.getVersion();
    test
      .expect(version)
      .to.eql({ mesh: getSeq.getMeshName(1), version: '3.4.5', component: 'remoteComponent2' });
    await startInternal(getSeq.getNext(), 2);
    await test.delay(3000);
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

  function startClusterInternalFirst() {
    return new Promise(function (resolve, reject) {
      startInternal(getSeq.getFirst(), 1)
        .then(function (server) {
          localInstance = server;
          return startEdge(getSeq.getNext(), 2);
        })
        .then(function () {
          return users.add(localInstance, 'username', 'password');
        })
        .then(function () {
          setTimeout(resolve, 2000);
        })
        .catch(reject);
    });
  }

  function startClusterHighVersionFirst() {
    return new Promise(function (resolve, reject) {
      startInternal2(getSeq.getFirst(), 1)
        .then(function (server) {
          localInstance = server;
          return startEdge(getSeq.getNext(), 2);
        })
        .then(function () {
          return users.add(localInstance, 'username', 'password');
        })
        .then(function () {
          setTimeout(resolve, 2000);
        })
        .catch(reject);
    });
  }
});
