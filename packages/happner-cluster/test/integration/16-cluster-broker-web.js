const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let deploymentId = test.newid();
  let internalInstance;
  let thisClient, adminClient;
  test.hooks.clusterStartedSeperatelyHooks(test);
  let clusterStarter = test.clusterStarter.create(test, remoteInstanceConfig, localInstanceConfig);

  context('web', function () {
    it('starts the cluster broker, we ensure direct calls to the brokered component succeed', async function () {
      await clusterStarter.startClusterEdgeFirst();
      internalInstance = test.servers[1];
      await test.delay(3e3);
      await test.users.allowWebMethod(internalInstance, 'username', '/remoteComponent1/testJSON');
      test.clients.push(
        (adminClient = await test.client.create('_ADMIN', 'happn', test.proxyPorts[1]))
      );
      let result = await testWebCall(adminClient, '/remoteComponent1/testJSON', test.proxyPorts[1]);
      test.expect(JSON.parse(result.body)).to.eql({
        test: 'data',
      });
      test.clients.push(
        (thisClient = await test.client.create('username', 'password', test.proxyPorts[1]))
      );

      //first test our broker components methods are directly callable
      result = await testWebCall(thisClient, '/remoteComponent1/testJSON', test.proxyPorts[1]);

      test.expect(JSON.parse(result.body)).to.eql({
        test: 'data',
      });
    });

    it('starts the cluster broker, we ensure indirect calls to the brokered component succeed', async function () {
      await clusterStarter.startClusterEdgeFirst();
      internalInstance = test.servers[1];
      await test.users.allowWebMethod(internalInstance, 'username', '/remoteComponent1/testJSON');
      test.clients.push(
        (adminClient = await test.client.create('_ADMIN', 'happn', test.proxyPorts[0]))
      );
      let result = await testWebCall(adminClient, '/remoteComponent1/testJSON', test.proxyPorts[0]);
      test.expect(JSON.parse(result.body)).to.eql({
        test: 'data',
      });

      test.clients.push(
        (thisClient = await test.client.create('username', 'password', test.proxyPorts[0]))
      );
      //first test our broker components methods are directly callable
      result = await testWebCall(thisClient, '/remoteComponent1/testJSON', test.proxyPorts[0]);
      test.expect(JSON.parse(result.body)).to.eql({
        test: 'data',
      });
    });

    async function getClientForMesh(meshId, username, password, edgePort) {
      let client = null;
      while (client == null) {
        let checkClient = await test.client.create(username, password, edgePort);
        let response = await testWebCall(
          checkClient,
          '/remoteComponent1/testJSONSticky',
          test.proxyPorts[0]
        );
        if (response.body.toString().indexOf(`MESH_${meshId}`) > -1) client = checkClient;
        else await checkClient.disconnect();
      }
      return client;
    }

    xit('starts the cluster broker, with 2 brokered internal nodes in a high availability configuration, we ensure indirect calls to the brokered component succeed and are sticky sessioned, then we stop one internal node and we ensure we are still able to access the web content on the remaining node', async function () {
      let thisClientMesh2;
      let thisClientMesh3;

      let results = [];

      let pushResults = (responseBody) => {
        let result = {
          statusCode: responseBody.response.statusCode,
          statusMessage: responseBody.response.statusMessage,
          body: responseBody.body,
        };
        results.push(result);
      };

      await clusterStarter.startClusterEdgeFirstHighAvailable();
      internalInstance = test.servers[1];
      await test.users.allowWebMethod(
        internalInstance,
        'username',
        '/remoteComponent1/testJSONSticky'
      );

      test.clients.push(
        (thisClientMesh2 = await getClientForMesh(1, 'username', 'password', test.proxyPorts[0]))
      );
      test.clients.push(
        (thisClientMesh3 = await getClientForMesh(2, 'username', 'password', test.proxyPorts[0]))
      );
      let response = await testWebCall(
        thisClientMesh2,
        '/remoteComponent1/testJSONSticky',
        test.proxyPorts[0]
      );
      pushResults(response);
      response = await testWebCall(
        thisClientMesh3,
        '/remoteComponent1/testJSONSticky',
        test.proxyPorts[0]
      );
      pushResults(response);
      await internalInstance.stop();
      test.servers.splice(1, 1);

      await test.delay(3e3);
      response = await testWebCall(
        thisClientMesh2,
        '/remoteComponent1/testJSONSticky',
        test.proxyPorts[0]
      );
      pushResults(response);
      response = await testWebCall(
        thisClientMesh3,
        '/remoteComponent1/testJSONSticky',
        test.proxyPorts[0]
      );
      pushResults(response);

      test.expect(results).to.eql(
        // ran on different nodes
        [
          {
            statusCode: 200,
            statusMessage: 'OK',
            body: `{"ran_on":"MESH_1"}`,
          },
          {
            statusCode: 200,
            statusMessage: 'OK',
            body: `{"ran_on":"MESH_2"}`,
          },
          // failover to MESH_2, because MESH_1 went offline
          {
            statusCode: 200,
            statusMessage: 'OK',
            body: `{"ran_on":"MESH_2"}`,
          },
          {
            statusCode: 200,
            statusMessage: 'OK',
            body: `{"ran_on":"MESH_2"}`,
          },
        ]
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 20, // 50 per second
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 20, // 50 per second
      },
    };
    return config;
  }
});
