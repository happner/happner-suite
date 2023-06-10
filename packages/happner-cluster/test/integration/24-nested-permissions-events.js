const baseConfig = require('../_lib/base-config');
const users = require('../_lib/user-permissions');

module.exports = SecuredComponent;
function SecuredComponent() {}

SecuredComponent.prototype.method1 = function ($happn, options, callback) {
  options.methodName = 'method1';
  callback(null, options);
};

SecuredComponent.prototype.method2 = function ($happn, options, callback) {
  options.methodName = 'method2';
  callback(null, options);
};

SecuredComponent.prototype.method3 = function ($happn, options, callback) {
  options.methodName = 'method3';
  callback(null, options);
};

SecuredComponent.prototype.fireEvent = function ($happn, eventName, callback) {
  $happn.emit(eventName, eventName);
  callback(null, eventName + ' emitted');
};

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let deploymentId = test.newid();
  let remoteServer;
  let hooksConfig = {
    cluster: {
      functions: [serverConfig, serverConfig],
    },
    clients: [0, 1],
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, hooksConfig, timing, true);

  before('set permissions', async () => {
    remoteServer = test.servers[0];
    for (let user of Object.keys(permissions)) {
      await users.add(test.servers[0], user, 'password', permissions[user]);
    }
  });

  it("we add a test user that has permissions to access some of the ProtectedComponent events, subscribe on a nested-path ('**'), we test that this works", async () => {
    let listenerClient = await test.client.create('test1User', 'password', test.proxyPorts[1]);
    let receivedEvents = [];

    await listenerClient.event.SecuredComponent.on('**', (message) => {
      receivedEvents.push(message.value);
    });

    for (let eventName of ['event-1a', 'event-2a', 'event-3a']) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
      await test.delay(2e2);
    }

    await test.delay(2e3);
    test.expect(receivedEvents).to.eql(['event-2a', 'event-3a']);
    await test.client.destroy(listenerClient);
  });

  it('we add a test user that has permissions to access some of the ProtectedComponent events, including events  on sub/paths, subscribe on **, we test that this works', async () => {
    let listenerClient = await test.client.create('test2User', 'password', test.proxyPorts[1]);
    let receivedEvents = [];
    await listenerClient.event.SecuredComponent.on('**', (message) => {
      receivedEvents.push(message.value);
    });

    for (let eventName of [
      'event-1b',
      'event-2b',
      'event-3b',
      'sub-path/sub-event-1b',
      'sub-path/sub-event-2b',
    ]) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
    }
    await test.delay(1000);
    test.expect(receivedEvents).to.eql(['event-2b', 'event-3b', 'sub-path/sub-event-2b']);
    await test.client.destroy(listenerClient);
  });

  it('we add a test user that has permissions to access some of the ProtectedComponent events, including a permission on sub-path/* we test that this works', async () => {
    let listenerClient = await test.client.create('test3User', 'password', test.proxyPorts[1]);
    let receivedEvents = [];
    await listenerClient.event.SecuredComponent.on('**', (message) => {
      receivedEvents.push(message.value);
    });

    for (let eventName of [
      'event-1d',
      'event-2d',
      'event-3d',
      'sub-path/sub-event-1d',
      'sub-path/sub-event-2d',
    ]) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
    }
    await test.delay(1000);
    test
      .expect(receivedEvents)
      .to.eql(['event-2d', 'event-3d', 'sub-path/sub-event-1d', 'sub-path/sub-event-2d']);
    await test.client.destroy(listenerClient);
  });

  it("subscription on '**' will be unauthorized if we have no permissions to any subpaths", async () => {
    let listenerClient = await test.client.create('test4User', 'password', test.proxyPorts[1]);
    let receivedEvents = [];
    let errorCaught = false;
    try {
      await listenerClient.event.SecuredComponent.on('**', (message) => {
        receivedEvents.push(message.value);
      });
    } catch (e) {
      test.expect(e.toString()).to.eql('AccessDenied: unauthorized');
      errorCaught = true;
    } finally {
      await test.client.destroy(listenerClient);
      test.expect(errorCaught).to.be(true);
    }
  });

  it("adding and then removing permissions with subscription on '**'", async () => {
    let listenerClient = await test.client.create('test5User', 'password', test.proxyPorts[1]);
    let receivedEvents = [];

    await listenerClient.event.SecuredComponent.on('**', (message) => {
      receivedEvents.push(message.value);
    });

    await test.delay(5e3);
    await remoteServer.exchange.security.addUserPermissions('test5User', {
      events: {
        '/DOMAIN_NAME/SecuredComponent/event-2c': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/sub-path/sub-event-2c': {
          authorized: true,
        },
      },
    });
    await test.delay(5e3);
    await remoteServer.exchange.SecuredComponent.fireEvent('sub-path/sub-event-2c');
    await test.delay(5e3);
    test.expect(receivedEvents).to.eql(['sub-path/sub-event-2c']);
    receivedEvents = [];
    for (let eventName of [
      'event-1c',
      'event-2c',
      'event-3c',
      'sub-path/sub-event-1c',
      'sub-path/sub-event-2c',
    ]) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
    }
    await test.delay(2e3);
    test.expect(receivedEvents).to.eql(['event-2c', 'sub-path/sub-event-2c']);
    await remoteServer.exchange.security.removeUserPermissions('test5User', {
      events: {
        '/DOMAIN_NAME/SecuredComponent/event-2c': {},
        '/DOMAIN_NAME/SecuredComponent/sub-path/sub-event-2c': {},
      },
    });
    receivedEvents = [];
    await test.delay(5e3);
    for (let eventName of [
      'event-1c',
      'event-2c',
      'event-3c',
      'sub-path/sub-event-1c',
      'sub-path/sub-event-2c',
    ]) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
    }
    await test.delay(2e3);
    test.expect(receivedEvents).to.eql([]);
    await test.client.destroy(listenerClient);
  });

  it("Removing then adding permissions with subscription on '**'", async () => {
    let listenerClient = await test.client.create('test6User', 'password', test.proxyPorts[1]);
    let receivedEvents = [];

    await listenerClient.event.SecuredComponent.on('**', (message) => {
      receivedEvents.push(message.value);
    });
    let testEvents = [
      'event-1e',
      'event-2e',
      'event-3e',
      'sub-path/sub-event-1e',
      'sub-path/sub-event-2e',
    ];
    for (let eventName of testEvents) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
      await test.delay(100);
    }

    await test.delay(1000);
    test.expect(receivedEvents).to.eql(testEvents);
    await remoteServer.exchange.security.removeUserPermissions('test6User', {
      events: {
        '/DOMAIN_NAME/SecuredComponent/event-3e': {},
        '/DOMAIN_NAME/SecuredComponent/sub-path/sub-event-2e': {},
      },
    });
    await test.delay(1000);
    receivedEvents = [];
    for (let eventName of testEvents) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
      await test.delay(100);
    }
    await test.delay(1000);
    test.expect(receivedEvents).to.eql(['event-1e', 'event-2e', 'sub-path/sub-event-1e']);
    receivedEvents = [];
    await remoteServer.exchange.security.addUserPermissions('test6User', {
      events: {
        '/DOMAIN_NAME/SecuredComponent/event-3e': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/sub-path/sub-event-2e': {
          authorized: true,
        },
      },
    });
    await test.delay(3e3);
    for (let eventName of testEvents) {
      await remoteServer.exchange.SecuredComponent.fireEvent(eventName);
      await test.delay(100);
    }
    await test.delay(1000);
    test.expect(receivedEvents).to.eql(testEvents);
    await test.client.destroy(listenerClient);
  });

  let permissions = {
    test1User: {
      methods: {},
      events: {
        '/DOMAIN_NAME/SecuredComponent/event-3a': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/event-2a': {
          authorized: true,
        },
      },
    },
    test2User: {
      events: {
        '/DOMAIN_NAME/SecuredComponent/event-3b': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/event-2b': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/sub-path/sub-event-2b': {
          authorized: true,
        },
      },
    },
    test3User: {
      events: {
        '/DOMAIN_NAME/SecuredComponent/event-3d': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/event-2d': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/sub-path/*': {
          authorized: true,
        },
      },
    },
    test4User: {
      methods: {},
      events: {},
    },
    test5User: {
      methods: {},
      events: {
        '/DOMAIN_NAME/SecuredComponent/someEventNotFired': {
          authorized: true,
        },
      },
    },
    test6User: {
      methods: {},
      events: {
        '/DOMAIN_NAME/SecuredComponent/someEventNotFired': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/event-1e': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/event-2e': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/event-3e': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/sub-path/sub-event-1e': {
          authorized: true,
        },
        '/DOMAIN_NAME/SecuredComponent/sub-path/sub-event-2e': {
          authorized: true,
        },
      },
    },
  };

  function serverConfig(seq, minPeers) {
    var config = baseConfig(seq, minPeers, true);
    config.happn.allowNestedPermissions = true;
    config.adminPassword = 'test';
    config.modules = {
      SecuredComponent: {
        path: __filename,
      },
    };
    config.components = {
      SecuredComponent: {
        moduleName: 'SecuredComponent',
        schema: {
          exclusive: false,
          methods: {},
        },
      },
    };
    config.happn.services.security = {
      config: {
        updateSubscriptionsOnSecurityDirectoryChanged: true,
      },
    };
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3, // 1 per second
      },
    };
    return config;
  }
});
