require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  let happn = require('../../../lib/index');
  var resolved = require.resolve('happn-3');
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: happn,
  };
  const DEPLOYMENT_ID = test.newid();
  let mongoUrl = 'mongodb://127.0.0.1:27017';
  let mongoDatabase = 'happn-cluster';
  let mongoCollection = 'happn-cluster-test';
  let clearMongo = require('../../__fixtures/utils/cluster/clear-mongodb');
  let getClusterConfig = require('../../__fixtures/utils/cluster/get-cluster-config');
  let clusterMembers = [];
  let HappnCluster = require('happn-cluster');

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
      addedTestGroup = await clusterMembers[0].services.security.users.upsertGroup(testGroup);
      addedTestUser = await clusterMembers[0].services.security.users.upsertUser(testUser);
      await clusterMembers[0].services.security.users.linkGroup(addedTestGroup, addedTestUser);
    }
  );

  it('ensures revoking a token on 1 client revokes the token on all clients using the token, we wait for the token revocation ttl to expire and ensure it has been removed from the cache', async () => {
    let client1 = await getClient({
      username: testUser.username,
      password: 'TEST PWD',
      port: 55000,
    });
    let client2 = await getClient({ token: client1.session.token, port: 55001 });
    await doEventRoundTripClient(client2);
    await client1.disconnect({ revokeToken: true });
    try {
      test.log(`waiting 5 seconds for security change to populate...`);
      await test.delay(5e3);
      await doEventRoundTripClient(client2);
      throw new Error('was not meant to happen');
    } catch (e) {
      test.expect(e.message).to.be('client is disconnected');
      test.expect(await revocationInPlace(clusterMembers[0], client1.session.token)).to.be(true);
      test.expect(await revocationInPlace(clusterMembers[1], client1.session.token)).to.be(true);
      test.log(`waiting 12 seconds for ttl...`);
      await test.delay(12e3);
      test.expect(await revocationInPlace(clusterMembers[0], client1.session.token)).to.be(false);
      test.expect(await revocationInPlace(clusterMembers[1], client1.session.token)).to.be(false);
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
    for (let i = 0; i < 2; i++) await clusterMembers[i].stop();
  }

  async function startCluster() {
    let clusterConfig1 = getClusterConfig(
      mongoUrl,
      mongoDatabase,
      mongoCollection,
      DEPLOYMENT_ID,
      55000,
      true,
      true,
      securityProfiles
    );
    let clusterConfig2 = getClusterConfig(
      mongoUrl,
      mongoDatabase,
      mongoCollection,
      DEPLOYMENT_ID,
      55001,
      true,
      true,
      securityProfiles
    );

    let clusterInstance1 = await HappnCluster.create(clusterConfig1);
    let clusterInstance2 = await HappnCluster.create(clusterConfig2);

    clusterMembers.push(clusterInstance1);
    clusterMembers.push(clusterInstance2);

    await test.delay(2000);
  }
});
