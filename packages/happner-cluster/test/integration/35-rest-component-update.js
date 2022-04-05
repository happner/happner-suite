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

  context('rest', function () {
    it('does a rest call', async function () {
      await startClusterInternalFirst();
      await users.allowMethod(localInstance, 'username', 'remoteComponent', 'webMethod1');
      await users.allowMethod(localInstance, 'username', 'remoteComponent2', 'webMethod2');

      let thisClient = await testclient.create('username', 'password', getSeq.getPort(2));
      await testRestCall(
        thisClient.data.session.token,
        getSeq.getPort(2),
        'remoteComponent',
        'webMethod1',
        null,
        getSeq.getMeshName(1) + ':remoteComponent:webMethod1:true'
      );
      try {
        await testRestCall(
          thisClient.data.session.token,
          getSeq.getPort(2),
          'remoteComponent2',
          'webMethod2',
          null,
          getSeq.getMeshName(1) + ':remoteComponent:webMethod1:true'
        );
        throw new Error("SHOUlDN'T BE AVAILABLE");
      } catch (e) {
        test
          .expect(e.message)
          .to.eql('method webMethod2 does not exist on component remoteComponent2'); //Brokered component placeholder is there
      }
      await startInternal2(getSeq.getNext(), 2);
      await test.delay(8000);

      await testRestCall(
        thisClient.data.session.token,
        getSeq.getPort(2),
        'remoteComponent2',
        'webMethod2',
        null,
        getSeq.getMeshName(3) + ':remoteComponent2:webMethod2:true'
      );
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
          .postJson(
            `http://localhost:${port}/rest/method/${component}/${method}`,
            operation,
            options
          )
          .on('complete', function (result) {
            if (result.error) return reject(result.error);
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

    function localInstanceConfig(seq, sync) {
      var config = baseConfig(seq, sync, true);
      config.authorityDelegationOn = true;
      let brokerComponentPath = libDir + 'integration-35-broker-component';

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
          path: libDir + 'integration-35-remote-component',
        },
        //   remoteComponent1: {
        //     path: libDir + 'integration-09-remote-component-1',
        //   },
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
        remoteComponent2: {
          path: libDir + 'integration-35-remote-component2',
        },
        //   remoteComponent1: {
        //     path: libDir + 'integration-09-remote-component-1',
        //   },
      };
      config.components = {
        remoteComponent2: {
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

    function startClusterInternalFirst(dynamic) {
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

    function startClusterEdgeFirst(dynamic) {
      return new Promise(function (resolve, reject) {
        startEdge(getSeq.getFirst(), 1, dynamic)
          .then(function () {
            return startInternal(getSeq.getNext(), 2);
          })
          .then(function (server) {
            localInstance = server;
            return users.add(localInstance, 'username', 'password');
          })
          .then(resolve)
          .catch(reject);
      });
    }
  });
});
