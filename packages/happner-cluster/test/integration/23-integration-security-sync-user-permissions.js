const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/user-permissions');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let deploymentId = test.newid();
  let hooksConfig = {
    cluster: {
      functions: [serverConfig, serverConfig],
    },
    clients: [0, 1],
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, hooksConfig, timing, true);

  it('handles security sync for methods', async () => {
    let client1 = test.clients[0];
    let client2 = test.clients[1];
    test
      .expect(
        await Promise.all([
          test.client.callMethod(1, client1, 'component1', 'method1'),
          test.client.callMethod(2, client1, 'component1', 'method2'),
          test.client.callMethod(3, client2, 'component1', 'method1'),
          test.client.callMethod(4, client2, 'component1', 'method2'),
        ])
      )
      .to.eql([
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

    await users.allowMethod(test.servers[0], 'username', 'component1', 'method1');
    await test.delay(2000);

    test
      .expect(
        await Promise.all([
          test.client.callMethod(1, client1, 'component1', 'method1'),
          test.client.callMethod(2, client1, 'component1', 'method2'),
          test.client.callMethod(3, client2, 'component1', 'method1'),
          test.client.callMethod(4, client2, 'component1', 'method2'),
        ])
      )
      .to.eql([
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
      users.denyMethod(test.servers[0], 'username', 'component1', 'method1'),
      users.allowMethod(test.servers[0], 'username', 'component1', 'method2'),
    ]);

    await test.delay(2000);

    test
      .expect(
        await Promise.all([
          test.client.callMethod(1, client1, 'component1', 'method1'),
          test.client.callMethod(2, client1, 'component1', 'method2'),
          test.client.callMethod(3, client2, 'component1', 'method1'),
          test.client.callMethod(4, client2, 'component1', 'method2'),
        ])
      )
      .to.eql([
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

  it('handles security sync for events', async () => {
    let client1 = test.clients[0];
    let client2 = test.clients[1];
    let events = {};
    test
      .expect(
        await Promise.all([
          test.client.subscribe(1, client1, 'component1', 'event1', createHandler(1)),
          test.client.subscribe(2, client1, 'component1', 'event2', createHandler(2)),
          test.client.subscribe(3, client2, 'component1', 'event1', createHandler(3)),
          test.client.subscribe(4, client2, 'component1', 'event2', createHandler(4)),
        ])
      )
      .to.eql([
        { seq: 1, error: 'unauthorized' },
        { seq: 2, error: 'unauthorized' },
        { seq: 3, error: 'unauthorized' },
        { seq: 4, error: 'unauthorized' },
      ]);

    await Promise.all([
      users.allowEvent(test.servers[0], 'username', 'component1', 'event1'),
      users.allowEvent(test.servers[0], 'username', 'component1', 'event2'),
    ]);

    await test.delay(1000);

    test
      .expect(
        await Promise.all([
          test.client.subscribe(1, client1, 'component1', 'event1', createHandler(1)),
          test.client.subscribe(2, client1, 'component1', 'event2', createHandler(2)),
          test.client.subscribe(3, client2, 'component1', 'event1', createHandler(3)),
          test.client.subscribe(4, client2, 'component1', 'event2', createHandler(4)),
        ])
      )
      .to.eql([
        { seq: 1, result: true },
        { seq: 2, result: true },
        { seq: 3, result: true },
        { seq: 4, result: true },
      ]);

    await test.servers[0].exchange.component1.emitEvents();

    await test.delay(500);

    test.expect(popEvents()).to.eql({
      1: 'event1',
      2: 'event2',
      3: 'event1',
      4: 'event2',
    });

    await users.denyEvent(test.servers[0], 'username', 'component1', 'event1');
    await test.delay(1000);

    await test.servers[0].exchange.component1.emitEvents();

    await test.delay(500);

    test.expect(popEvents()).to.eql({
      // 1: 'event1',
      2: 'event2',
      // 3: 'event1',
      4: 'event2',
    });

    test
      .expect(
        await Promise.all([
          test.client.subscribe(1, client1, 'component1', 'event1', createHandler(1)),
          test.client.subscribe(2, client1, 'component1', 'event2', createHandler(2)),
          test.client.subscribe(3, client2, 'component1', 'event1', createHandler(3)),
          test.client.subscribe(4, client2, 'component1', 'event2', createHandler(4)),
        ])
      )
      .to.eql([
        { seq: 1, error: 'unauthorized' },
        { seq: 2, result: true },
        { seq: 3, error: 'unauthorized' },
        { seq: 4, result: true },
      ]);

    function popEvents() {
      let cloned = JSON.parse(JSON.stringify(events));
      events = {};
      return cloned;
    }

    function createHandler(seq) {
      return function (data) {
        events[seq] = data.value;
      };
    }
  });

  function serverConfig(seq, minPeers) {
    var config = baseConfig(seq, minPeers, true);
    config.modules = {
      component1: {
        path: libDir + 'integration-07-component',
      },
    };
    config.components = {
      component1: {},
    };
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 20, // 50 per second
      },
    };
    return config;
  }
});
