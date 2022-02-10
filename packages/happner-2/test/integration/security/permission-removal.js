require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const path = require('path');
  let server, client;
  let libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'security'].join(path.sep);
  let userSeq = 1;

  before('start a mesh with test component, and a client', function (done) {
    test.Mesh.create({
      name: 'permissions_removal',
      happn: {
        allowNestedPermissions: true,
        secure: true,
        adminPassword: 'TEST',
      },
      modules: {
        module: {
          path: libFolder + path.sep + 'component-permission-removal',
        },
      },
      components: {
        component1: {
          moduleName: 'module',
          startMethod: 'initialize',
        },
      },
    })
      .then(function (_server) {
        server = _server;
      })
      .then(done)
      .catch(done);
  });

  async function startClient(userDetails) {
    let client = new test.Mesh.MeshClient({ secure: true });
    await client.login(userDetails);
    return client;
  }

  afterEach('stop client', function (done) {
    if (!client) return done();
    client.disconnect(done);
  });

  afterEach('stop server', function (done) {
    if (!server) return done();
    server.stop({ reconnect: false }, done);
  });

  async function initializeSecutiy(groups, userPermissions = {}) {
    let testUser = {
      username: 'TEST' + userSeq.toString(),
      password: 'TEST PWD',
      permissions: userPermissions,
    };
    let addedTestuser = await server.exchange.security.addUser(testUser);
    for (let group of groups) {
      let addedGroup = await server.exchange.security.addGroup(group);
      await server.exchange.security.linkGroup(addedGroup, addedTestuser);
    }
    userSeq++;
    return testUser;
  }

  async function getTestClient(groups, userPermissions) {
    let user = await initializeSecutiy(groups, userSeq, userPermissions);
    let testClient = await startClient(user);
    return [testClient, user];
  }

  it('tests that we can remove permissions from a group, but we will still have permissions on that path if another group has permission', async () => {
    let testGroup = {
      name: 'REMOVE_PERMS_G1',
      permissions: {
        methods: {},
        events: {
          'permissions_removal/component1/event-1a': {
            authorized: true,
          },
        },
      },
    };

    let testGroup2 = {
      name: 'REMOVE_PERMS_G2',
      permissions: {
        methods: {},
        events: {
          'permissions_removal/component1/event-1a': {
            authorized: true,
          },
        },
      },
    };

    [client] = await getTestClient([testGroup, testGroup2]);
    const events = [];
    const events2 = [];
    await client.event.component1.on('event-1a', (msg) => {
      events.push(msg.data);
    });
    await server.exchange.permissions_removal.component1.causeEmit('event-1a', { data: 'test1' });
    await server.exchange.security.removeGroupPermissions(testGroup2.name, {
      events: {
        'permissions_removal/component1/event-1a': {
          authorized: true,
        },
      },
    });
    await client.event.component1.on('event-1a', (msg) => {
      events2.push(msg.data);
    });
    await server.exchange.permissions_removal.component1.causeEmit('event-1a', { data: 'test2' });

    test.expect(events).to.eql(['test1', 'test2']);
    test.expect(events2).to.eql(['test2']);

    await server.exchange.security.removeGroupPermissions(testGroup.name, {
      events: {
        'permissions_removal/component1/event-1a': {
          authorized: true,
        },
      },
    });
    await test.delay(1000);
    let errored = false;
    try {
      await client.event.component1.on('event-1a', (msg) => {
        events2.push(msg.data);
      });
    } catch (e) {
      errored = true;
    }
    test.expect(errored).to.be(true);
  });
});
