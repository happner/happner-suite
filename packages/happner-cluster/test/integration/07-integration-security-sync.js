const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 20e3 }, function (test) {
  let config = {
    cluster: {
      functions: [serverConfig, serverConfig],
    },
    clients: [0, 1],
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, config, timing, true);

  it('handles security sync for methods', async function () {
    let results = await Promise.all([
      test.client.callMethod(1, test.clients[0], 'component1', 'method1'),
      test.client.callMethod(2, test.clients[0], 'component1', 'method2'),
      test.client.callMethod(3, test.clients[1], 'component1', 'method1'),
      test.client.callMethod(4, test.clients[1], 'component1', 'method2'),
    ]);
    test.expect(results).to.eql([
      {
        seq: 1,
        user: 'username',
        component: 'component1',
        method: 'method1',
        error: 'unauthorized',
      },
      {
        seq: 2,
        user: 'username',
        component: 'component1',
        method: 'method2',
        error: 'unauthorized',
      },
      {
        seq: 3,
        user: 'username',
        component: 'component1',
        method: 'method1',
        error: 'unauthorized',
      },
      {
        seq: 4,
        user: 'username',
        component: 'component1',
        method: 'method2',
        error: 'unauthorized',
      },
    ]);

    await test.users.allowMethod(test.servers[0], 'username', 'component1', 'method1');
    // await sync
    await test.delay(300);

    results = await Promise.all([
      test.client.callMethod(1, test.clients[0], 'component1', 'method1'),
      test.client.callMethod(2, test.clients[0], 'component1', 'method2'),
      test.client.callMethod(3, test.clients[1], 'component1', 'method1'),
      test.client.callMethod(4, test.clients[1], 'component1', 'method2'),
    ]);

    test.expect(results).to.eql([
      {
        seq: 1,
        user: 'username',
        component: 'component1',
        method: 'method1',
        result: true,
      },
      {
        seq: 2,
        user: 'username',
        component: 'component1',
        method: 'method2',
        error: 'unauthorized',
      },
      {
        seq: 3,
        user: 'username',
        component: 'component1',
        method: 'method1',
        result: true,
      },
      {
        seq: 4,
        user: 'username',
        component: 'component1',
        method: 'method2',
        error: 'unauthorized',
      },
    ]);

    await Promise.all([
      test.users.denyMethod(test.servers[0], 'username', 'component1', 'method1'),
      test.users.allowMethod(test.servers[0], 'username', 'component1', 'method2'),
    ]);
    // await sync
    await test.delay(300);

    results = await Promise.all([
      test.client.callMethod(1, test.clients[0], 'component1', 'method1'),
      test.client.callMethod(2, test.clients[0], 'component1', 'method2'),
      test.client.callMethod(3, test.clients[1], 'component1', 'method1'),
      test.client.callMethod(4, test.clients[1], 'component1', 'method2'),
    ]);

    test.expect(results).to.eql([
      {
        seq: 1,
        user: 'username',
        component: 'component1',
        method: 'method1',
        error: 'unauthorized',
      },
      {
        seq: 2,
        user: 'username',
        component: 'component1',
        method: 'method2',
        result: true,
      },
      {
        seq: 3,
        user: 'username',
        component: 'component1',
        method: 'method1',
        error: 'unauthorized',
      },
      {
        seq: 4,
        user: 'username',
        component: 'component1',
        method: 'method2',
        result: true,
      },
    ]);
  });

  it('handles security sync for events', async function () {
    let events = {};

    function createHandler(seq) {
      return function (data) {
        events[seq] = data.value;
      };
    }

    let results = await Promise.all([
      test.client.subscribe(1, test.clients[0], 'component1', 'event1', createHandler(1)),
      test.client.subscribe(2, test.clients[0], 'component1', 'event2', createHandler(2)),
      test.client.subscribe(3, test.clients[1], 'component1', 'event1', createHandler(3)),
      test.client.subscribe(4, test.clients[1], 'component1', 'event2', createHandler(4)),
    ]);
    test.expect(results).to.eql([
      { seq: 1, error: 'unauthorized' },
      { seq: 2, error: 'unauthorized' },
      { seq: 3, error: 'unauthorized' },
      { seq: 4, error: 'unauthorized' },
    ]);

    await Promise.all([
      test.users.allowEvent(test.servers[0], 'username', 'component1', 'event1'),
      test.users.allowEvent(test.servers[0], 'username', 'component1', 'event2'),
    ]);

    // await sync
    await test.delay(300);

    results = await Promise.all([
      test.client.subscribe(1, test.clients[0], 'component1', 'event1', createHandler(1)),
      test.client.subscribe(2, test.clients[0], 'component1', 'event2', createHandler(2)),
      test.client.subscribe(3, test.clients[1], 'component1', 'event1', createHandler(3)),
      test.client.subscribe(4, test.clients[1], 'component1', 'event2', createHandler(4)),
    ]);

    test.expect(results).to.eql([
      { seq: 1, result: true },
      { seq: 2, result: true },
      { seq: 3, result: true },
      { seq: 4, result: true },
    ]);

    await test.servers[0].exchange.component1.emitEvents();

    // await emit
    await test.delay(200);

    test.expect(events).to.eql({
      1: 'event1',
      2: 'event2',
      3: 'event1',
      4: 'event2',
    });

    await test.users.denyEvent(test.servers[0], 'username', 'component1', 'event1');

    // await sync
    await test.delay(300);

    events = {};
    await test.servers[0].exchange.component1.emitEvents();

    // await emit
    await test.delay(200);

    test.expect(events).to.eql({
      2: 'event2',
      4: 'event2',
    });

    results = await Promise.all([
      test.client.subscribe(1, test.clients[0], 'component1', 'event1', createHandler(1)),
      test.client.subscribe(2, test.clients[0], 'component1', 'event2', createHandler(2)),
      test.client.subscribe(3, test.clients[1], 'component1', 'event1', createHandler(3)),
      test.client.subscribe(4, test.clients[1], 'component1', 'event2', createHandler(4)),
    ]);

    test.expect(results).to.eql([
      { seq: 1, error: 'unauthorized' },
      { seq: 2, result: true },
      { seq: 3, error: 'unauthorized' },
      { seq: 4, result: true },
    ]);
  });

  context('full spectrum security operations', function () {
    async function performAction(port, username, component, method) {
      let client;
      try {
        client = new test.Happner.MeshClient({
          hostname: '127.0.0.1',
          port: port,
        });
        await client.login({
          username: username,
          password: 'password',
        });
        await client.exchange[component][method]();
        client.disconnect();
      } catch (e) {
        if (client) client.disconnect();
        throw e;
      }
    }

    it('handles sync for add user and group and link and add permission and unlink group', async function () {
      let user = await test.servers[0].exchange.security.upsertUser({
        username: 'username1',
        password: 'password',
      });
      let group = await test.servers[0].exchange.security.upsertGroup({
        name: 'group1',
      });
      await test.servers[0].exchange.security.linkGroup(group, user);

      await test.servers[0].exchange.security.addGroupPermissions('group1', {
        methods: {
          '/DOMAIN_NAME/component1/method1': { authorized: true },
        },
      });
      await test.delay(2000);

      await performAction(test.proxyPorts[0], 'username1', 'component1', 'method1');
      await test.servers[0].exchange.security.unlinkGroup(group, user);
      await test.delay(400);
      try {
        await performAction(test.proxyPorts[1], 'username1', 'component1', 'method1');
        throw new Error('missing AccessDeniedError');
      } catch (e) {
        test.expect(e.message).to.be('unauthorized');
        test.expect(e.name).to.be('AccessDenied');
      }
    });

    it('handles sync for delete group', async function () {
      let user = await test.servers[0].exchange.security.upsertUser({
        username: 'username2',
        password: 'password',
      });
      let group = await test.servers[0].exchange.security.upsertGroup({
        name: 'group2',
      });
      await test.servers[0].exchange.security.linkGroup(group, user);
      await test.servers[0].exchange.security.addGroupPermissions('group2', {
        methods: {
          '/DOMAIN_NAME/component1/method1': { authorized: true },
        },
      });
      await test.delay(400);

      await performAction(test.proxyPorts[1], 'username2', 'component1', 'method1');
      await test.servers[0].exchange.security.deleteGroup(group);
      await test.delay(400);

      try {
        await performAction(test.proxyPorts[1], 'username2', 'component1', 'method1');
        throw new Error('missing AccessDeniedError 1');
      } catch (e) {
        test.expect(e.message).to.be('unauthorized');
        test.expect(e.name).to.be('AccessDenied');
      }
    });

    it('handles sync for delete user', async function () {
      let user = await test.servers[0].exchange.security.upsertUser({
        username: 'username3',
        password: 'password',
      });
      let group = await test.servers[0].exchange.security.upsertGroup({
        name: 'group3',
      });
      await test.servers[0].exchange.security.linkGroup(group, user);
      await test.servers[0].exchange.security.addGroupPermissions('group3', {
        methods: {
          '/DOMAIN_NAME/component1/method1': { authorized: true },
        },
      });
      await test.delay(400);

      await performAction(test.proxyPorts[1], 'username3', 'component1', 'method1');
      await test.servers[0].exchange.security.deleteUser(user);
      await test.delay(400);

      try {
        await performAction(test.proxyPorts[1], 'username3', 'component1', 'method1');
        throw new Error('missing AccessDeniedError');
      } catch (e) {
        test.expect(e.message).to.be('Invalid credentials');
        test.expect(e.name).to.be('AccessDenied');
      }
    });
  });

  function serverConfig(seq, minPeers) {
    let config = baseConfig(seq, minPeers, true);
    config.modules = {
      component1: {
        path: libDir + 'integration-07-component',
      },
    };
    config.components = {
      component1: {},
    };
    config.happn.services.replicator = {
      config: {
        securityChangesetReplicateInterval: 10, // 100 per second
      },
    };
    return config;
  }
});
