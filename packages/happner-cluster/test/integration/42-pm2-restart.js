const clusterHelper = require('../_lib/helpers/pm2-manager').create();
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const getSeq = require('../_lib/helpers/getSeq');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const libDir = require('../_lib/lib-dir');
let { fork } = require('child_process');
const path = require('path');
require('../_lib/test-helper').describe({ timeout: 600e3 }, (test) => {
  const _ = test._;
  let _AdminClient;
  let nodeConfigs;

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
    clusterHelper.start('remote1', nodeConfigs[0]);
    await test.delay(2000);
    clusterHelper.start('remote2', nodeConfigs[1]);
    clusterHelper.start('broker1', nodeConfigs[2]);
    clusterHelper.start('broker2', nodeConfigs[3]);

    await test.delay(15e3);
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
    clusterHelper.destroy();
  });

  it('Attaches a bunch of clients', async () => {
    await test.delay(4000);
    let done;
    let child = fork(path.resolve(__dirname, '../_lib/client-subprocess-41-42'), [getSeq.getPort(3)]);
    child.on('message', (data) => {
      if (data === 'ok') done();
    });
    await test.delay(1000);
    await clusterHelper.restart('remote1');
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
});
