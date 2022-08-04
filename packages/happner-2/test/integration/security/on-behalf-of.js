require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const restClient = require('restler');
  const HappnerClient = require('happner-client');
  const LightClient = HappnerClient.Light;
  let mesh,
    adminUser,
    testUsers = [];
  before('it sets up the mesh', setUpMesh);
  before('it connects the admin user', connectAdminUser);
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
  it('can do an http-rpc with as, delegated via a delegate user', async () => {
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
  it('can do an as, delegated via a delegate user, light client', async () => {
    const testDelegateUser = await connectTestUserLightClient(9);
    test
      .expect(
        await testDelegateUser.exchange.$call({
          component: 'test',
          method: 'doOnBehalfOfAllowed',
          arguments: [1, 2],
          as: 'testUser',
        })
      )
      .to.eql('origin:testUser:1:2');
    await testDelegateUser.disconnect();
  });
  it('can do an as, delegated via a delegate user, happner client', async () => {
    const testDelegateUser = await connectTestUserHappnerClient(9);
    test
      .expect(
        await testDelegateUser.api.exchange.$call({
          component: 'test',
          method: 'doOnBehalfOfAllowed',
          arguments: [1, 2],
          as: 'testUser',
        })
      )
      .to.eql('origin:testUser:1:2');
    await testDelegateUser.session.disconnect();
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
      .expect(await adminUser.exchange.test.doOnBehalfOfAllowedAs(1, 2))
      .to.eql('origin:testUser:1:2');
  });

  it('fails to do an exchange call with as in component method', async () => {
    const result = await adminUser.exchange.test.doOnBehalfOfNotAllowedAs(1, 2);
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

  after('it disconnects the admin user', disconnectAdminUser);
  after('it disconnects the test users', disconnectTestUsers);
  after('tears down mesh', stopMesh);
  async function setUpMesh() {
    mesh = await test.Mesh.create({
      name: 'asMesh',
      port: 12358,
      secure: true,
      modules: {
        test: {
          instance: {
            doOnBehalfOfAllowed: async function (param1, param2, $origin) {
              return `origin:${$origin.username}:${param1}:${param2}`;
            },
            doOnBehalfOfNotAllowed: async function (_param1, _param2, $origin) {
              return `unexpected:${$origin.username}`;
            },
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
      },
      components: {
        test: {},
      },
    });
  }
  async function stopMesh() {
    if (mesh) await mesh.stop();
  }
  async function connectAdminUser() {
    adminUser = new test.Mesh.MeshClient({ port: 12358, secure: true });
    await adminUser.login({
      username: '_ADMIN',
      password: 'happn',
    });
  }
  async function connectTestUser(id = '') {
    const testUser = new test.Mesh.MeshClient({ port: 12358, secure: true });
    await testUser.login({
      username: `testUser${id}`,
      password: `password`,
    });
    testUsers.push(testUser);
    return testUser;
  }
  async function connectTestUserLightClient(id = '') {
    const mySession = new LightClient({ secure: true, domain: 'asMesh' });
    await mySession.connect({
      port: 12358,
      username: `testUser${id}`,
      password: `password`,
    });
    return mySession;
  }
  async function connectTestUserHappnerClient(id = '') {
    const createdClient = new HappnerClient({ secure: true });
    await createdClient.connect({
      port: 12358,
      username: `testUser${id}`,
      password: 'password',
    });
    return {
      session: createdClient,
      api: createdClient.construct({
        test: {
          version: '*',
          methods: {
            doOnBehalfOfAllowed: {},
          },
        },
      }),
    };
  }
  async function disconnectAdminUser() {
    if (adminUser) await adminUser.disconnect();
  }
  async function disconnectTestUsers() {
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
          '/asMesh/test/doOnBehalfOfAllowed': { authorized: true },
          '/asMesh/test/doOnBehalfOfAllowedAs': { authorized: true },
          '/asMesh/test/doOnBehalfOfNotAllowedAs': { authorized: true },
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
          `http://127.0.0.1:12358/rest/method/${componentName}/${methodName}?happn_token=` + token,
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
