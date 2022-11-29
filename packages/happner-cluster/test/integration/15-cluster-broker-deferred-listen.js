var libDir = require('../_lib/lib-dir');
var baseConfig = require('../_lib/base-config');
var stopCluster = require('../_lib/stop-cluster');
var users = require('../_lib/users');
var testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
var clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  var servers = [];

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

  beforeEach('clear mongo collection', function (done) {
    stopCluster(servers, function (e) {
      if (e) return done(e);
      servers = [];
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
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

  async function startEdge(id, clusterMin, dynamic) {
    let instance = await test.HappnerCluster.create(localInstanceConfig(id, clusterMin, dynamic));
    servers.push(instance);
    return instance;
  }

  context('exchange', function () {
    it('starts the cluster broker first, fails to connect a client to the broker instance because listening is deferred, we start the internal brokered node, the client is now able to connect as we have the full API dynamically loaded', async function () {
      var thisClient;
      var gotToFinalAttempt = false;
      var edgeInstance;
      let proxyPorts = [];
      edgeInstance = await startEdge(0, 1);
      try {
        await testclient.create('username', 'password', proxyPorts[0]);
        throw new Error('not meant to happen');
      } catch (e) {
        if (e.message.indexOf('connect ECONNREFUSED') !== 0) throw 'unexpected error: ' + e.message;
      }
      await users.add(edgeInstance, 'username', 'password');

      let instance = await startInternal(1, 2);
      await test.delay(3e3);
      proxyPorts.push(edgeInstance._mesh.happn.server.config.services.proxy.port);
      proxyPorts.push(instance._mesh.happn.server.config.services.proxy.port);
      await users.allowMethod(edgeInstance, 'username', 'brokerComponent', 'directMethod');
      await users.allowMethod(edgeInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      await users.allowMethod(edgeInstance, 'username', 'remoteComponent1', 'brokeredMethod1');
      await test.delay(3e3);

      thisClient = await testclient.create('username', 'password', proxyPorts[0]);
      let result = await thisClient.exchange.brokerComponent.directMethod();
      test.expect(result).to.be('MESH_0:brokerComponent:directMethod');

      //call an injected method
      result = await thisClient.exchange.remoteComponent.brokeredMethod1();
      test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod1');
      result = await thisClient.exchange.remoteComponent1.brokeredMethod1();
      test.expect(result).to.be('MESH_1:remoteComponent1:brokeredMethod1');
      await users.denyMethod(edgeInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      try {
        gotToFinalAttempt = true;
        await thisClient.exchange.remoteComponent.brokeredMethod1();
        throw new Error('not meant to happen');
      } catch (e) {
        test.expect(gotToFinalAttempt).to.be(true);
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
      }
    });
  });
});
