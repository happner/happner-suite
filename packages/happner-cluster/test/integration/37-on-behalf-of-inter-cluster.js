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
    testUserHappnerClientAPI,
    testUserLightClient,
    testUsers = [];

  before('clear mongo', clearMongo);
  before('start cluster', startCluster);
  before('it connects the admin user', connectAdminUsers);
  before('it creates the test users', createTestUsers);

  it('can do an http-rpc with as, delegated via the ADMIN user', async () => {
    const token = adminUser.token;
    test
      .expect(
        await testHttpRpc(
          {
            component: 'test',
            method: 'doOnBehalfOfAllowed',
            arguments: { param1: 1, param2: 2 },
            as: 'testUser',
          },
          token
        )
      )
      .to.eql('origin:testUser:1:2');
  });
  it('can do an http-rpc with as, delegated via a user with delegate priviledges', async () => {
    const testDelegateUser = await connectTestUser(9);
    const token = testDelegateUser.token;
    test
      .expect(
        await testHttpRpc(
          {
            component: 'test',
            method: 'doOnBehalfOfAllowed',
            arguments: { param1: 1, param2: 2 },
            as: 'testUser',
          },
          token
        )
      )
      .to.eql('origin:testUser:1:2');
  });
  it('fails to do an http-rpc with as', async () => {
    const token = adminUser.token;
    let errorMessage;
    try {
      await testHttpRpc(
        {
          component: 'test',
          method: 'doOnBehalfOfNotAllowed',
          arguments: { param1: 1, param2: 2 },
          as: 'testUser',
        },
        token
      );
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.eql('Access denied');
  });

  it('fails to do an http-rpc with as because the origin is not a delegate user', async () => {
    const testUser1 = await connectTestUser(1);
    const token = testUser1.token;
    let errorMessage;
    try {
      await testHttpRpc(
        {
          component: 'test',
          method: 'doOnBehalfOfAllowed',
          arguments: { param1: 1, param2: 2 },
          as: 'testUser',
        },
        token
      );
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.eql('origin does not belong to the delegate group');
  });

  it('can do an exchange call with as in component method', async () => {
    test
      .expect(await adminUser.exchange.local.doOnBehalfOfAllowedAs(1, 2))
      .to.eql('origin:testUser:1:2');
  });

  it('fails to do an exchange call with as in component method', async () => {
    const result = await adminUser.exchange.local.doOnBehalfOfNotAllowedAs(1, 2);
    test.expect(result).to.eql(['unauthorized', 'unauthorized']);
  });

  it('can do an exchange $call with as', async () => {
    test
      .expect(
        await adminUser.exchange.$call({
          component: 'test',
          method: 'doOnBehalfOfAllowed',
          arguments: [1, 2],
          as: 'testUser',
        })
      )
      .to.eql('origin:testUser:1:2');
  });

  it('fails to do an exchange call with as', async () => {
    let errorMessage;
    try {
      await adminUser.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfNotAllowed',
        arguments: [1, 2],
        as: 'testUser',
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  it('can do an exchange $call with as, light-client', async () => {
    test
      .expect(
        await adminUserLightClient.exchange.$call({
          component: 'test',
          method: 'doOnBehalfOfAllowed',
          arguments: [1, 2],
          as: 'testUser',
        })
      )
      .to.eql('origin:testUser:1:2');
  });

  it('fails to do an exchange call with as, light-client', async () => {
    let errorMessage;
    try {
      await adminUserLightClient.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfNotAllowed',
        arguments: [1, 2],
        as: 'testUser',
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  it('fails to try an exchange call with as _ADMIN, light-client', async () => {
    let errorMessage;
    testUserLightClient = await createLightClient(
      { username: 'testUser', password: 'password', domain: 'DOMAIN_NAME' },
      getSeq.getPort(1)
    );
    try {
      await testUserLightClient.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfNotAllowed',
        arguments: [1, 2],
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
    try {
      await testUserLightClient.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfNotAllowed',
        arguments: [1, 2],
        as: '_ADMIN',
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  it('can do an exchange $call with as, happner-client', async () => {
    test
      .expect(
        await adminUserHappnerClientAPI.exchange.$call({
          component: 'test',
          method: 'doOnBehalfOfAllowed',
          arguments: [1, 2],
          as: 'testUser',
        })
      )
      .to.eql('origin:testUser:1:2');
  });

  it('fails to do an exchange call with as, happner-client', async () => {
    let errorMessage;
    try {
      await adminUserHappnerClientAPI.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfNotAllowed',
        arguments: [1, 2],
        as: 'testUser',
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  it('fails to do an exchange call with as, happner-client, unknown user', async () => {
    let errorMessage;
    try {
      await adminUserHappnerClientAPI.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfAllowed',
        arguments: [1, 2],
        as: 'unknown',
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  it('fails to do an exchange call with as, happner-client, anonymous user', async () => {
    let errorMessage;
    try {
      await adminUserHappnerClientAPI.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfAllowed',
        arguments: [1, 2],
        as: '_ANONYMOUS',
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  it('fails to try an exchange call with as _ADMIN, happner-client', async () => {
    let errorMessage;
    [testUserHappnerClient, testUserHappnerClientAPI] = await createHappnerClientAndAPI(
      { username: 'testUser', password: 'password' },
      getSeq.getPort(1)
    );
    try {
      await testUserHappnerClientAPI.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfNotAllowed',
        arguments: [1, 2],
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
    try {
      await testUserHappnerClientAPI.exchange.$call({
        component: 'test',
        method: 'doOnBehalfOfNotAllowed',
        arguments: [1, 2],
        as: '_ADMIN',
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('unauthorized');
  });

  var servers, localInstance;

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
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
    var config = baseConfig(seq, undefined, true);
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
  async function connectTestUser(id = '') {
    const testUser = await new testclient.create(`testUser${id}`, 'password', getSeq.getPort(1));
    testUsers.push(testUser);
    return testUser;
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
    for (var i = 0; i < 10; i++) {
      await createTestUser(i === 0 ? '' : i.toString(), i === 9 ? true : false);
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
  }
  async function testHttpRpc(requestInfo, token) {
    return doRequest(
      requestInfo.component,
      requestInfo.method,
      requestInfo.arguments,
      requestInfo.as,
      token
    );
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
