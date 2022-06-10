const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();
const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 600e3 }, (test) => {
  const _ = test._;
  let _AdminClient;
  let nodeConfigs = [];
  let blockingClient;
  let meshNames = [];
  let clusterSize = 4;

  before('clear mongo collection', (done) => {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  before('start cluster', async () => {
    const serverPromises = [];
    let i = 0;
    while (i < clusterSize) {
      let seq = i === 0 ? getSeq.getFirst() : getSeq.getNext();
      const remoteComponent = baseConfig(seq, 2, true, null, null, null, null, null);

      remoteComponent.happn.services.orchestrator.config.serviceName =
        i === 0 ? 'blockingComponent' : 'testComponent';
      remoteComponent.happn.services.orchestrator.config.cluster = {
        testComponent: clusterSize - 1,
        blockingComponent: 1,
      };
      remoteComponent.modules = {
        testComponent: {
          path: libDir + 'integration-38-local-component',
        },
      };
      remoteComponent.components = {
        testComponent: {
          startMethod: 'start',
          stopMethod: 'stop',
        },
      };
      nodeConfigs.push(remoteComponent);
      meshNames.push(remoteComponent.name);
      serverPromises.push(clusterHelper.start(remoteComponent));
      i++;
    }
    await Promise.all(serverPromises);
  });

  before('create test clients', async () => {
    _AdminClient = await testclient.create('_ADMIN', 'happn', getSeq.getPort(1));
    await users.add(_AdminClient, 'username', 'password');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'block');
    blockingClient = await testclient.create('username', 'password', getSeq.getPort(1));
  });

  after('disconnect clients', async () => {
    if (_AdminClient) await _AdminClient.disconnect();
    _AdminClient = null;
    if (blockingClient) await blockingClient.disconnect();
    blockingClient = null;
  });

  after('stop cluster', async () => {
    await clusterHelper.destroy();
  });

  it('blocks', async () => {
    clusterHelper.listenForPeerEvents();
    blockingClient.exchange.testComponent.block(5e3);
    await test.delay(10e3);
    let expectedEvents = [
      { action: 'removed', name: 'MESH_0' },
      { action: 'added', name: 'MESH_0' },
    ];
    for (let i = 1; i < clusterSize; i++) {
      let events = await clusterHelper.getPeerEvents(i);
      test.expect(_.isEqual(events.peerEvents, expectedEvents)).to.be(true);
    }
  });
});
