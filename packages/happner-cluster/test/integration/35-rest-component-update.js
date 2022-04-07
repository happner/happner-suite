const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
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
      let axios = test.axios;
      await startClusterInternalFirst();
      let port = getSeq.getPort(2);
      let credentials = {
        username: '_ADMIN',
        password: 'ADMIN_PASSWORD',
      };
      let token = (await axios.post(`http://localhost:${port}/rest/login`, credentials)).data.data
        .token;

      let description = (
        await axios.get(`http://localhost:${port}/rest/describe?happn_token=${token}`)
      ).data.data;
      test.expect(description['/remoteComponent/webMethod1']).to.be.ok();
      test.expect(description['/remoteComponent2/webMethod2']).to.not.be.ok();
      await startInternal2(getSeq.getNext(), 2);
      await test.delay(1000);
      description = (await axios.get(`http://localhost:${port}/rest/describe?happn_token=${token}`))
        .data.data;
      test.expect(description['/remoteComponent/webMethod1']).to.be.ok();
      test.expect(description['/remoteComponent2/webMethod2']).to.be.ok();

      //NB: Not sure if the following should work or not.

      // await servers.pop().stop({ reconnect: false });
      // await test.delay(1000);
      // description = (await axios.get(`http://localhost:${port}/rest/describe?happn_token=${token}`))
      //   .data.data;
      // test.expect(description['/remoteComponent/webMethod1']).to.be.ok();
      // test.expect(description['/remoteComponent2/webMethod2']).to.not.be.ok();
    });

    function localInstanceConfig(seq, sync) {
      var config = baseConfig(seq, sync, true);
      config.happn.adminPassword = 'ADMIN_PASSWORD';
      config.authorityDelegationOn = true;
      // config.secure = false
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
      config.happn.adminPassword = 'ADMIN_PASSWORD';
      config.modules = {
        remoteComponent: {
          path: libDir + 'integration-35-remote-component',
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
      config.happn.adminPassword = 'ADMIN_PASSWORD';
      config.modules = {
        remoteComponent2: {
          path: libDir + 'integration-35-remote-component2',
        },
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
