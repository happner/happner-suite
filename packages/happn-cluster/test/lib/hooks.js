process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

let path = require('path');
let ChildProcess = require('child_process');
let clone = require('clone');
let HappnCluster = require('../../');
let testUtils = require('./test-utils');
const wait = require('await-delay');
const test = require('happn-commons-test').create();

module.exports.startCluster = function (clusterOpts) {
  let testSequence = clusterOpts.testSequence || 1;
  let clusterSize = clusterOpts.size || 5;
  let happnSecure = typeof clusterOpts.happnSecure === 'boolean' ? clusterOpts.happnSecure : false;
  let proxySecure = typeof clusterOpts.proxySecure === 'boolean' ? clusterOpts.proxySecure : false;
  let services = clusterOpts.services || {};
  let clusterConfig = clusterOpts.clusterConfig;
  let additionalDatastore = clusterOpts.datastore;
  before('clear collection (before)', function (done) {
    testUtils.clearMongoCollection(done);
  });

  before('start cluster', async function () {
    let self = this;

    if (!clusterConfig)
      self.__configs = await testUtils.createMemberConfigs(
        testSequence,
        clusterSize,
        happnSecure,
        proxySecure,
        services
      );
    else
      self.__configs = await testUtils.createMultiServiceMemberConfigs(
        testSequence,
        clusterSize,
        happnSecure,
        proxySecure,
        services,
        clusterConfig
      );
    if (additionalDatastore) {
      self.__configs.forEach((config) => {
        config.services.data.config.datastores.push(additionalDatastore);
      });
    }
    let servers = [];
    servers.push(HappnCluster.create(clone(self.__configs[0])));
    await test.delay(2000);
    // start first peer immediately and other a moment
    // later so they don't all fight over creating the
    // admin user in the shared database
    for (let [sequence, config] of self.__configs.entries()) {
      if (sequence === 0) {
        continue;
      }
      servers.push(HappnCluster.create(clone(config)));
    }
    self.servers = await Promise.all(servers);
    
    self.ports = self.servers.map((server) => server.config.port);
    await test.delay(2000);
    return self.servers;
  });
};

module.exports.stopCluster = function () {
  after('stop cluster', async function () {
    if (!this.servers) return;
    for (let server of this.servers) {
      await server.stop({ reconnect: false });
      // stopping all at once causes replicator client happn logouts to timeout
      // because happn logout attempts unsubscribe on server, and all servers
      // are gone
      await wait(1000); // ...so pause between stops (long for travis)
    }
  });

  after('clear collection (after)', function (done) {
    testUtils.clearMongoCollection(done);
  });
};

module.exports.startMultiProcessCluster = function (clusterOpts) {
  before('multi clear collection (before)', function (done) {
    testUtils.clearMongoCollection(done);
  });

  let testSequence = clusterOpts.testSequence || 1;
  let clusterSize = clusterOpts.size || 5;
  let happnSecure = typeof clusterOpts.happnSecure === 'boolean' ? clusterOpts.happnSecure : false;
  let proxySecure = typeof clusterOpts.proxySecure === 'boolean' ? clusterOpts.proxySecure : false;
  let services = clusterOpts.services || {};

  let peerPath = __dirname + path.sep + 'peer.js';

  before('start cluster', async function () {
    let self = this;

    self.__configs = await testUtils.createMemberConfigs(
      testSequence,
      clusterSize,
      happnSecure,
      proxySecure,
      services
    );

    let processes = await Promise.all(
      self.__configs.map(function (config) {
        let configJson = [JSON.stringify(config)];

        return new Promise(function (resolve) {
          let peerProcess = ChildProcess.fork(peerPath, configJson);
          peerProcess.on('message', function (message) {
            if (message === 'ready') return resolve(peerProcess);
          });
        });
      })
    );

    self.peerProcesses = processes;
    self.servers = 'see .peerProcesses[n].send';
  });
};

module.exports.stopMultiProcessCluster = function () {
  after('stop cluster', function (done) {
    if (!this.peerProcesses) return done();
    this.peerProcesses.forEach(function (proc) {
      proc.kill();
    });
    done();
  });

  after('multi clear collection (after)', function (done) {
    testUtils.clearMongoCollection(done);
  });
};
module.exports.clearNamedCollection = function (collectionName) {
  before('clear collection (before)', function (done) {
    testUtils.clearMongoCollection(done, collectionName);
  });
  afterEach('clear collection (after)', function (done) {
    testUtils.clearMongoCollection(done, collectionName);
  });
};
