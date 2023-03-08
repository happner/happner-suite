const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);
  let localInstance, client;
  test.clients = [];
  //in case needed in future
  //test.printOpenHandlesAfter(5e3);

  context('exchange', function () {
    it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker', async function () {
      await clusterStarter.startClusterInternalFirst(true);
      localInstance = test.servers[0];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
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
      await test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
      result = await client.exchange.remoteComponent1.brokeredMethod1();
      test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod1');
      result = await client.exchange.remoteComponent.brokeredMethod1();
      test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
    });

    it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker, check we cannot access denied methods', async function () {
      let gotToFinalAttempt = false;
      try {
        await clusterStarter.startClusterInternalFirst(true);
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
        await testRestCall(
          client.data.session.token,
          test.proxyPorts[1],
          'remoteComponent1',
          'brokeredMethod1',
          null,
          'MESH_0:remoteComponent1:brokeredMethod1:true'
        );
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
      await clusterStarter.startClusterEdgeFirst(true);
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

    it('starts up the edge cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument', async function () {
      await clusterStarter.startClusterEdgeFirst(true);
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

    async function setupPermissionsCorrectOrigin() {
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod3'
      );
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod4');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod4'
      );
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod5');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod5'
      );
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod6');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod6'
      );
    }

    it('starts up the edge cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument, with the correct origin normal client callback', async () => {
      await clusterStarter.startClusterEdgeFirst(true);
      localInstance = test.servers[1];
      await setupPermissionsCorrectOrigin();
      await test.delay(2e3);

      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );

      const result1 = await client.exchange.remoteComponent1.brokeredMethod3('test');
      const result2 = await client.exchange.remoteComponent1.brokeredMethod3();
      test.expect(result1).to.be('MESH_1:remoteComponent1:brokeredMethod3:test:username');
      test.expect(result2).to.be('MESH_1:remoteComponent1:brokeredMethod3:null:username');
      const result3 = await client.exchange.remoteComponent1.brokeredMethod4(1, 2);
      const result4 = await client.exchange.remoteComponent1.brokeredMethod4(2);
      const result5 = await client.exchange.remoteComponent1.brokeredMethod4(undefined, 2);
      const result6 = await client.exchange.remoteComponent1.brokeredMethod4();
      test.expect(result3).to.be('MESH_1:remoteComponent1:brokeredMethod4:username:3');
      test.expect(result4).to.be('MESH_1:remoteComponent1:brokeredMethod4:username:2');
      test.expect(result5).to.be('MESH_1:remoteComponent1:brokeredMethod4:username:2');
      test.expect(result6).to.be('MESH_1:remoteComponent1:brokeredMethod4:username:0');

      await client.disconnect();
    });

    it('starts up the edge cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument, with the correct origin normal client async', async () => {
      await clusterStarter.startClusterEdgeFirst(true);
      localInstance = test.servers[1];
      await setupPermissionsCorrectOrigin();
      await test.delay(2000);

      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );

      const result1 = await client.exchange.remoteComponent1.brokeredMethod5('test');
      const result2 = await client.exchange.remoteComponent1.brokeredMethod5();
      test.expect(result1).to.be('MESH_1:remoteComponent1:brokeredMethod5:test:username');
      test.expect(result2).to.be('MESH_1:remoteComponent1:brokeredMethod5:undefined:username');
      const result3 = await client.exchange.remoteComponent1.brokeredMethod6(1, 2);
      const result4 = await client.exchange.remoteComponent1.brokeredMethod6(2);
      const result5 = await client.exchange.remoteComponent1.brokeredMethod6(undefined, 2);
      const result6 = await client.exchange.remoteComponent1.brokeredMethod6();
      test.expect(result3).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:3');
      test.expect(result4).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:2');
      test.expect(result5).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:2');
      test.expect(result6).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:0');

      await client.disconnect();
    });

    it('starts up the edge cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument, with the correct origin light client', async () => {
      await clusterStarter.startClusterEdgeFirst(true);
      localInstance = test.servers[1];
      await setupPermissionsCorrectOrigin();
      await test.delay(2000);

      test.clients.push(
        (client = await test.lightClient.create(
          'DOMAIN_NAME',
          'username',
          'password',
          test.proxyPorts[0]
        ))
      );
      const result1 = await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod5',
        arguments: ['test'],
      });
      const result2 = await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod5',
        arguments: [],
      });
      const result3 = await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod6',
        arguments: [1, 2],
      });
      const result4 = await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod6',
        arguments: [2],
      });
      const result5 = await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod6',
        arguments: [undefined, 2],
      });
      const result6 = await client.exchange.$call({
        component: 'remoteComponent1',
        method: 'brokeredMethod6',
        arguments: [],
      });

      test.expect(result1).to.be('MESH_1:remoteComponent1:brokeredMethod5:test:username');

      test.expect(result2).to.be('MESH_1:remoteComponent1:brokeredMethod5:undefined:username');

      test.expect(result3).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:3');
      test.expect(result4).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:2');
      test.expect(result5).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:2');
      test.expect(result6).to.be('MESH_1:remoteComponent1:brokeredMethod6:username:0');

      await client.disconnect();
    });

    it('starts up the internal cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument, with the correct origin', async function () {
      await clusterStarter.startClusterInternalFirst(true);
      localInstance = test.servers[0];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod3'
      );

      await test.delay(3e3);
      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      let result = await client.exchange.remoteComponent1.brokeredMethod3('test');
      test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod3:test:username');
    });

    it('starts up the internal cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method, we then shutdown the brokered instance, run the same method and get the correct error', async function () {
      try {
        await clusterStarter.startClusterInternalFirst(true);
        localInstance = test.servers[0];
        await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent',
          'brokeredMethod3'
        );
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent1',
          'brokeredMethod3'
        );
        await test.delay(3e3);
        test.clients.push(
          (client = await test.client.create('username', 'password', test.proxyPorts[1]))
        );
        let result = await client.exchange.remoteComponent1.brokeredMethod3('test');
        test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod3:test:username');
        await localInstance.stop();
        test.servers.splice(0, 1);
        await test.delay(3e3);
        await client.exchange.remoteComponent1.brokeredMethod3('test');
        throw new Error('TEST FAILURE');
      } catch (e) {
        test.expect(e.message).to.be('Not implemented remoteComponent1:^2.0.0:brokeredMethod3');
      }
    });

    it('starts up the internal cluster node first, we then start 2 the internal nodes in a high availability configuration, pause and then assert we are able to run a brokered methods and they are load balanced, we then shutdown a brokered instance, and are able to run the same method on the remaining instance', async function () {
      let results = [];

      await clusterStarter.startClusterEdgeFirstHighAvailable(true);
      localInstance = test.servers[1];
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod3'
      );
      await test.delay(3e3);

      test.clients.push(
        (client = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      results.push(await client.exchange.remoteComponent1.brokeredMethod3('test'));
      results.push(await client.exchange.remoteComponent1.brokeredMethod3('test'));
      results.push(await client.exchange.remoteComponent1.brokeredMethod3('test'));
      results.push(await client.exchange.remoteComponent1.brokeredMethod3('test'));
      await localInstance.stop();
      test.servers.splice(1, 1);
      await test.delay(3e3);

      results.push(await client.exchange.remoteComponent1.brokeredMethod3('test'));
      results.push(await client.exchange.remoteComponent1.brokeredMethod3('test'));
      results.push(await client.exchange.remoteComponent1.brokeredMethod3('test'));

      test.expect(results).to.eql([
        //round robin happening
        'MESH_1:remoteComponent1:brokeredMethod3:test:username',
        'MESH_2:remoteComponent1:brokeredMethod3:test:username',
        'MESH_1:remoteComponent1:brokeredMethod3:test:username',
        'MESH_2:remoteComponent1:brokeredMethod3:test:username',
        //now only mesh 3 is up, so it handles all method calls
        'MESH_2:remoteComponent1:brokeredMethod3:test:username',
        'MESH_2:remoteComponent1:brokeredMethod3:test:username',
        'MESH_2:remoteComponent1:brokeredMethod3:test:username',
      ]);
    });

    it('injects the correcst amount of brokered elements, even when brokered cluster nodes are dropped and restarted', async function () {
      this.timeout(60000);
      await clusterStarter.startClusterEdgeFirstHighAvailable(true);
      localInstance = test.servers[1];
      await test.delay(5000);
      test.expect(getInjectedElements('MESH_0').length).to.be(4);
      test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
      test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
      test.expect(getInjectedElements('MESH_0')[2].meshName != null).to.be(true);
      test.expect(getInjectedElements('MESH_0')[3].meshName != null).to.be(true);
      await stopServer(test.servers[1], 1);
      await test.delay(3e3);
      //we check injected components is 1
      test.expect(getInjectedElements('MESH_0').length).to.be(2);
      test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
      test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
      await stopServer(test.servers[1], 1);
      await test.delay(3e3);
      //we check injected components is still 1 and injected component meshName is null
      test.expect(getInjectedElements('MESH_0').length).to.be(2);
      test.expect(getInjectedElements('MESH_0')[0].meshName == null).to.be(true);
      test.expect(getInjectedElements('MESH_0')[1].meshName == null).to.be(true);
      await clusterStarter.startInternal(3, 2);
      await test.delay(3e3);

      //we check injected components is still 1 and injected component meshName is null
      test.expect(getInjectedElements('MESH_0').length).to.be(2);
      test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
      test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
      await clusterStarter.startInternal(4, 3);

      await test.delay(3e3);

      //we check injected components is 2
      //we check injected components is still 1 and injected component meshName is null
      test.expect(getInjectedElements('MESH_0').length).to.be(4);
      test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
      test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
    });
  });

  context('events', function () {
    it('connects a client to the local instance, and is able to access the remote component events via the broker', async function () {
      await clusterStarter.startClusterInternalFirst(true);
      localInstance = test.servers[0];
      await test.delay(3e3);
      await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent',
        'brokeredEventEmitMethod'
      );
      await test.users.allowEvent(localInstance, 'username', 'remoteComponent', '/brokered/event');
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
  context('happner-client', function () {
    it('does a comprehensive test using the happner-client', async function () {
      await clusterStarter.startClusterEdgeFirst(true);
      localInstance = test.servers[1];
      await test.delay(3e3);
      await test.users.allowMethod(
        localInstance,
        'username',
        'remoteComponent1',
        'brokeredMethod1'
      );
      await test.users.allowWebMethod(localInstance, 'username', '/remoteComponent1/testJSON');
      await test.users.allowEvent(localInstance, 'username', 'remoteComponent1', 'test/*');
      client = await connectHappnerClient('username', 'password', test.proxyPorts[0]);
      await testHappnerClient(client);
      await client.disconnect();
    });
  });
  context('errors', function () {
    it('ensures an error is handled and returned accordingly if we execute an internal components failing method using a callback', function (done) {
      let proxyPorts;
      clusterStarter
        .startClusterInternalFirst(true)
        .then((ports) => {
          proxyPorts = ports;
          return test.users.allowMethod(
            test.servers[1],
            'username',
            'remoteComponent',
            'brokeredMethodFail'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return test.client.create('username', 'password', proxyPorts[1]);
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
        await clusterStarter.startClusterInternalFirst(true);
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
        test.clients.push(await client.exchange.remoteComponent.brokeredMethodFail());
        throw new Error('TEST FAILURE');
      } catch (e) {
        test.expect(e.toString()).to.be('Error: test error');
      }
    });

    it('ensures an error is handled and returned accordingly if we execute an internal components method that times out', async function () {
      this.timeout(20000);
      try {
        await clusterStarter.startClusterInternalFirst(true);
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

        //first test our broker components methods are directly callable
        await client.exchange.remoteComponent.brokeredMethodTimeout();
        throw new Error('TEST FAILURE');
      } catch (e) {
        test.expect(e.message).to.be('Request timed out');
      }
    });

    it('ensures an error is handled and returned accordingly if we execute a method that does not exist on the cluster mesh yet', async function () {
      this.timeout(20000);
      try {
        await clusterStarter.startClusterEdgeFirst(true, 0);
        localInstance = test.servers[1];
        await test.users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        await test.users.allowMethod(
          localInstance,
          'username',
          'remoteComponent1',
          'brokeredMethod10'
        );
        test.clients.push(
          (client = await test.client.create('username', 'password', test.proxyPorts[0]))
        );
        await client.exchange.remoteComponent1.brokeredMethod10();
        throw new Error('TEST FAILURE');
      } catch (e) {
        test
          .expect(e.toString())
          .to.be('Error: Not implemented remoteComponent1:^2.0.0:brokeredMethod10');
      }
    });
  });

  context('rest', function () {
    it('does a rest call', async function () {
      await clusterStarter.startClusterInternalFirst(true);
      localInstance = test.servers[0];
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

  function doRequest(path, token, port, callback) {
    var request = require('request');
    var options;

    options = {
      url: `http://127.0.0.1:${port}${path}?happn_token=${token}`,
    };

    request(options, function (error, response, body) {
      callback(error, {
        response,
        body,
      });
    });
  }

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
          if (result.error) return reject(new Error(result.error));
          test.expect(result.data).to.eql(expectedResponse);
          resolve();
        });
    });
  }

  function testWebCall(client, path, port) {
    return new Promise((resolve) => {
      doRequest(path, client.token, port, function (e, response) {
        if (e)
          return resolve({
            error: e,
          });
        resolve(response);
      });
    });
  }

  function testHappnerClient(client) {
    return new Promise((resolve, reject) => {
      const api = { data: client.dataClient() };
      getDescription(api)
        .then((schema) => {
          api.happner = client.construct(schema.components);
          api.token = api.data.session.token;
          api.happner.event.remoteComponent1.on('test/*', () => {
            resolve(client);
          });
          return testWebCall(api, '/remoteComponent1/testJSON', test.proxyPorts[0]);
        })
        .then((result) => {
          test.expect(JSON.parse(result.body)).to.eql({
            test: 'data',
          });
          return api.happner.exchange.remoteComponent1.brokeredMethod1();
        })
        .catch(reject);
    });
  }

  function getDescription(api) {
    return new Promise((resolve, reject) => {
      api.data.get('/mesh/schema/description', (e, schema) => {
        if (e) return reject(e);
        return resolve(schema);
      });
    });
  }

  function connectHappnerClient(username, password, port) {
    return new Promise((resolve, reject) => {
      const client = new test.HappnerClient();
      client.connect(
        null,
        {
          username,
          password,
          port,
        },
        (e) => {
          if (e) return reject(e);
          resolve(client);
        }
      );
    });
  }

  function localInstanceConfig(seq, sync, dynamic) {
    var config = baseConfig(seq, sync, true);
    config.authorityDelegationOn = true;
    let brokerComponentPath = dynamic
      ? libDir + 'integration-10-broker-component-dynamic'
      : libDir + 'integration-09-broker-component';
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
        web: {
          routes: {
            testJSON: ['testJSON'],
            testJSONSticky: ['testJSONSticky'],
          },
        },
      },
    };
    return config;
  }

  async function stopServer(server, index) {
    await server.stop({ reconnect: false });
    test.servers.splice(index, 1);
  }

  function getInjectedElements(meshName) {
    const brokerageInstance = require('../../lib/brokerage').instance(meshName);
    if (!brokerageInstance) return null;
    return brokerageInstance.__injectedElements;
  }
});
