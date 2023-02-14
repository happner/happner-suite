const multiAuthConfig = require('../_lib/multi-auth-provider-config.js');

require('../_lib/test-helper').describe({ timeout: 70e3 }, (test) => {
  let hooksConfig = {
    cluster: {
      functions: [serverConfig, serverConfig],
      localInstance: 0,
    },
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, hooksConfig, timing);
  let testUser = {
    username: 'happnTestuser@somewhere.com',
    password: 'password',
  };

  let testUser2 = {
    username: 'secondTestuser@somewhere.com',
    password: 'secondPass',
  };

  before('add happn test user', async () => {
    await test.users.add(test.servers[0], testUser.username, testUser.password);
    await test.delay(5000);
  });

  it('we should be able to log in using happn3 auth with testUser', async () => {
    let listenerClient = await test.client.create(
      testUser.username,
      testUser.password,
      test.proxyPorts[1],
      'happn'
    );
    test.expect(listenerClient).to.be.ok();
    await listenerClient.disconnect();
  });

  it('we should be able to log in using second auth with testUser2', async () => {
    let listenerClient = await test.client.create(
      testUser2.username,
      testUser2.password,
      test.proxyPorts[1]
    ); //Should default to 'second' authProvider
    test.expect(listenerClient).to.be.ok();
    await listenerClient.disconnect();
  });

  it('we should fail to log in using happn3 auth with testUser2 (second auth user)', async () => {
    try {
      // eslint-disable-next-line no-unused-vars
      let listenerClient = await test.client.create(
        testUser2.username,
        testUser2.password,
        test.proxyPorts[1],
        'happn'
      );
      throw new Error("Shouldn't get here");
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: Invalid credentials');
    }
  });

  it('we should fail to log in using second auth with testUser (happn3 auth user)', async () => {
    try {
      await client.create(testUser.username, testUser.password, test.proxyPorts[1]); //Should default to 'second' authProvider
      throw new Error("Shouldn't get here");
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: Invalid credentials');
    }
  });

  function serverConfig(seq, minPeers) {
    var config = multiAuthConfig(seq, minPeers, true);
    config.happn.services.replicator = {
      config: {
        securityChangesetReplicateInterval: 10, // 100 per second
      },
    };
    return config;
  }
});
