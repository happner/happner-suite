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
  let testClients = [];
  let meshNames = [];
  let clusterSize = 4;
  let servers;
  let erroredMesh;
  before('clear mongo collection', (done) => {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  before('start cluster', async () => {
    const serverPromises = [];
    let i = 0;
    while (i < clusterSize) {
      let seq = i === 0 ? getSeq.getFirst() : getSeq.getNext();
      const remoteComponent = baseConfig(seq, 2, true, null, null, null, null, null);
      remoteComponent.happn.services.orchestrator.config.serviceName = 'testComponent';
      remoteComponent.happn.services.orchestrator.config.cluster = { testComponent: clusterSize };
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
      if (i === clusterSize - 1) {
        serverPromises.push(test.HappnerCluster.create(remoteComponent));
      } else {
        serverPromises.push(clusterHelper.start(remoteComponent));
      }
      i++;
    }
    servers = await Promise.all(serverPromises);
  });

  before('create test clients', async () => {
    _AdminClient = await testclient.create('_ADMIN', 'happn', getSeq.getPort(1));
    await users.add(_AdminClient, 'username', 'password');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'block');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'getEvents');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'getKeys');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'fireEvent');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'clearEvents');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'subscribeSecondEvent');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'fireSecondEvent');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'offSecondEvent');
    for (let i = 1; i <= clusterSize; i++) {
      testClients.push(await testclient.create('username', 'password', getSeq.getPort(i)));
    }
  });
  after('disconnect _ADMIN client', async () => {
    if (_AdminClient) await _AdminClient.disconnect();
    _AdminClient = null;
    for (let testClient of testClients) {
      await testClient.disconnect();
      testClient = null;
    }
  });

  after('stop cluster', async () => {
    await clusterHelper.destroy();
  });

  it('TRYs to throw a client into an error state', async () => {
    erroredMesh = servers[clusterSize - 1];
    let orchestrator = servers[clusterSize - 1]._mesh.happn.server.services.orchestrator;
    let otherMemberKey = Object.keys(orchestrator.members).filter(
      (memberKey) => memberKey !== orchestrator.members.__self.memberId
    )[0];
    let client2other = orchestrator.members[otherMemberKey].client;
    client2other.__performDataRequest = async () => {
      throw new Error('test error');
    };
    try {
      await testConnections();
    } catch (e) {
      //Expected error => Error is thrown at client2other and Nodes will not be (fully) connected
      test
        .expect(e.err.toString())
        .to.eql('Error: Test failed due to duplicate or insufficient connections');
      e.errors.forEach((error) =>
        test.expect(error.toString().startsWith('Error: Insufficients connections')).to.be(true)
      );
    }
    await test.delay(15e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions();
  });

  async function testConnections() {
    for (let client of testClients) {
      await client.exchange.testComponent.clearEvents();
    }
    await test.delay(1000);
    for (let client of testClients) {
      await client.exchange.testComponent.fireEvent();
      await test.delay(300);
    }
    await test.delay(1000);
    let errored = false;
    let errors = [];
    for (let [index, client] of testClients.entries()) {
      let events = await client.exchange.testComponent.getEvents();
      let connected = events.map((event) => event.split(':')[0]);
      try {
        test.expect(_.isEqual(connected, meshNames)).to.be(true);
      } catch (e) {
        errored = true;
        let dupes = findDuplicates(connected).map((dupe) => dupe.split('_')[1]);
        if (dupes.length) {
          errors.push(
            new Error(`Duplicate connections at ${getSeq.getMeshName(index + 1)}: ${dupes}`)
          );
        } else {
          errors.push(
            new Error(`Insufficients connections at ${getSeq.getMeshName(index + 1)}: ${dupes}`)
          );
        }
      }
    }
    if (errored) {
      throw { err: new Error('Test failed due to duplicate or insufficient connections'), errors };
    }
  }

  async function testNewSubscriptions(indices) {
    indices = indices || Array.from(Array(clusterSize).keys());
    let clients = indices.map((index) => testClients[index]);
    let meshNames = indices.map((index) => getSeq.getMeshName(index + 1));

    for (let client of clients) {
      await client.exchange.testComponent.subscribeSecondEvent();
      await client.exchange.testComponent.clearEvents();
    }
    await test.delay(1000);
    for (let client of clients) {
      await client.exchange.testComponent.fireSecondEvent();
    }
    for (let client of clients) {
      await client.exchange.testComponent.offSecondEvent();
    }
    for (let client of clients) {
      let events = await client.exchange.testComponent.getEvents();
      let connected = events.map((event) => event.split(':')[0]);
      test.expect(_.isEqual(connected, meshNames)).to.be(true);
    }
  }
  async function checkPeers() {
    let errored = false;
    let errors = [];
    // let erroredMesh = servers.slice(-1);s
    for (let i = 0; i < clusterSize; i++) {
      try {
        let details =
          i === clusterSize - 1
            ? {
                peers: Object.keys(erroredMesh._mesh.happn.server.services.orchestrator.peers),
                peerEndpoints: Object.values(
                  erroredMesh._mesh.happn.server.services.orchestrator.peers
                ).map((peer) => peer.endpoint),
                members: Object.keys(erroredMesh._mesh.happn.server.services.orchestrator.members),
              }
            : await clusterHelper.listMembers(i);
        test.expect(details.members.length).to.eql(clusterSize);
        test.expect(details.peers.length).to.eql(clusterSize);
        // test.expect(details.peerEndpoints.length).to.eql(clusterSize);
        // test
        //   .expect(test._.isEqual(details.members.sort(), details.peerEndpoints.sort()))
        //   .to.be(true);
      } catch (e) {
        errored = true;
        errors.push(new Error(`Member/peer mismatch at ${getSeq.getMeshName(i + 1)}`));
      }
    }

    if (errored) {
      throw new Error('Test failed due to peer/member mismatch (some membersin unstable state)');
    }
  }
  const findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);
});
