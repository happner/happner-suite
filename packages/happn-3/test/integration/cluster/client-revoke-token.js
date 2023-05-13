require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  const DEPLOYMENT_ID = test.newid();
  let mongoUrl = 'mongodb://127.0.0.1:27017';
  let mongoDatabase = 'happn-cluster';
  let mongoCollection = 'happn-cluster-test';
  let happn = require('../../../lib/index');
  var resolved = require.resolve('happn-3');

  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: happn,
  };

  let expect = require('expect.js');
  let delay = require('await-delay');
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
  var addedTestuser;

  before(
    'creates a group and a user, adds the group to the user, logs in with test user',
    function (done) {
      clusterMembers[0].services.security.users.upsertGroup(testGroup, function (e, result) {
        if (e) return done(e);
        addedTestGroup = result;

        clusterMembers[0].services.security.users.upsertUser(testUser, function (e, result) {
          if (e) return done(e);
          addedTestuser = result;

          clusterMembers[0].services.security.users.linkGroup(addedTestGroup, addedTestuser, done);
        });
      });
    }
  );

  it('ensures revoking a token on 1 client revokes the token on all clients using the token', async () => {
    let client1 = await getClient({
      username: testUser.username,
      password: 'TEST PWD',
      port: 55000,
    });
    let client2 = await getClient({ token: client1.session.token, port: 55001 });
    await doEventRoundTripClient(client2);
    await client1.disconnect({ revokeToken: true });
    await delay(5000);
    try {
      await doEventRoundTripClient(client2);
      throw new Error('was not meant to happen');
    } catch (e) {
      expect(e.message).to.be('client is disconnected');
      client2.disconnect();
    }
  });

  it('ensures revoking a session on a child client (login from parent token) revokes the token on the parent as well', async () => {
    let client1 = await getClient({
      username: testUser.username,
      password: 'TEST PWD',
      port: 55000,
    });
    let client2 = await getClient({ token: client1.session.token, port: 55001 });
    await doEventRoundTripClient(client1);
    await client2.disconnect({ revokeToken: true });
    try {
      await delay(2000);
      await doEventRoundTripClient(client1);
      throw new Error('was not meant to happen');
    } catch (e) {
      expect(e.message).to.be('client is disconnected');
      client1.disconnect();
    }
  });

  it('ensures revoking a session on a child client (login from parent token) revokes the token on the parent as well, 3 levels deep', async () => {
    let client1 = await getClient({
      username: testUser.username,
      password: 'TEST PWD',
      port: 55000,
    });
    let client2 = await getClient({ token: client1.session.token, port: 55001 });
    let client3 = await getClient({ token: client2.session.token, port: 55001 });
    await doEventRoundTripClient(client1);
    await client3.disconnect({ revokeToken: true });
    try {
      await delay(5e3);
      await doEventRoundTripClient(client1);
      throw new Error('was not meant to happen');
    } catch (e) {
      expect(e.message).to.be('client is disconnected');
      client1.disconnect();
      client2.disconnect();
    }
  });

  it('ensures revoking a token on 1 client revokes the token on all clients using the token, 3 levels deep', async () => {
    let client1 = await getClient({
      username: testUser.username,
      password: 'TEST PWD',
      port: 55000,
    });
    let client2 = await getClient({ token: client1.session.token, port: 55001 });
    let client3 = await getClient({ token: client2.session.token, port: 55001 });
    let sessionEndedEvents = [];
    client2.onEvent('session-ended', (evt) => {
      sessionEndedEvents.push(evt);
    });

    client3.onEvent('session-ended', (evt) => {
      sessionEndedEvents.push(evt);
    });

    await doEventRoundTripClient(client3);
    await client1.disconnect({ revokeToken: true });
    try {
      await delay(5e3);
      await doEventRoundTripClient(client3);
      throw new Error('was not meant to happen');
    } catch (e) {
      expect(e.message).to.be('client is disconnected');
      expect(sessionEndedEvents.length).to.be(2);
      client2.disconnect();
      client3.disconnect();
    }
  });

  function restoreToken(token) {
    return new Promise((resolve, reject) => {
      clusterMembers[0].services.security.restoreToken(token, function (e) {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  it('ensures revoking a token on 1 client revokes the token on all clients using the token - then restoring the token allows access again, 3 levels deep', async () => {
    let client1 = await getClient({
      username: testUser.username,
      password: 'TEST PWD',
      port: 55000,
    });
    let client2 = await getClient({ token: client1.session.token, port: 55001 });
    let client3 = await getClient({ token: client2.session.token, port: 55001 });
    await doEventRoundTripClient(client3);
    await client1.disconnect({ revokeToken: true });
    try {
      await delay(5e3);
      await doEventRoundTripClient(client3);
      throw new Error('was not meant to happen');
    } catch (e) {
      expect(e.message).to.be('client is disconnected');
      await restoreToken(client1.session.token);
      await delay(5e3);
      client3 = await getClient({ token: client2.session.token, port: 55001 });
      await doEventRoundTripClient(client3);
      client2.disconnect();
      client3.disconnect();
    }
  });

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
      true
    );
    let clusterConfig2 = getClusterConfig(
      mongoUrl,
      mongoDatabase,
      mongoCollection,
      DEPLOYMENT_ID,
      55001,
      true,
      true
    );

    let clusterInstance1 = await HappnCluster.create(clusterConfig1);
    let clusterInstance2 = await HappnCluster.create(clusterConfig2);

    clusterMembers.push(clusterInstance1);
    clusterMembers.push(clusterInstance2);

    await delay(2000);
  }

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
          expect(data).to.eql({ test: 'data' });
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
});
