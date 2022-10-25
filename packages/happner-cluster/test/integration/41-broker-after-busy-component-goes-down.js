const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();
const clearMongoCollection = require('../_lib/clear-mongo-collection');
let { fork } = require('child_process');
const path = require('path');

require('../_lib/test-helper').describe({ timeout: 600e3 }, (test) => {
  const _ = test._;
  let _AdminClient;
  let nodeConfigs;

  let servers;

  before('clear mongo collection', (done) => {
    clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', done);
  });

  before('start cluster', async () => {
    nodeConfigs = [
      getRemoteConfig(getSeq.getFirst()),
      getRemoteConfig(getSeq.getNext()),
      getBrokerConfig(getSeq.getNext()),
      getBrokerConfig(getSeq.getNext()),
    ];
    let serverPromises = [clusterHelper.start(nodeConfigs[0])];
    await test.delay(2000);
    for (let config of nodeConfigs.slice(1)) {
      serverPromises.push(clusterHelper.start(config));
    }
    servers = await Promise.all(serverPromises);
    brokers = servers.slice(-2);
    remotes = servers.slice(0, 2);
  });

  before('create test clients', async () => {
    _AdminClient = await testclient.create('_ADMIN', 'happn', getSeq.getPort(1));
    await users.add(_AdminClient, 'username', 'password');
    await users.allowMethod(_AdminClient, 'username', 'busyComponent', 'setData');
  });

  after('disconnect clients', async () => {
    if (_AdminClient) await _AdminClient.disconnect();
    _AdminClient = null;
  });

  after('stop cluster', async () => {
    await clusterHelper.destroy();
  });

  it('Attaches a bunch of clients', async () => {
    await test.delay(4000);
    let done;
    let child = fork(path.resolve(__dirname, '../_lib/client-subprocess-41-42'), [
      getSeq.getPort(3),
    ]);
    child.on('message', (data) => {
      if (data === 'ok') done();
    });
    await test.delay(1000);
    await restartNode(0);

    await new Promise((res) => {
      done = res;
    });
  });

  function getRemoteConfig(seq) {
    let config = baseConfig(seq, 2, true);
    config.happn.services.orchestrator.config.serviceName = 'remote';
    config.happn.services.orchestrator.config.cluster = { remote: 2, broker: 2 };
    config.modules = {
      busyComponent: {
        path: libDir + 'integration-41-remote-component',
      },
    };
    config.components = {
      busyComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function getBrokerConfig(seq) {
    let config = baseConfig(seq, 2, true);
    config.happn.services.orchestrator.config.serviceName = 'broker';
    config.happn.services.orchestrator.config.cluster = { remote: 2, broker: 2 };
    config.modules = {
      brokerComponent: {
        path: libDir + 'integration-41-broker-component',
      },
    };
    config.components = {
      brokerComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  async function restartNode(index, restartDelay = 6000) {
    let stopped = await clusterHelper.stopChild(index);
    if (stopped !== true) throw new Error('FAILED TO STOP NODE');
    await test.delay(restartDelay);
    servers[index] = await clusterHelper.start(nodeConfigs[index], index);
  }
});
