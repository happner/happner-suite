const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

let deploymentId;
require('../_lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  deploymentId = test.newid();
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);
  let localInstance, client;

  context('rest', () => {
    it('does a rest call', async () => {
      await clusterStarter.startClusterInternalFirst();
      await test.users.allowMethod(
        test.servers[0],
        'username',
        'remoteComponent1',
        'brokeredMethod1'
      );
      await test.delay(3e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[1]))
      );
      await testRestCall(
        client.data.session.token,
        test.proxyPorts[1],
        'remoteComponent1',
        'brokeredMethod1',
        null,
        'MESH_0:remoteComponent1:brokeredMethod1:true'
      );
    });
  });

  function testRestCall(token, port, component, method, params, expectedResponse) {
    return new Promise((resolve, reject) => {
      var restClient = require('restler');

      var operation = {
        parameters: params || {},
      };

      var options = { headers: {} };
      options.headers.authorization = 'Bearer ' + token;

      restClient
        .postJson(`http://127.0.0.1:${port}/rest/method/${component}/${method}`, operation, options)
        .on('complete', function (result) {
          if (result.error) return reject(new Error(result.error.message));
          test.expect(result.data).to.eql(expectedResponse);
          resolve();
        });
    });
  }

  context('exchange', function () {
    it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker', async function () {
      await clusterStarter.startClusterInternalFirst();
      localInstance = test.servers[0];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod1'
      );
      await test.delay(2e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[1]))
      );

      //first test our broker components methods are directly callable
      let result = await client.exchange.brokerComponent.directMethod();
      test.expect(result).to.be('MESH_1:brokerComponent:directMethod');

      //call an injected method
      result = await client.exchange.remoteComponent.brokeredMethod1();
      test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
      result = await client.exchange.remoteComponent1.brokeredMethod1();
      test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod1');
    });

    it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker, check we cannot access denied methods', async function () {
      let gotToFinalAttempt = false;
      try {
        await clusterStarter.startClusterInternalFirst();
        localInstance = test.servers[0];
        await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent',
          'brokeredMethod1'
        );
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent1',
          'brokeredMethod1'
        );
        await test.delay(3e3);
        test.clients.push(
          (client = await test.client.create('username', 'password', test.proxyPorts[1]))
        );

        let result = await client.exchange.brokerComponent.directMethod();

        test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
        //call an injected method
        result = await client.exchange.remoteComponent.brokeredMethod1();
        test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
        result = await client.exchange.remoteComponent1.brokeredMethod1();
        test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod1');
        await test.users.denyMethod(
          localInstance,
          'username',
          'remoteComponent',
          'brokeredMethod1'
        );
        gotToFinalAttempt = true;
        result = await client.exchange.remoteComponent.brokeredMethod1();
        throw new Error('TEST FAILURE');
      } catch (e) {
        test.expect(gotToFinalAttempt).to.be(true);
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
      }
    });

    it('starts up the edge cluster node first, we than start the internal node (with brokered component), pause and then assert we are able to run the brokered method', async function () {
      await clusterStarter.startClusterEdgeFirst();
      localInstance = test.servers[1];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
      await test.delay(2e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      let result = await client.exchange.brokerComponent.directMethod();
      test.expect(result).to.be('MESH_0:brokerComponent:directMethod');
      //call an injected method
      result = await client.exchange.remoteComponent.brokeredMethod1();
      test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod1');
    });

    it('starts up the edge cluster node first, we than start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument', async function () {
      await clusterStarter.startClusterEdgeFirst();
      localInstance = test.servers[1];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
      await test.delay(3e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      let result = await client.exchange.remoteComponent.brokeredMethod3('test');
      test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod3:test');
    });
  });

  context('events', function () {
    it('connects a client to the local instance, and is able to access the remote component events via the broker', async function () {
      await clusterStarter.startClusterInternalFirst();
      localInstance = test.servers[0];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent',
        'brokeredEventEmitMethod'
      );
      await test.users.allowEvent(localInstance, 'username', 'remoteComponent', '/brokered/event');
      await test.delay(3e3);
      let client;
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[1]))
      );

      //first test our broker components methods are directly callable
      let result = await client.exchange.brokerComponent.directMethod();
      test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
      let done,
        finished = new Promise((res) => (done = res));
      await client.event.remoteComponent.on('/brokered/event', function (data) {
        test.expect(data).to.eql({
          brokered: { event: { data: { from: 'MESH_0' } } },
        });
        done();
      });
      result = await client.exchange.remoteComponent.brokeredEventEmitMethod();
      test.expect(result).to.be('MESH_0:remoteComponent:brokeredEventEmitMethod');
      return finished;
    });
  });

  context('data', function () {
    it('connects a client to the local instance, and is able to access the remote component events via the broker', async function () {
      let edgeClient, internalClient;
      await clusterStarter.startClusterInternalFirst(['/test/**']);
      test.clients.push(
        (edgeClient = await test.client.create('_ADMIN', 'happn', test.proxyPorts[1]))
      );
      test.clients.push(
        (internalClient = await test.client.create('_ADMIN', 'happn', test.proxyPorts[0]))
      );
      let gotData;
      let done = new Promise((res) => (gotData = res));
      edgeClient.data.on('/test/**', (data) => {
        test.expect(data.value).to.be(1);
        gotData();
      });
      internalClient.data.set('/test/1/2', 1);
      return done;
    });

    it('connects a client to the local instance, and is able to access the remote component events via the broker, negative test', async function () {
      let edgeClient, internalClient;
      await clusterStarter.startClusterInternalFirst(false);
      test.clients.push(
        (edgeClient = await test.client.create('_ADMIN', 'happn', test.proxyPorts[1]))
      );
      test.clients.push(
        (internalClient = await test.client.create('_ADMIN', 'happn', test.proxyPorts[0]))
      );
      let gotData, noData;
      let done = new Promise((res, rej) => {
        noData = res;
        gotData = rej;
      });
      edgeClient.data.on('/test/**', () => {
        gotData(new Error('not meant to happen'));
      });
      internalClient.data.set('/test/1/2', 1);
      setTimeout(noData, 2000);
      return done;
    });
  });

  context('errors', function () {
    it('ensures an error is raised if we are injecting internal components with duplicate names', async function () {
      try {
        await test.HappnerCluster.create(errorInstanceConfigDuplicateBrokered(0, 1));
        throw new Error('unexpected success');
      } catch (e) {
        test
          .expect(e.toString())
          .to.be(
            'Error: Duplicate attempts to broker the remoteComponent component by brokerComponent & brokerComponentDuplicate'
          );
      }
    });

    it('ensures an error is handled and returned accordingly if we execute an internal components failing method using a callback', function (done) {
      clusterStarter
        .startClusterInternalFirst()
        .then(function () {
          return test.users.allowMethod(
            test.servers[0],
            'username',
            'remoteComponent',
            'brokeredMethodFail'
          );
        })
        .then(function () {
          return test.delay(2e3);
        })
        .then(function () {
          return test.client.create('username', 'password', test.proxyPorts[1]);
        })
        .then(function (client) {
          test.clients.push(client);
          //first test our broker components methods are directly callable
          client.exchange.remoteComponent.brokeredMethodFail(function (e) {
            test.expect(e.toString()).to.be('Error: test error');
            setTimeout(done, 2000);
          });
        })
        .catch(done);
    });

    it('ensures an error is handled and returned accordingly if we execute an internal components failing method using a promise', async function () {
      try {
        await clusterStarter.startClusterInternalFirst();
        localInstance = test.servers[0];
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent',
          'brokeredMethodFail'
        );
        await test.delay(3e3);
        test.clients.push(
          (client = await test.client.create('username', 'password', test.proxyPorts[1]))
        );
        //first test our broker components methods are directly callable
        await client.exchange.remoteComponent.brokeredMethodFail();
        throw new Error('Should not happen');
      } catch (e) {
        test.expect(e.toString()).to.be('Error: test error');
      }
    });

    it('ensures an error is handled and returned accordingly if we execute an internal components method that times out', async function () {
      this.timeout(20000);
      try {
        await clusterStarter.startClusterInternalFirst();
        localInstance = test.servers[0];
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent',
          'brokeredMethodTimeout'
        );
        await test.delay(3e3);
        test.clients.push(
          (client = await test.client.create('username', 'password', test.proxyPorts[1]))
        );

        await client.exchange.remoteComponent.brokeredMethodTimeout();
        throw new Error('Should not happen');
      } catch (e) {
        test.expect(e.message).to.be('Request timed out');
      }
    });

    it('ensures an error is handled and returned accordingly if we execute a method that does not exist on the cluster mesh yet', async function () {
      try {
        await clusterStarter.startClusterEdgeFirst(null, 0);
        localInstance = test.servers[1];
        await test.users.allowMethod(localInstance, 'username', 'brokerComponent1', 'directMethod');
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent',
          'brokeredMethod10'
        );
        test.clients.push(
          (client = await test.client.create('username', 'password', test.proxyPorts[0]))
        );
        await client.exchange.remoteComponent.brokeredMethod10();
        throw new Error('Should not happen');
      } catch (e) {
        test
          .expect(e.toString())
          .to.be('Error: Not implemented remoteComponent:^2.0.0:brokeredMethod10');
      }
    });
  });

  function localInstanceConfig(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.happn.services.membership.config.serviceName = 'remote-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
    config.modules = {
      localComponent: {
        path: libDir + 'integration-09-local-component',
      },
      brokerComponent: {
        path: libDir + 'integration-09-broker-component',
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

  function remoteInstanceConfig(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.happn.services.membership.config.serviceName = 'remote-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
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

  function errorInstanceConfigDuplicateBrokered(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, true, null, null, null, null, replicate);
    config.happn.services.membership.config.deploymentId = deploymentId;
    config.modules = {
      localComponent: {
        path: libDir + 'integration-09-local-component',
      },
      brokerComponent: {
        path: libDir + 'integration-09-broker-component',
      },
      brokerComponentDuplicate: {
        path: libDir + 'integration-09-broker-component-1',
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
      brokerComponentDuplicate: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }
});
