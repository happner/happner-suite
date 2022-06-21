const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const users = require('../_lib/users');
const client = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let servers = [],
    client1,
    client2,
    proxyPorts;

  before('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', done);
  });

  before('start cluster', async function () {
    servers = await Promise.all([
      test.HappnerCluster.create(serverConfig(0, 1)),
      test.HappnerCluster.create(serverConfig(1, 2)),
    ]);

    //wait for stabilisation
    await test.delay(5000);
    await users.add(servers[0], 'username', 'password');
    proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
  });

  before('start client1', async function () {
    client1 = await client.create('username', 'password', proxyPorts[0]);
  });

  before('start client2', async function () {
    client2 = await client.create('username', 'password', proxyPorts[1]);
  });

  after('stop client 1', function (done) {
    client1.disconnect(done);
  });

  after('stop client 2', function (done) {
    client2.disconnect(done);
  });

  after('stop cluster', async function () {
    if (servers) await stopCluster(servers);
  });

  it('handles security sync for methods', async function () {
    let results = await Promise.all([
      client.callMethod(1, client1, 'component1', 'method1'),
      client.callMethod(2, client1, 'component1', 'method2'),
      client.callMethod(3, client2, 'component1', 'method1'),
      client.callMethod(4, client2, 'component1', 'method2'),
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

    await users.allowMethod(servers[0], 'username', 'component1', 'method1');
    // await sync
    await test.delay(300);

    results = await Promise.all([
      client.callMethod(1, client1, 'component1', 'method1'),
      client.callMethod(2, client1, 'component1', 'method2'),
      client.callMethod(3, client2, 'component1', 'method1'),
      client.callMethod(4, client2, 'component1', 'method2'),
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
      users.denyMethod(servers[0], 'username', 'component1', 'method1'),
      users.allowMethod(servers[0], 'username', 'component1', 'method2'),
    ]);
    // await sync
    await test.delay(300);

    results = await Promise.all([
      client.callMethod(1, client1, 'component1', 'method1'),
      client.callMethod(2, client1, 'component1', 'method2'),
      client.callMethod(3, client2, 'component1', 'method1'),
      client.callMethod(4, client2, 'component1', 'method2'),
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
      client.subscribe(1, client1, 'component1', 'event1', createHandler(1)),
      client.subscribe(2, client1, 'component1', 'event2', createHandler(2)),
      client.subscribe(3, client2, 'component1', 'event1', createHandler(3)),
      client.subscribe(4, client2, 'component1', 'event2', createHandler(4)),
    ]);
    test.expect(results).to.eql([
      { seq: 1, error: 'unauthorized' },
      { seq: 2, error: 'unauthorized' },
      { seq: 3, error: 'unauthorized' },
      { seq: 4, error: 'unauthorized' },
    ]);

    await Promise.all([
      users.allowEvent(servers[0], 'username', 'component1', 'event1'),
      users.allowEvent(servers[0], 'username', 'component1', 'event2'),
    ]);

    // await sync
    await test.delay(300);

    results = await Promise.all([
      client.subscribe(1, client1, 'component1', 'event1', createHandler(1)),
      client.subscribe(2, client1, 'component1', 'event2', createHandler(2)),
      client.subscribe(3, client2, 'component1', 'event1', createHandler(3)),
      client.subscribe(4, client2, 'component1', 'event2', createHandler(4)),
    ]);

    test.expect(results).to.eql([
      { seq: 1, result: true },
      { seq: 2, result: true },
      { seq: 3, result: true },
      { seq: 4, result: true },
    ]);

    await servers[0].exchange.component1.emitEvents();

    // await emit
    await test.delay(200);

    test.expect(events).to.eql({
      1: 'event1',
      2: 'event2',
      3: 'event1',
      4: 'event2',
    });

    await users.denyEvent(servers[0], 'username', 'component1', 'event1');

    // await sync
    await test.delay(300);

    events = {};
    await servers[0].exchange.component1.emitEvents();

    // await emit
    await test.delay(200);

    test.expect(events).to.eql({
      2: 'event2',
      4: 'event2',
    });

    results = await Promise.all([
      client.subscribe(1, client1, 'component1', 'event1', createHandler(1)),
      client.subscribe(2, client1, 'component1', 'event2', createHandler(2)),
      client.subscribe(3, client2, 'component1', 'event1', createHandler(3)),
      client.subscribe(4, client2, 'component1', 'event2', createHandler(4)),
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
      let user = await servers[0].exchange.security.upsertUser({
        username: 'username1',
        password: 'password',
      });
      let group = await servers[0].exchange.security.upsertGroup({
        name: 'group1',
      });
      await servers[0].exchange.security.linkGroup(group, user);

      await servers[0].exchange.security.addGroupPermissions('group1', {
        methods: {
          '/DOMAIN_NAME/component1/method1': { authorized: true },
        },
      });
      await test.delay(2000);
      try {
        await performAction(proxyPorts[0], 'username1', 'component1', 'method1');
      } catch (e) {
        console.log(e);
      }
      await servers[0].exchange.security.unlinkGroup(group, user);
      await test.delay(400);
      try {
        await performAction(proxyPorts[1], 'username1', 'component1', 'method1');
        throw new Error('missing AccessDeniedError');
      } catch (e) {
        test.expect(e.message).to.be('unauthorized');
        test.expect(e.name).to.be('AccessDenied');
      }
    });

    it('handles sync for delete group', async function () {
      let user = await servers[0].exchange.security.upsertUser({
        username: 'username2',
        password: 'password',
      });
      let group = await servers[0].exchange.security.upsertGroup({
        name: 'group2',
      });
      await servers[0].exchange.security.linkGroup(group, user);
      await servers[0].exchange.security.addGroupPermissions('group2', {
        methods: {
          '/DOMAIN_NAME/component1/method1': { authorized: true },
        },
      });
      await test.delay(400);

      await performAction(proxyPorts[1], 'username2', 'component1', 'method1');
      await servers[0].exchange.security.deleteGroup(group);
      await test.delay(400);

      try {
        await performAction(proxyPorts[1], 'username2', 'component1', 'method1');
        throw new Error('missing AccessDeniedError 1');
      } catch (e) {
        test.expect(e.message).to.be('unauthorized');
        test.expect(e.name).to.be('AccessDenied');
      }
    });

    it('handles sync for delete user', async function () {
      let user = await servers[0].exchange.security.upsertUser({
        username: 'username3',
        password: 'password',
      });
      let group = await servers[0].exchange.security.upsertGroup({
        name: 'group3',
      });
      await servers[0].exchange.security.linkGroup(group, user);
      await servers[0].exchange.security.addGroupPermissions('group3', {
        methods: {
          '/DOMAIN_NAME/component1/method1': { authorized: true },
        },
      });
      await test.delay(400);

      await performAction(proxyPorts[1], 'username3', 'component1', 'method1');
      await servers[0].exchange.security.deleteUser(user);
      await test.delay(400);

      try {
        await performAction(proxyPorts[1], 'username3', 'component1', 'method1');
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
