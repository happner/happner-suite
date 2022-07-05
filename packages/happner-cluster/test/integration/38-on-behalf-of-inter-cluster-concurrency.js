const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const getSeq = require('../_lib/helpers/getSeq');
const testclient = require('../_lib/client');
const HappnerClient = require('happner-client');
const LightClient = require('happner-client').Light;

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  const restClient = require('restler');
  let adminUser,
    adminUserHappnerClient,
    adminUserHappnerClientAPI,
    adminUserLightClient,
    testUserHappnerClient,
    testUserLightClient,
    testUsers = [],
    testUserNames = [],
    script = [],
    CONCURRENT_REQUESTS_COUNT = 100,
    CONCURRENT_BATCHES_COUNT = 1;

  before('clear mongo', clearMongo);
  before('start cluster', startCluster);
  before('it connects the admin user', connectAdminUsers);
  before('it creates the test users', createTestUsers);
  before('generates call and expectation script', generateScript);

  it('runs $call tests on mesh-client', async () => {
    await callTests(adminUser.exchange);
  });
  it('runs $call tests on happner-client', async () => {
    await callTests(adminUserHappnerClientAPI.exchange);
  });
  it('runs $call tests on light client', async () => {
    await callTests(adminUserLightClient.exchange);
  });

  xit('runs inter-mesh tests on rest client', restClientInterMeshTests);

  async function callTests(exchange) {
    const stats = {
      unauthorized: 0,
      adminSucceeded: 0,
      testUserSucceeded: 0,
    };
    for (let batchId in script.batches) {
      await Promise.all(
        script.batches[batchId].map((scriptItem) => {
          return (
            test
              // delay to interleave _ADMIN users
              .delay(scriptItem.username === '_ADMIN' ? 1e3 : 0)
              .then(() => {
                return exchange.$call({
                  component: 'test',
                  method: 'doOnBehalfOfAllowed',
                  arguments: [1, 2],
                  as: scriptItem.username,
                });
              })
              .then((result) => {
                test.expect(result).to.be(`origin:${scriptItem.username}:1:2`);
                if (scriptItem.username === '_ADMIN') {
                  stats.adminSucceeded++;
                } else {
                  stats.testUserSucceeded++;
                }
                return exchange.$call({
                  component: 'test',
                  method: 'doOnBehalfOfNotAllowed',
                  arguments: [1, 2],
                  as: scriptItem.username,
                });
              })
              .then(() => {
                test.expect(scriptItem.expectation.allowedSucceeded).to.be(true);
              })
              .catch((e) => {
                test
                  .expect(
                    scriptItem.expectation.notAllowedSucceeded === false &&
                      e.message === 'unauthorized'
                  )
                  .to.be(true);
                stats.unauthorized++;
              })
          );
        })
      );
    }
    test.expect(stats).to.eql({
      unauthorized: CONCURRENT_BATCHES_COUNT * (CONCURRENT_REQUESTS_COUNT - 1), // -1 is for the delegate user
      adminSucceeded: CONCURRENT_BATCHES_COUNT * CONCURRENT_REQUESTS_COUNT,
      testUserSucceeded: CONCURRENT_BATCHES_COUNT * CONCURRENT_REQUESTS_COUNT,
    });
  }

  async function restClientInterMeshTests() {}

  var servers, localInstance;

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.boundExchangeCacheSize = 2;
    config.happn.services.security.config.allowAnonymousAccess = true;
    config.modules = {
      local: {
        instance: {
          doOnBehalfOfAllowedAs: async function (param1, param2, $happn) {
            let result1 = await $happn.exchange.$call({
              component: 'test',
              method: 'doOnBehalfOfAllowed',
              arguments: [param1, param2],
              as: 'testUser',
            });
            let result2 = await $happn
              .as('testUser')
              .exchange.test.doOnBehalfOfAllowed(param1, param2);
            test.expect(result1).to.eql(result2);
            return result1;
          },
          doOnBehalfOfNotAllowedAs: async function (param1, param2, $happn) {
            const failures = [];
            try {
              await $happn.exchange.$call({
                component: 'test',
                method: 'doOnBehalfOfNotAllowed',
                arguments: [param1, param2],
                as: 'testUser',
              });
            } catch (e) {
              failures.push(e.message);
            }
            try {
              await $happn.as('testUser').exchange.test.doOnBehalfOfNotAllowed(param1, param2);
            } catch (e) {
              failures.push(e.message);
            }
            return failures;
          },
        },
      },
    };
    config.components = {
      local: {
        dependencies: {
          $broker: {
            test: {
              version: '*',
              methods: {
                doOnBehalfOfAllowed: {},
                doOnBehalfOfNotAllowed: {},
              },
            },
          },
        },
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    let config = baseConfig(seq, undefined, true);
    config.boundExchangeCacheSize = 2;
    config.modules = {
      test: {
        instance: {
          doOnBehalfOfAllowed: async function (param1, param2, $origin) {
            return `origin:${$origin.username}:${param1}:${param2}`;
          },
          doOnBehalfOfNotAllowed: async function (_param1, _param2, $origin) {
            return `unexpected:${$origin.username}`;
          },
        },
      },
    };
    config.components = {
      test: {},
    };
    return config;
  }

  function clearMongo(done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', function (e) {
      done(e);
    });
  }

  function startCluster(done) {
    this.timeout(20000);
    test.HappnerCluster.create(localInstanceConfig(getSeq.getFirst(), 1)).then(function (local) {
      localInstance = local;
    });

    setTimeout(() => {
      Promise.all([
        test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
        test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
        test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
      ])
        .then(function (_servers) {
          servers = _servers;
          //localInstance = servers[0];
          return users.add(servers[0], 'username', 'password');
        })
        .then(function () {
          setTimeout(done, 5e3);
        })
        .catch(done);
    }, 2000);
  }

  after('it disconnects the admin user', disconnectAdminUsers);
  after('it disconnects the test users', disconnectTestUsers);

  after('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers.concat(localInstance), done);
  });

  async function createHappnerClientAndAPI(opts, port) {
    const createdClient = new HappnerClient(opts);
    await createdClient.connect({
      username: opts.username || '_ADMIN',
      password: opts.password || 'happn',
      port,
    });
    var model = {
      test: {
        version: '*',
        methods: {
          doOnBehalfOfAllowed: {},
          doOnBehalfOfNotAllowed: {},
        },
      },
      local: {
        version: '*',
        methods: {
          doOnBehalfOfAllowedAs: {},
          doOnBehalfOfNotAllowedAs: {},
        },
      },
    };
    const createdApi = createdClient.construct(model);
    return [createdClient, createdApi];
  }

  async function createLightClient(opts, port) {
    const createdClient = new LightClient(opts);
    await createdClient.connect({
      username: opts.username || '_ADMIN',
      password: opts.password || 'happn',
      port,
    });
    return createdClient;
  }

  async function connectAdminUsers() {
    adminUser = await new testclient.create('_ADMIN', 'happn', getSeq.getPort(1));
    [adminUserHappnerClient, adminUserHappnerClientAPI] = await createHappnerClientAndAPI(
      {
        discoverMethods: true,
      },
      getSeq.getPort(1)
    );
    adminUserLightClient = await createLightClient({ domain: 'DOMAIN_NAME' }, getSeq.getPort(1));
  }
  async function disconnectAdminUsers() {
    if (adminUser) await adminUser.disconnect();
    if (adminUserHappnerClient) await adminUserHappnerClient.disconnect();
    if (adminUserLightClient) await adminUserLightClient.disconnect();
  }
  async function disconnectTestUsers() {
    if (testUserHappnerClient) await testUserHappnerClient.disconnect();
    if (testUserLightClient) await testUserLightClient.disconnect();
    for (let testuserSession of testUsers) {
      await testuserSession.disconnect();
    }
  }
  async function createTestUsers() {
    for (var i = 0; i < CONCURRENT_REQUESTS_COUNT; i++) {
      await createTestUser(
        i === 0 ? '' : i.toString(),
        i === CONCURRENT_REQUESTS_COUNT - 1 ? true : false
      );
    }
  }
  async function createTestUser(id = '', isDelegate) {
    const testGroupUser = {
      name: `testGroup${id}`,
      permissions: {
        methods: {
          '/test/doOnBehalfOfAllowed': { authorized: true },
          '/test/doOnBehalfOfAllowedAs': { authorized: true },
          '/test/doOnBehalfOfNotAllowedAs': { authorized: true },
        },
      },
    };
    await adminUser.exchange.security.upsertGroup(testGroupUser);
    const upsertedUser = await adminUser.exchange.security.upsertUser({
      username: `testUser${id}`,
      password: 'password',
    });
    await adminUser.exchange.security.linkGroupName('testGroup', upsertedUser);
    if (isDelegate) {
      await adminUser.exchange.security.linkGroupName('_MESH_DELEGATE', upsertedUser);
    }
    testUserNames.push(`testUser${id}`);
  }

  // eslint-disable-next-line no-unused-vars
  async function testHttpRpc(requestInfo, token) {
    return doRequest(
      requestInfo.component,
      requestInfo.method,
      requestInfo.arguments,
      requestInfo.as,
      token
    );
  }
  function generateScript() {
    script = { batches: {} };
    for (let batchId = 0; batchId < CONCURRENT_BATCHES_COUNT; batchId++) {
      script.batches[batchId] = [];
      for (let username of testUserNames) {
        script.batches[batchId].push({
          username,
          expectation: {
            allowedSucceeded: true,
            notAllowedSucceeded: false,
            allowedIntermeshSucceeded: true,
            notAllowedIntermeshSucceeded: false,
          },
        });
        script.batches[batchId].push({
          username: '_ADMIN',
          expectation: {
            allowedSucceeded: true,
            notAllowedSucceeded: true,
            allowedIntermeshSucceeded: true,
            notAllowedIntermeshSucceeded: true,
          },
        });
      }
    }
  }
  function doRequest(componentName, methodName, operationArguments, as, token) {
    var operation = {
      parameters: operationArguments,
      as,
    };
    return new Promise((resolve, reject) => {
      restClient
        .postJson(
          `http://127.0.0.1:${getSeq.getPort(
            1
          )}/rest/method/${componentName}/${methodName}?happn_token=` + token,
          operation
        )
        .on('complete', function (result) {
          if (result.error) {
            return reject(new Error(result.error.message));
          }
          resolve(result.data);
        })
        .on('error', reject);
    });
  }
});
