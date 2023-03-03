require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  let happn = require('../../../lib/index');
  var resolved = require.resolve('happn-3');
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: happn,
  };
  let clearMongo = require('../../__fixtures/utils/cluster/clear-mongodb');
  let getClusterConfig = require('../../__fixtures/utils/cluster/get-cluster-config');
  let clusterServices = [];
  let mongoUrl = 'mongodb://127.0.0.1:27017';
  let mongoCollection = 'happn-cluster-test';
  let HappnCluster = require('happn-cluster');
  let getAddress = require('../../__fixtures/utils/cluster/get-address');

  before('start cluster', async () => {
    await clearMongoDb();
    await startCluster();
  });

  after('stop cluster', async () => {
    await stopCluster();
    await clearMongoDb();
  });

  var testGroup = {
    name: 'TEST GROUP',
    permissions: {
      'client-revoke-session-sanity': {
        actions: ['*'],
      },
      '/TEST/DATA/*': {
        actions: ['*'],
      },
      '/@HTTP/TEST/WEB/ROUTE': {
        actions: ['get'],
      },
    },
  };

  var testUser = {
    username: 'TEST_SESSION',
    password: 'TEST PWD',
  };

  var addedTestGroup;
  var addedTestUser;

  before(
    'creates a group and a user, adds the group to the user, logs in with test user',
    async () => {
      addedTestGroup = await clusterServices[0].services.security.users.upsertGroup(testGroup, {
        overwrite: false,
      });
      addedTestUser = await clusterServices[0].services.security.users.upsertUser(testUser, {
        overwrite: false,
      });
      await clusterServices[0].services.security.users.linkGroup(addedTestGroup, addedTestUser);
    }
  );

  it('ensures revoking a token on 1 client revokes the token on all clients using the token, we wait for the token revocation ttl to expire and ensure it has been removed from the cache', async () => {
    let client1 = await getClient({
      username: testUser.username,
      password: 'TEST PWD',
      port: 56000,
    });
    let client2 = await getClient({ token: client1.session.token, port: 56001 });
    await doEventRoundTripClient(client2);
    await client1.disconnect({ revokeToken: true });
    try {
      test.log(`waiting 5 seconds for security change to populate...`);
      await test.delay(5e3);
      await doEventRoundTripClient(client2);
      throw new Error('was not meant to happen');
    } catch (e) {
      test.expect(e.message).to.be('client is disconnected');
      test.expect(await revocationInPlace(clusterServices[0], client1.session.token)).to.be(true);
      test.expect(await revocationInPlace(clusterServices[1], client1.session.token)).to.be(true);
      test.log(`waiting 12 seconds for ttl...`);
      await test.delay(12e3);
      test.expect(await revocationInPlace(clusterServices[0], client1.session.token)).to.be(false);
      test.expect(await revocationInPlace(clusterServices[1], client1.session.token)).to.be(false);
      await client2.disconnect();
    }
  });

  let securityProfiles = [
    {
      name: 'test-session',
      session: {
        'user.username': 'TEST_SESSION',
      },
      policy: {
        ttl: 8e3,
      },
    },
    {
      name: 'long-session',
      session: {
        'user.username': 'TEST_SESSION_1',
      },
      policy: {
        ttl: 0,
      },
    },
  ];

  async function getClient(config) {
    return happn.client.create({ config, secure: true });
  }

  async function doEventRoundTripClient(client) {
    return new Promise((resolve, reject) => {
      var timeout = this.setTimeout(() => {
        reject(new Error('timed out'));
      }, 3000);
      client.on(
        'client-revoke-session-sanity',
        (data) => {
          this.clearTimeout(timeout);
          test.expect(data).to.eql({ test: 'data' });
          resolve();
        },
        (e) => {
          if (e) return reject(e);
          client.set('client-revoke-session-sanity', { test: 'data' }, (e) => {
            if (e) return reject(e);
          });
        }
      );
    });
  }

  async function revocationInPlace(service, token) {
    return (await service.services.security.cache_revoked_tokens.get(token)) != null;
  }

  async function clearMongoDb() {
    await clearMongo(mongoUrl, mongoCollection);
  }

  async function stopCluster() {
    for (let i = 0; i < 2; i++) await clusterServices[i].stop();
  }

  async function startCluster() {
    let clusterConfig1 = getClusterConfig(
      55000,
      56000,
      57000,
      [`${getAddress()}:57001`],
      mongoCollection,
      mongoUrl,
      1,
      true,
      true,
      true
    );
    let clusterConfig2 = getClusterConfig(
      55001,
      56001,
      57001,
      [`${getAddress()}:57000`],
      mongoCollection,
      mongoUrl,
      2,
      false,
      true,
      true
    );

    clusterConfig1.services.security.config.profiles = securityProfiles;
    clusterConfig2.services.security.config.profiles = securityProfiles;

    let clusterInstance1 = await HappnCluster.create(clusterConfig1);
    let clusterInstance2 = await HappnCluster.create(clusterConfig2);

    clusterServices.push(clusterInstance1);
    clusterServices.push(clusterInstance2);

    await test.delay(2000);
  }
});
