const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const testlightclient = require('../_lib/client-light');

const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  const servers = [];
  let localInstance, proxyPorts;
  beforeEach('stopCluster', (done) => {
    if (servers.length) {
      stopCluster(servers, function (e) {
        servers.splice(0, servers.length);
        proxyPorts = [];
        if (e) return done(e);
        done();
      });
    } else {
      done();
    }
  });

  beforeEach('clear mongo collection', function (done) {
    this.timeout(20000);
    try {
      clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', done);
    } catch (e) {
      done(e);
    }
  });

  after('stop cluster', async function () {
    await stopCluster(servers);
  });

  //in case needed in future
  //test.printOpenHandlesAfter(5e3);E

  context('exchange', function () {
    it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker', function (done) {
      var thisClient;

      startClusterInternalFirst(false)
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
        })
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod1'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          thisClient = client;
          //first test our broker components methods are directly callable
          return thisClient.exchange.brokerComponent.directMethod();
        })
        .then(function (result) {
          test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
          return thisClient.exchange.remoteComponent1.brokeredMethod1();
        })
        .then(function (result) {
          test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod1');
          return thisClient.exchange.remoteComponent.brokeredMethod1();
        })
        .then(function (result) {
          test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
          setTimeout(done, 2000);
        })
        .catch((e) => {
          done(e);
        });
    });

    it('starts the cluster internal first, connects a client to the local instance, and is able to access the remote component via the broker, check we cannot access denied methods', function (done) {
      var thisClient;

      var gotToFinalAttempt = false;

      startClusterInternalFirst()
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
        })
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod1'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          thisClient = client;
          //first test our broker components methods are directly callable
          return thisClient.exchange.brokerComponent.directMethod();
        })
        .then(function (result) {
          test.expect(result).to.be('MESH_1:brokerComponent:directMethod');
          //call an injected method
          return thisClient.exchange.remoteComponent.brokeredMethod1();
        })
        .then(function (result) {
          test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
          return thisClient.exchange.remoteComponent1.brokeredMethod1();
        })
        .then(function (result) {
          test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod1');
          return testRestCall(
            thisClient.data.session.token,
            proxyPorts[1],
            'remoteComponent1',
            'brokeredMethod1',
            null,
            'MESH_0:remoteComponent1:brokeredMethod1:true'
          );
        })
        .then(() => {
          return users.denyMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          gotToFinalAttempt = true;
          return thisClient.exchange.remoteComponent.brokeredMethod1();
        })
        .catch(function (e) {
          test.expect(gotToFinalAttempt).to.be(true);
          test.expect(e.toString()).to.be('AccessDenied: unauthorized');
          setTimeout(done, 2000);
        });
    });

    it('starts up the edge cluster node first, we than start the internal node (with brokered component), pause and then assert we are able to run the brokered method', function (done) {
      startClusterEdgeFirst()
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[0]);
        })
        .then(function (client) {
          //first test our broker components methods are directly callable
          client.exchange.brokerComponent.directMethod(function (e, result) {
            test.expect(e).to.be(null);
            test.expect(result).to.be('MESH_0:brokerComponent:directMethod');
            //call an injected method
            client.exchange.remoteComponent.brokeredMethod1(function (e, result) {
              test.expect(e).to.be(null);
              test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod1');
              setTimeout(done, 2000);
            });
          });
        })
        .catch(done);
    });

    it('starts up the edge cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument', function (done) {
      startClusterEdgeFirst()
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[0]);
        })
        .then(function (client) {
          client.exchange.remoteComponent.brokeredMethod3('test', function (e, result) {
            test.expect(e).to.be(null);
            test.expect(result).to.be('MESH_1:remoteComponent:brokeredMethod3:test');
            setTimeout(done, 2000);
          });
        })
        .catch(done);
    });

    async function setupPermissionsCorrectOrigin() {
      await users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
      await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
      await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'brokeredMethod3');
      await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod4');
      await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'brokeredMethod4');
      await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod5');
      await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'brokeredMethod5');
      await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod6');
      await users.allowMethod(localInstance, 'username', 'remoteComponent1', 'brokeredMethod6');
    }

    it('starts up the edge cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument, with the correct origin normal client callback', async () => {
      await startClusterEdgeFirst();
      await setupPermissionsCorrectOrigin();
      await test.delay(2e3);

      const client = await testclient.create('username', 'password', proxyPorts[0]);
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
      await startClusterEdgeFirst();
      await setupPermissionsCorrectOrigin();
      await test.delay(2000);

      const client = await testclient.create('username', 'password', proxyPorts[0]);
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
      await startClusterEdgeFirst();
      await setupPermissionsCorrectOrigin();
      await test.delay(2000);

      let client = await testlightclient.create(
        'DOMAIN_NAME',
        'username',
        'password',
        proxyPorts[0]
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

    it('starts up the internal cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method with an argument, with the correct origin', function (done) {
      startClusterInternalFirst()
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
        })
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod3'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[0]);
        })
        .then(function (client) {
          client.exchange.remoteComponent1.brokeredMethod3('test', function (e, result) {
            test.expect(e).to.be(null);
            test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod3:test:username');
            done();
          });
        })
        .catch(done);
    });

    it('starts up the internal cluster node first, we then start the internal node (with brokered component), pause and then assert we are able to run a brokered method, we then shutdown the brokered instance, run the same method and get the correct error', function (done) {
      let testClient;

      startClusterInternalFirst()
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
        })
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod3'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          testClient = client;
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          test.expect(result).to.be('MESH_0:remoteComponent1:brokeredMethod3:test:username');
          return new Promise((resolve, reject) => {
            localInstance.stop((e) => {
              if (e) return reject(e);
              servers.splice(0, 1);
              resolve();
            });
          });
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .catch(function (e) {
          test.expect(e.message).to.be('Not implemented remoteComponent1:^2.0.0:brokeredMethod3');
          done();
        });
    });

    it('starts up the internal cluster node first, we then start 2 the internal nodes in a high availability configuration, pause and then assert we are able to run a brokered methods and they are load balanced, we then shutdown a brokered instance, and are able to run the same method on the remaining instance', function (done) {
      let testClient,
        results = [];

      startClusterEdgeFirstHighAvailable()
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod3');
        })
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod3'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[0]);
        })
        .then(function (client) {
          testClient = client;
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          results.push(result);
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          results.push(result);
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          results.push(result);
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(() => {
          return new Promise((resolve, reject) => {
            localInstance.stop((e) => {
              if (e) return reject(e);
              servers.splice(1, 1);
              resolve();
            });
          });
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          results.push(result);
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          results.push(result);
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          results.push(result);
          return testClient.exchange.remoteComponent1.brokeredMethod3('test');
        })
        .then(function (result) {
          results.push(result);
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
          done();
        })
        .catch(done);
    });

    it('injects the correct amount of brokered elements, even when brokered cluster nodes are dropped and restarted', function (done) {
      this.timeout(60000);

      startClusterEdgeFirstHighAvailable()
        .then(() => {
          return test.delay(5000);
        })
        .then(() => {
          test.expect(getInjectedElements('MESH_0').length).to.be(4);
          test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
          test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
          test.expect(getInjectedElements('MESH_0')[2].meshName != null).to.be(true);
          test.expect(getInjectedElements('MESH_0')[3].meshName != null).to.be(true);
          return stopServer(1);
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          //we check injected components is 1
          test.expect(getInjectedElements('MESH_0').length).to.be(2);
          test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
          test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
          return stopServer(1);
        })
        .then(() => {
          return test.delay(6e3);
        })
        .then(() => {
          //we check injected components is still 1 and injected component meshName is null
          test.expect(getInjectedElements('MESH_0').length).to.be(2);
          test.expect(getInjectedElements('MESH_0')[0].meshName == null).to.be(true);
          test.expect(getInjectedElements('MESH_0')[1].meshName == null).to.be(true);
          return startInternal(3, 2);
        })
        .then((server) => {
          servers.push(server);
          return test.delay(5e3);
        })
        .then(() => {
          //we check injected components is still 1 and injected component meshName is null
          test.expect(getInjectedElements('MESH_0').length).to.be(2);
          test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
          test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
          return startInternal(4, 3);
        })
        .then((server) => {
          servers.push(server);
          return test.delay(3e3);
        })
        .then(() => {
          //we check injected components is 2
          //we check injected components is still 1 and injected component meshName is null
          test.expect(getInjectedElements('MESH_0').length).to.be(4);
          test.expect(getInjectedElements('MESH_0')[0].meshName != null).to.be(true);
          test.expect(getInjectedElements('MESH_0')[1].meshName != null).to.be(true);
          done();
        })
        .catch(done);
    });
  });

  context('events', function () {
    it('connects a client to the local instance, and is able to access the remote component events via the broker', function (done) {
      startClusterInternalFirst()
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        })
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent',
            'brokeredEventEmitMethod'
          );
        })
        .then(() => {
          return users.allowEvent(localInstance, 'username', 'remoteComponent', '/brokered/event');
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          //first test our broker components methods are directly callable
          client.exchange.brokerComponent.directMethod(function (e, result) {
            test.expect(e).to.be(null);
            test.expect(result).to.be('MESH_1:brokerComponent:directMethod');

            client.event.remoteComponent.on(
              '/brokered/event',
              function (data) {
                test.expect(data).to.eql({
                  brokered: { event: { data: { from: 'MESH_0' } } },
                });
                setTimeout(done, 2000);
              },
              function (e) {
                test.expect(e).to.be(null);
                client.exchange.remoteComponent.brokeredEventEmitMethod(function (e, result) {
                  test.expect(e).to.be(null);
                  test.expect(result).to.be('MESH_0:remoteComponent:brokeredEventEmitMethod');
                });
              }
            );
          });
        })
        .catch(done);
    });
  });
  context('happner-client', function () {
    it('does a comprehensive test using the happner-client', function (done) {
      startClusterEdgeFirst()
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod1'
          );
        })
        .then(() => {
          return users.allowWebMethod(localInstance, 'username', '/remoteComponent1/testJSON');
        })
        .then(() => {
          return users.allowEvent(localInstance, 'username', 'remoteComponent1', 'test/*');
        })
        .then(() => {
          return connectHappnerClient('username', 'password', proxyPorts[0]);
        })
        .then(function (client) {
          return testHappnerClient(client);
        })
        .then(function (client) {
          client.disconnect(done);
        })
        .catch(done);
    });
  });
  context('errors', function () {
    it('ensures an error is raised if we are injecting internal components with duplicate names', function (done) {
      test.HappnerCluster.create(errorInstanceConfigDuplicateBrokered(0, 1))
        .then(() => {
          done(new Error('unexpected success'));
        })
        .catch(function (e) {
          test
            .expect(e.toString())
            .to.be(
              'Error: Duplicate attempts to broker the remoteComponent component by brokerComponent & brokerComponentDuplicate'
            );
          setTimeout(done, 2000);
        });
    });

    it('ensures an error is handled and returned accordingly if we execute an internal components failing method using a callback', function (done) {
      startClusterInternalFirst()
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent',
            'brokeredMethodFail'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
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
        await startClusterInternalFirst();
        await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethodFail');
        await test.delay(3e3);
        let client = await testclient.create('username', 'password', proxyPorts[1]);
        await client.exchange.remoteComponent.brokeredMethodFail();
        throw new Error('TEST FAILURE');
      } catch (e) {
        test.expect(e.toString()).to.be('Error: test error');
      }
    });

    it('ensures an error is handled and returned accordingly if we execute an internal components method that times out', function (done) {
      this.timeout(20000);

      startClusterInternalFirst()
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent',
            'brokeredMethodTimeout'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          //first test our broker components methods are directly callable
          return client.exchange.remoteComponent.brokeredMethodTimeout();
        })
        .catch(function (e) {
          test.expect(e.message).to.be('Request timed out');
          done();
        });
    });

    it('ensures an error is handled and returned accordingly if we execute a method that does not exist on the cluster mesh yet', async function () {
      this.timeout(20000);
      try {
        await startClusterEdgeFirst();
        await users.allowMethod(localInstance, 'username', 'brokerComponent', 'directMethod');
        await users.allowMethod(localInstance, 'username', 'remoteComponent', 'brokeredMethod1');
        let client = await testclient.create('username', 'password', proxyPorts[0]);
        await client.exchange.remoteComponent.brokeredMethod1();
        throw new Error('TEST FAILURE');
      } catch (e) {
        test
          .expect(e.toString())
          .to.be('Error: Not implemented remoteComponent:^2.0.0:brokeredMethod1');
      }
    });
  });

  context('rest', function () {
    it('does a rest call', function (done) {
      var thisClient;
      startClusterInternalFirst()
        .then(() => {
          return users.allowMethod(
            localInstance,
            'username',
            'remoteComponent1',
            'brokeredMethod1'
          );
        })
        .then(() => {
          return test.delay(3e3);
        })
        .then(() => {
          return testclient.create('username', 'password', proxyPorts[1]);
        })
        .then(function (client) {
          thisClient = client;
          return testRestCall(
            thisClient.data.session.token,
            proxyPorts[1],
            'remoteComponent1',
            'brokeredMethod1',
            null,
            'MESH_0:remoteComponent1:brokeredMethod1:true'
          );
        })
        .then(done);
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
          return testWebCall(api, '/remoteComponent1/testJSON', proxyPorts[0]);
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

  function stopServer(index) {
    return servers[index].stop({ reconnect: false }).then(() => {
      // stopping all at once causes replicator client happn logouts to timeout
      // because happn logout attempts unsubscribe on server, and all servers
      // are gone
      servers.splice(index, 1);
      return test.delay(200); // ...so pause between stops (long for travis)
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

  function errorInstanceConfigDuplicateBrokered(seq, sync) {
    var config = baseConfig(seq, sync, true);
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

  async function startInternal(id, clusterMin) {
    return test.HappnerCluster.create(remoteInstanceConfig(id, clusterMin));
  }

  async function startEdge(id, clusterMin, dynamic) {
    return test.HappnerCluster.create(localInstanceConfig(id, clusterMin, dynamic));
  }

  async function startClusterEdgeFirstHighAvailable(dynamic) {
    servers.push(await startEdge(0, 1, dynamic));
    servers.push((localInstance = await startInternal(1, 2, dynamic)));
    servers.push(await startInternal(2, 3, dynamic));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  async function startClusterInternalFirst(dynamic) {
    servers.push((localInstance = await startInternal(0, 1, dynamic)));
    servers.push(await startEdge(1, 2, dynamic));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  async function startClusterEdgeFirst(dynamic) {
    servers.push(await startEdge(0, 1, dynamic));
    servers.push((localInstance = await startInternal(1, 2, dynamic)));
    await users.add(localInstance, 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  function getInjectedElements(meshName) {
    const brokerageInstance = require('../../lib/brokerage').instance(meshName);
    if (!brokerageInstance) return null;
    return brokerageInstance.__injectedElements;
  }
});
