const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const getSeq = require('../_lib/helpers/getSeq');

require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let servers = [],
    localInstance,
    proxyPorts;

  beforeEach('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  afterEach('stop cluster', function (done) {
    // console.log('AFTER ALL');
    if (!servers) return done();
    stopCluster(servers, () => {
      servers = [];
      done();
    });
  });

  after('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  context('exchange', function () {
    it('starts the cluster edge first, connects a client to the local instance, and is not able to access the unimplemented remote component', async () => {
      let thisClient, emitted;
      try {
        await startClusterEdgeFirst();
        await test.delay(2000);
        await setUpSecurity(localInstance);
        await test.delay(2000);
        thisClient = await testclient.create('username', 'password', proxyPorts[0]);
        const result1 = await thisClient.exchange.$call({
          component: 'brokerComponent',
          method: 'directMethod',
        });
        test.expect(result1).to.be(getSeq.getMeshName(1) + ':brokerComponent:directMethod');
        await thisClient.event.$on(
          {
            component: 'remoteComponent1',
            path: '*',
          },
          (data) => {
            emitted = data;
          }
        );
        const result2 = await thisClient.exchange.$call({
          component: 'remoteComponent1',
          method: 'brokeredMethod1',
        });
        test.expect(result2).to.be(getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1');
        await test.delay(2000);

        const result3 = await thisClient.exchange.$call({
          component: 'prereleaseComponent',
          method: 'brokeredMethod1',
        });

        test.expect(result3).to.be(getSeq.getMeshName(2) + ':prereleaseComponent:brokeredMethod1');

        await thisClient.exchange.$call({
          component: 'prereleaseComponent',
          method: 'unknownMethod',
        });
      } catch (e) {
        test
          .expect(e.message)
          .to.be(
            'invalid endpoint options: [prereleaseComponent.unknownMethod] method does not exist on the api'
          );
        test.expect(emitted).to.eql({
          topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1',
        });
        return;
      }
      throw new Error('was not meant to happen');
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $once', async () => {
      let thisClient,
        emitted = [];
      await startClusterEdgeFirst();
      await test.delay(3e3);
      await setUpSecurity(localInstance);
      await test.delay(3000);
      thisClient = await testclient.create('username', 'password', proxyPorts[0]);
      const result1 = await thisClient.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be(getSeq.getMeshName(1) + ':brokerComponent:directMethod');
      await thisClient.event.$once(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        (data) => {
          emitted.push(data);
        }
      );
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test
        .expect(emitted)
        .to.eql([{ topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' }]);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $off', async () => {
      let thisClient,
        emitted = [];
      await startClusterEdgeFirst();
      await test.delay(2000);
      await setUpSecurity(localInstance);
      await test.delay(2000);
      thisClient = await testclient.create('username', 'password', proxyPorts[0]);
      const result1 = await thisClient.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be(getSeq.getMeshName(1) + ':brokerComponent:directMethod');
      const id = await thisClient.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      await thisClient.event.$off({
        component: 'remoteComponent1',
        id,
      });
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test
        .expect(emitted)
        .to.eql([{ topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' }]);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $offPath', async () => {
      let thisClient,
        emitted = [];
      await startClusterEdgeFirst();
      await test.delay(2000);
      await setUpSecurity(localInstance);
      await test.delay(2000);
      thisClient = await testclient.create('username', 'password', proxyPorts[0]);
      const result1 = await thisClient.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be(getSeq.getMeshName(1) + ':brokerComponent:directMethod');
      await thisClient.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await thisClient.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      await thisClient.event.$offPath({
        component: 'remoteComponent1',
        path: '*',
      });
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test
        .expect(emitted)
        .to.eql([
          { topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' },
          { topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' },
        ]);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests inter-mesh $on', async () => {
      let thisClient;
      await startClusterEdgeFirst();
      await test.delay(2000);
      await setUpSecurity(localInstance);
      await test.delay(2000);
      thisClient = await testclient.create('username', 'password', proxyPorts[0]);
      const events = [];
      await thisClient.event.$on(
        {
          component: 'brokerComponent',
          path: '*',
        },
        (data) => {
          events.push(data);
        }
      );

      await test.delay(2000);
      let result;
      result = await thisClient.exchange.$call({
        component: 'brokerComponent',
        method: 'subscribeToRemoteAndGetEvent',
      });
      test.expect(result.length).to.be(1);
    });

    it('starts the cluster edge first, connects a client to the local instance, tests $offPath - negative', async () => {
      let thisClient,
        emitted = [];
      await startClusterEdgeFirst();
      await test.delay(2000);
      await setUpSecurity(localInstance);
      await test.delay(2000);
      thisClient = await testclient.create('username', 'password', proxyPorts[0]);
      const result1 = await thisClient.exchange.$call({
        component: 'brokerComponent',
        method: 'directMethod',
      });
      test.expect(result1).to.be(getSeq.getMeshName(1) + ':brokerComponent:directMethod');
      await thisClient.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await thisClient.event.$on(
        {
          component: 'remoteComponent1',
          path: '*',
        },
        async (data) => {
          emitted.push(data);
        }
      );
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      await thisClient.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod1',
      });
      await test.delay(2000);
      test
        .expect(emitted)
        .to.eql([
          { topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' },
          { topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' },
          { topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' },
          { topic: getSeq.getMeshName(2) + ':remoteComponent:brokeredMethod1' },
        ]);
    });

    it('starts the cluster internal first, connects a client to the local instance, and is not able to access the unimplemented remote component, prerelease not found', function (done) {
      let thisClient,
        reachedEnd = false;

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
          return thisClient.exchange.$call({
            component: 'brokerComponent',
            method: 'directMethod',
          });
        })
        .then(function (result) {
          test.expect(result).to.be(getSeq.getMeshName(2) + ':brokerComponent:directMethod');
          //call to good version of method
          return thisClient.exchange.$call({
            component: 'remoteComponent1',
            method: 'brokeredMethod1',
          });
        })
        .then(function () {
          //call to prerelease method
          return thisClient.exchange.$call({
            component: 'prereleaseComponent',
            method: 'brokeredMethod1',
          });
        })
        .then(function () {
          reachedEnd = true;
          //call to bad version of method
          return thisClient.exchange.$call({
            component: 'prereleaseComponentNotFound',
            method: 'brokeredMethod1',
          });
        })
        .catch((e) => {
          //expect a failure - wrong version
          test
            .expect(e.message)
            .to.be(
              'invalid endpoint options: [prereleaseComponentNotFound.brokeredMethod1] method does not exist on the api'
            );
          test.expect(reachedEnd).to.be(true);
          done();
        });
    });

    it('starts the cluster internal first, tries to call a non-existent component', function (done) {
      let thisClient;

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
            'unknownComponent',
            'brokeredMethod1'
          );
        })
        .then(function () {
          return new Promise((resolve) => {
            setTimeout(resolve, 2000);
          });
        })
        .then(function () {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          thisClient = client;
          //call to unknown method
          return thisClient.exchange.$call({
            component: 'unknownComponent',
            method: 'brokeredMethod1',
          });
        })
        .catch((e) => {
          //expect a failure - wrong version
          test
            .expect(e.message)
            .to.be(
              'invalid endpoint options: [unknownComponent] component does not exist on the api'
            );
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
  async function startClusterInternalFirst() {
    servers.push((localInstance = await startInternal(0, 1)));
    servers.push(await startEdge(1, 2));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
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
