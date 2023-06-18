const clearMongoCollection = require('./clear-mongo-collection');
const stopCluster = require('./stop-cluster');
const HappnerCluster = require('../..');
const users = require('./users');

module.exports = {
  stopClusterHook,
  clearMongoCollectionHook,
  stopClientsHook,
  standardHooks,
  clusterStartedSeperatelyHooks,
};

function standardHooks(test, config = {}, timing = {}, addUser = false) {
  timing = checkTiming(timing);
  clearMongoCollectionHook(timing.clearMongo);
  startServersHook(test, config.cluster, timing.startCluster);
  if (addUser) addUsersHook(test, timing.addUser);
  startClientsHook(test, config.clients, timing.startClients);
  stopClientsHook(test, timing.stopClients);
  stopClusterHook(test, timing.stopCluster);
}

function clusterStartedSeperatelyHooks(test, timing = {}) {
  clearMongoCollectionHook(timing.clearMongo);
  stopClientsHook(test, timing.stopClients);
  stopClusterHook(test, timing.stopCluster);
}

function stopClusterHook(test, timing) {
  switch (timing) {
    case 'after': {
      after('stop Cluster', async function () {
        let servers = test.servers?.length ? test.servers : [];
        await stopCluster(servers);
        test.servers = [];
      });
      break;
    }
    case 'afterEach':
    default: {
      afterEach('stop Cluster', async function () {
        let servers = test.servers?.length ? test.servers : [];
        await stopCluster(servers);
        test.servers = [];
      });
    }
  }
}

function stopClientsHook(test, timing) {
  switch (timing) {
    case 'after': {
      after('stop clients', async function () {
        if (!test.clients?.length) return;
        await stopClient(test.clients);
        test.clients = [];
      });
      break;
    }
    case 'afterEach':
    default: {
      afterEach('stop clients', async function () {
        if (!test.clients?.length) return;
        await stopClient(test.clients);
        test.clients = [];
      });
    }
  }
}
function startClientsHook(test, config, timing) {
  if (!config?.length) return;
  switch (timing) {
    case 'before': {
      before('start clients', async function () {
        await startClients(test, config);
      });
      break;
    }
    case 'beforeEach':
    default: {
      beforeEach('start clients', async function () {
        await startClients(test, config);
      });
    }
  }
}

function startServersHook(test, config, timing) {
  if (typeof config !== 'object') return;
  switch (timing) {
    case 'before': {
      before('start cluster', async function () {
        await startCluster(test, config);
      });
      break;
    }
    case 'beforeEach':
    default:
      beforeEach('start cluster', async function () {
        await startCluster(test, config);
      });
  }
}
function addUsersHook(test, timing) {
  switch (timing) {
    case 'before': {
      before('Add user', async function () {
        await users.add(test.servers[0], 'username', 'password');
      });
      break;
    }
    case 'beforeEach':
    default: {
      beforeEach('Add user', async function () {
        await users.add(test.servers[0], 'username', 'password');
      });
    }
  }
}
function clearMongoCollectionHook(timing) {
  switch (timing) {
    case 'before':
      before('clear mongo collection', (done) => {
        clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', done);
      });
      break;
    case 'beforeEach':
    default:
      beforeEach('clear mongo collection', (done) => {
        clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', done);
      });
  }
}

async function stopClient(clients) {
  while (clients.length) {
    let client = clients.pop();
    await client.disconnect();
  }
}

async function startCluster(test, config) {
  await test.delay(500);
  let servers = await Promise.all(
    config.functions.map(async (configFunction, index) => {
      return HappnerCluster.create(configFunction(index, index + 1, config.dynamic));
    })
  );
  await test.delay(2e3);
  test.servers = servers.sort((a, b) => {
    if (a._mesh.config.name < b._mesh.config.name) return -1;
    return 1;
  });
  test.proxyPorts = test.servers.map(
    (server) => server._mesh.happn.server.config.services.proxy.port
  );
  if (typeof config.localInstance === 'number') {
    test.localInstance = test.servers[config.localInstance];
  }
  if (typeof config.remoteInstance === 'number') {
    test.remoteInstance = test.servers[config.remoteInstance];
  }
}
async function startClients(test, config) {
  test.clients = await Promise.all(
    config.map(
      async (index) => await test.client.create('username', 'password', test.proxyPorts[index])
    )
  );
}

function checkTiming(timing) {
  if (timing.all === 'before/after') {
    timing = {
      clearMongo: 'before',
      startCluster: 'before',
      addUser: 'before',
      startClients: 'before',
      stopClients: 'after',
      stopCluster: 'after',
    };
  }
  return timing;
}
