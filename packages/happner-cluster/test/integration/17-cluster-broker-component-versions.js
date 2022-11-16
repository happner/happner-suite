const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  var servers = [],
    localInstance,
    proxyPorts;

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.modules = {
      brokerComponent: {
        path: libDir + 'integration-broker-component-versions',
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
        path: libDir + 'integration-remote-component-versions',
      },
      prereleaseComponent: {
        path: libDir + 'integration-remote-component-versions-prerelease',
      },
      prereleaseComponentNotFound: {
        path: libDir + 'integration-remote-component-versions-prerelease-not-found',
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

  beforeEach('clear mongo collection', function (done) {
    stopCluster(servers, function (e) {
      if (e) return done(e);
      servers = [];
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  function startInternal(id, clusterMin) {
    return test.HappnerCluster.create(remoteInstanceConfig(id, clusterMin));
  }

  function startEdge(id, clusterMin) {
    return test.HappnerCluster.create(localInstanceConfig(id, clusterMin));
  }

  async function startClusterInternalFirst(dynamic) {
    localInstance = await startInternal(0, 1, dynamic);
    servers.push(localInstance);
    servers.push(await startEdge(1, 2, dynamic));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  after('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, function () {
      clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
        done();
      });
    });
  });

  context('exchange', function () {
    it('starts the cluster internal first, connects a client to the local instance, and is not able to access the unimplemented remote component', function (done) {
      var thisClient;

      startClusterInternalFirst()
        .then(function () {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(function () {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
        })
        .then(function () {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod1'
          );
        })
        .then(function () {
          return users.allowMethod(
            localInstance,
            'username',
            'prereleaseComponent',
            'brokeredMethod1'
          );
        })
        .then(function () {
          return users.allowMethod(
            localInstance,
            'username',
            'prereleaseComponentNotFound',
            'brokeredMethod1'
          );
        })
        .then(function () {
          return new Promise((resolve) => {
            setTimeout(resolve, 5000);
          });
        })
        .then(function () {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          thisClient = client;
          //first test our broker components methods are directly callable
          return thisClient.exchange.brokerComponent.directMethod();
        })
        .then(function (result) {
          test.expect(result).to.be(getSeq.getMeshName(2) + ':brokerComponent:directMethod');
          //call to good version of method
          return thisClient.exchange.remoteComponent1.brokeredMethod1();
        })
        .then(function () {
          //call to prerelease method
          return thisClient.exchange.prereleaseComponent.brokeredMethod1();
        })
        .then(function () {
          //call to bad version of method
          return thisClient.exchange.remoteComponent.brokeredMethod1();
        })
        .catch((e) => {
          //expect a failure - wrong version
          test.expect(e.message).to.be('Not implemented remoteComponent:^1.0.0:brokeredMethod1');
          done();
        });
    });

    it('starts the cluster internal first, connects a client to the local instance, and is not able to access the unimplemented remote component, prerelease not found', function (done) {
      var thisClient;

      startClusterInternalFirst()
        .then(function () {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(function () {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
        })
        .then(function () {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod1'
          );
        })
        .then(function () {
          return users.allowMethod(
            localInstance,
            'username',
            'prereleaseComponent',
            'brokeredMethod1'
          );
        })
        .then(function () {
          return users.allowMethod(
            localInstance,
            'username',
            'prereleaseComponentNotFound',
            'brokeredMethod1'
          );
        })
        .then(function () {
          return new Promise((resolve) => {
            setTimeout(resolve, 5000);
          });
        })
        .then(function () {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          thisClient = client;
          //first test our broker components methods are directly callable
          return thisClient.exchange.brokerComponent.directMethod();
        })
        .then(function (result) {
          test.expect(result).to.be(getSeq.getMeshName(2) + ':brokerComponent:directMethod');
          //call to good version of method
          return thisClient.exchange.remoteComponent1.brokeredMethod1();
        })
        .then(function () {
          //call to prerelease method
          return thisClient.exchange.prereleaseComponent.brokeredMethod1();
        })
        .then(function () {
          //call to bad version of method
          return thisClient.exchange.prereleaseComponentNotFound.brokeredMethod1();
        })
        .catch((e) => {
          //expect a failure - wrong version
          test
            .expect(e.message)
            .to.be('Not implemented prereleaseComponentNotFound:^4.0.0:brokeredMethod1');
          done();
        });
    });
  });
});
