var path = require('path');
var filename = path.basename(__filename);
var Happn = require('happn-3');

var hooks = require('../lib/hooks');
const NodeUtils = require('util');
var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 3;
var happnSecure = true;
let testConfigs = [
  {
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
    services: {
      orchestrator: {
        replicate: ['/*/*/this', '/and/that'], // <---------------
      },
    },
  },
  {
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
    services: {
      orchestrator: {
        replicate: ['/*/*/this', '/and/that'], // <---------------
      },
    },
    clusterConfig: {
      'cluster-service-1': 1,
      'cluster-service-2': 2,
    }, //Multiple services
  },
];
testConfigs.forEach((testConfig) => {
  require('../lib/test-helper').describe({ timeout: 60e3 }, function (test) {
    before(function () {
      this.logLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'off';
    });

    hooks.startCluster(testConfig);

    before('connect a client to each server', async function () {
      let clients = await Promise.all(
        this.servers.map((server) => {
          let config = server.config;
          var loginConfig = {
            config: {
              secure: happnSecure,
              host: config.services.proxy.config.host,
              port: config.services.proxy.config.port,
              protocol: 'http',
              username: config.services.security.config.adminUser.username,
              password: config.services.security.config.adminUser.password,
            },
          };

          return Happn.client.create(loginConfig);
        })
      );
      clients.forEach(function (client) {
        client.onAsync = NodeUtils.promisify(client.on);
      });
      this.clients = clients;
    });

    after('disconnect all clients', function (done) {
      if (!this.clients) return done();

      var async = require('async');

      async.eachSeries(
        this.clients,
        function (client, clientCB) {
          return client.disconnect(clientCB);
        },
        done
      );
    });

    it('replicates specified paths', async function () {
      var unpause1, unpause2;
      var controlEvent1,
        replicatedEvents1 = [];
      var controlEvent2,
        replicatedEvents2 = [];

      await Promise.all(
        this.clients.map((client, i) => {
          return client.onAsync('/something/like/this', function (data, meta) {
            delete meta.sessionId; // not the same across events
            if (i === 0) {
              controlEvent1 = {
                data: data,
                meta: meta,
              };
            } else {
              replicatedEvents1.push({
                data: data,
                meta: meta,
              });
            }
            if (controlEvent1 && replicatedEvents1.length === clusterSize - 1) {
              setTimeout(function () {
                unpause1();
              }, 100);
            }
          });
        })
      );

      await Promise.all(
        this.clients.map((client, i) => {
          return client.onAsync('/*/that', function (data, meta) {
            delete meta.sessionId; // not the same across events
            if (i === 0) {
              controlEvent2 = {
                data: data,
                meta: meta,
              };
            } else {
              replicatedEvents2.push({
                data: data,
                meta: meta,
              });
            }
            if (controlEvent2 && replicatedEvents2.length === clusterSize - 1) {
              setTimeout(function () {
                unpause2();
              }, 200);
            }
          });
        })
      );

      await this.clients[0].set('/something/like/this', { some1: 'data1' });

      await new Promise(function (resolve) {
        unpause1 = resolve;
      });

      await this.clients[0].set('/and/that', { some2: 'data2' });

      await new Promise(function (resolve) {
        unpause2 = resolve;
      });
      test.expect(replicatedEvents1.length).to.be(2);
      test.expect(replicatedEvents2.length).to.be(2);

      for (let event of replicatedEvents1) {
        test.expect(event).to.eql(controlEvent1);
      }
      for (let event of replicatedEvents2) {
        test.expect(event).to.eql(controlEvent2);
      }
    });

    it('does not replicate unspecified paths', async function () {
      var receivedCount = 0;

      await Promise.all(
        this.clients.map((client) => {
          return client.onAsync('/unreplicated/path', () => {
            receivedCount++;
          });
        })
      );

      await this.clients[0].set('/unreplicated/path', { some: 'data' });
      await test.delay(500);

      // only client logged into original emitting host receives event
      test.expect(receivedCount).to.eql(1);
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
