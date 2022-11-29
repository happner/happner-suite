const clearMongoCollection = require('../clear-mongo-collection');
const stopCluster = require('../stop-cluster');
const HappnerCluster = require('../../..');
const users = require('../users');
const client = require('../client');
const delay = require('await-delay');
module.exports = {
  stopClusterHook,
  clearMongoCollectionHook,
  stopClientsHook,
  setup,
  standardHooks,
};

function standardHooks(config = {}, timing = {}, addUser = false) {
  setup();
  clearMongoCollectionHook(timing.clearMongo);
  startServersHook(config.cluster, timing.startCluster);
  if (addUser) addUsersHook();
  startClientsHook(config.clients, timing.startClients);
  stopClientsHook(timing.stopClients);
  stopClusterHook(timing.stopCluster);
}

function stopClusterHook(timing) {
  switch (timing) {
    case 'after': {
      return after('stop Cluster', async function () {
        await stopCluster(this.servers);
        this.serves = [];
      });
    }
    case 'afterEach':
    default: {
      afterEach('stop Cluster', async function () {
        await stopCluster(this.servers);
        this.serves = [];
      });
    }
  }
}

function setup() {
  before(function () {
    this.clients = [];
    this.servers = [];
    this.proxyPorts = [];
    this.localInstance = {};
    this.remoteInstance = {};
  });
}
function stopClientsHook(timing) {
  switch (timing) {
    case 'afterEach':
      break;
    default: {
      after('stop clients', async function () {
        await stopClient.bind(this)();
      });
    }
  }
}
function startClientsHook(config, timing) {
  if (!config) return;
  switch (timing) {
    case 'beforeEach':
      break;
    default: {
      before('start clients', async function () {
        await startClients.bind(this)(config);
      });
    }
  }
}

function startServersHook(config, timing) {
  if (typeof config !== 'object') return;
  switch (timing) {
    case 'before':
      return before('start cluster', async function () {
        await startCluster.bind(this)(config);
      });
    case 'beforeEach':
    default:
      beforeEach('start cluster', async function () {
        await startCluster.bind(this)(config);
      });
  }
}
function addUsersHook() {
  before('Add user', async function () {
    await users.add(this.servers[0], 'username', 'password');
  });
}
function clearMongoCollectionHook(timing) {
  switch (timing) {
    case 'before':
      before('clear mongo collection', (done) => {
        clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', done);
      });
      break;
    default:
      beforeEach('clear mongo collection', (done) => {
        clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', done);
      });
  }
}

async function stopClient() {
  if (!this.clients.length) return;
  for (let client of this.clients) {
    await client.disconnect();
  }
}

async function startCluster(config) {
  let servers = await Promise.all(
    config.functions.map(async (configFunction, index) => {
      return HappnerCluster.create(configFunction(index, index + 1, config.dynamic));
    })
  );
  this.servers = servers.sort((a, b) => {
    if (a._mesh.config.name < b._mesh.config.name) return -1;
    return 1;
  });
  await test.delay(2e3)
  this.proxyPorts = this.servers.map(
    (server) => server._mesh.happn.server.config.services.proxy.port
  );
  // await users.add(this.servers[0], 'username', 'password');
  if (typeof config.localInstance === 'number') {
    this.localInstance = this.servers[config.localInstance];
  }
  if (typeof config.remoteInstance === 'number') {
    this.remoteInstance = this.servers[config.remoteInstance];
  }
}
async function startClients(config) {
  this.clients = await Promise.all(
    config.map(async (index) => {
      return client.create('username', 'password', this.proxyPorts[index]);
    })
  );
}

//
