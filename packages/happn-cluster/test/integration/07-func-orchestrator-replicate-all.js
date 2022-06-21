var path = require('path');
var filename = path.basename(__filename);
var Happn = require('happn-3');
const NodeUtils = require('util');
var hooks = require('../lib/hooks');

var testSequence = parseInt(filename.split('-')[0]) * 2 - 1;
var clusterSize = 3;
var happnSecure = false;

let testConfigs = [
  {
    testSequence: testSequence,
    size: clusterSize,
    happnSceure: happnSecure,
  }, // Single service ('happn-cluster-node')
  {
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
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
        this.servers.map(function (server) {
          var loginConfig = {
            config: {
              host: server.config.services.proxy.config.host,
              port: server.config.services.proxy.config.port,
              protocol: 'http',
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

    after('disconnect all clients', async function () {
      if (!this.clients) return;
      await Promise.all(
        this.clients.map(function (client) {
          return client.disconnect();
        })
      );
    });

    context('on set events', function () {
      it('replicates with wildcards', async function () {
        // first client is the "control", it does the emits so its events appear the
        // way all other client's events should appear: If properly replicated!

        var _this = this;
        var unpause;
        var controlEvent,
          replicatedEvents = [];

        for (let [i, client] of Object.entries(this.clients)) {
          await client.onAsync('/some/*/*/set', (data, meta) => {
            delete meta.sessionId; // not the same across events
            if (parseInt(i) === 0) {
              controlEvent = {
                data: data,
                meta: meta,
              };
            } else {
              replicatedEvents.push({
                data: data,
                meta: meta,
              });
            }
            if (controlEvent && replicatedEvents.length === clusterSize - 1) {
              setTimeout(function () {
                unpause();
              }, 100);
            }
          });
        }

        await _this.clients[0].set('/some/path/to/set', { some: 'data' });
        await new Promise(function (resolve) {
          unpause = resolve;
        });

        for (let event of replicatedEvents) {
          test.expect(event).to.eql(controlEvent);
        }
      });

      it('replicates without wildcards', async function () {
        var unpause;
        var controlEvent,
          replicatedEvents = [];

        for (let [i, client] of Object.entries(this.clients)) {
          await client.onAsync('/some/path/to/set/on', function (data, meta) {
            delete meta.sessionId;
            if (parseInt(i) === 0) {
              controlEvent = {
                data: data,
                meta: meta,
              };
            } else {
              replicatedEvents.push({
                data: data,
                meta: meta,
              });
            }
            if (controlEvent && replicatedEvents.length === clusterSize - 1) {
              setTimeout(function () {
                unpause();
              }, 400);
            }
          });
        }

        await this.clients[0].set('/some/path/to/set/on', { some: 'data' });

        await new Promise(function (resolve) {
          unpause = resolve;
        });

        test.expect(replicatedEvents.length).to.be(2);

        for (let event of replicatedEvents) {
          test.expect(event).to.eql(controlEvent);
        }
      });
    });

    context('on remove events', function () {
      it('replicates', async function () {
        var unpause;
        var controlEvent,
          replicatedEvents = [];
        await this.clients[0].set('/some/path/to/remove/on', {
          some: 'data',
        });

        await Promise.all(
          this.clients.map(function (client, i) {
            return client.onAsync('/some/path/to/remove/*', function (data, meta) {
              delete meta.sessionId;
              if (i === 0) {
                controlEvent = {
                  data: data,
                  meta: meta,
                };
              } else {
                replicatedEvents.push({
                  data: data,
                  meta: meta,
                });
              }
              if (controlEvent && replicatedEvents.length === clusterSize - 1) {
                setTimeout(function () {
                  unpause();
                }, 100);
              }
            });
          })
        );

        await this.clients[0].remove('/some/path/to/remove/on');

        await new Promise(function (resolve) {
          unpause = resolve;
        });
        for (let event of replicatedEvents) {
          test.expect(event).to.eql(controlEvent);
        }
      });
    });

    context('on tag events', function () {
      it('replicates', async function () {
        var unpause;
        var controlEvent,
          replicatedEvents = [];

        await this.clients[0].set('/some/path/to/tag/on', { some: 'data' });

        await Promise.all(
          this.clients.map(function (client, i) {
            return client.onAsync('*', function (data, meta) {
              delete meta.sessionId;
              delete meta.action; // <---------------------------------- can't replicate .action in tag operations

              /*

               should look like this
               ---------------------

               data = { // raw data, including stored meta being "tagged"
               data: { some: 'data' },
               _meta: {
               created: 1476388008625,
               modified: 1476388008625,
               path: '/some/path/to/tag/on',
               _id: '/some/path/to/tag/on'
               }
               }
               meta = {
               path: '/_TAGS/some/path/to/tag/on/62c70bc4927e48ba893daca24e716d02',
               tag: 'TAGNAME',
               type: 'data',
               action: '/SET@/some/path/to/tag/on',
               channel: '/ALL@/*'
               }

               after replication it looks like this
               ------------------------------------

               data = {
               data: { some: 'data' },
               _meta: {
               created: 1476388375945,
               modified: 1476388375945,
               path: '/some/path/to/tag/on',
               _id: '/some/path/to/tag/on'
               }
               }

               meta = {
               path: '/_TAGS/some/path/to/tag/on/62c70bc4927e48ba893daca24e716d02',
               tag: 'TAGNAME',
               action: '/SET@/_TAGS/some/path/to/tag/on/62c70bc4927e48ba893daca24e716d02', <--- different
               channel: '/ALL@/*',
               type: 'data'
               }

               */

              if (i === 0) {
                controlEvent = {
                  data: data,
                  meta: meta,
                };
              } else {
                replicatedEvents.push({
                  data: data,
                  meta: meta,
                });
              }
              if (controlEvent && replicatedEvents.length === clusterSize - 1) {
                setTimeout(function () {
                  unpause();
                }, 100);
              }
            });
          })
        );

        await this.clients[0].set('/some/path/to/tag/on', null, {
          tag: 'TAGNAME',
        });

        await new Promise(function (resolve) {
          unpause = resolve;
        });

        for (let event of replicatedEvents) {
          test.expect(event).to.eql(controlEvent);
        }
      });
    });

    context('on merge events', function () {
      it('replicates', async function () {
        var unpause;
        var controlEvent,
          replicatedEvents = [];

        await this.clients[0].set('/some/path/to/merge/on', {
          some: 'data',
        });
        await Promise.all(
          this.clients.map(function (client, i) {
            return client.onAsync('/some/path/to/merge/on', function (data, meta) {
              delete meta.sessionId;
              if (i === 0) {
                controlEvent = {
                  data: data,
                  meta: meta,
                };
              } else {
                replicatedEvents.push({
                  data: data,
                  meta: meta,
                });
              }
              if (controlEvent && replicatedEvents.length === clusterSize - 1) {
                setTimeout(function () {
                  unpause();
                }, 100);
              }
            });
          })
        );

        await this.clients[0].set('/some/path/to/merge/on', { more: 'data' }, { merge: true });

        await new Promise(function (resolve) {
          unpause = resolve;
        });

        for (let event of replicatedEvents) {
          test.expect(event).to.eql(controlEvent);
        }
      });
    });

    hooks.stopCluster();

    after(function () {
      testSequence++;
      process.env.LOG_LEVEL = this.logLevel;
    });
  });
});
