const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();
const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 600e3, skip: true }, (test) => {
  let deploymentId = test.newid();
  const _ = test._;
  let _AdminClient;
  let nodeConfigs = [];
  let testClients = [];
  let meshNames = [];
  let clusterSize = 4;
  let servers;
  let erroredMesh;
  let proxyPorts;
  before('clear mongo collection', (done) => {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  before('start cluster', async () => {
    const serverPromises = [];
    let i = 0;
    while (i < clusterSize) {
      const clusterInstance = baseConfig(i, 2, true);
      clusterInstance.modules = {
        testComponent: {
          path: libDir + 'integration-38-local-component',
        },
      };
      clusterInstance.components = {
        testComponent: {
          startMethod: 'start',
          stopMethod: 'stop',
        },
      };
      clusterInstance.happn.services.membership = {
        config: {
          deploymentId,
          securityChangeSetReplicateInterval: 20, // 50 per second
        },
      };
      nodeConfigs.push(clusterInstance);
      meshNames.push(clusterInstance.name);
      if (i === clusterSize - 1) {
        serverPromises.push(test.HappnerCluster.create(clusterInstance));
      } else {
        serverPromises.push(clusterHelper.start(clusterInstance));
      }
      i++;
    }
    servers = await Promise.all(serverPromises);
    proxyPorts = await clusterHelper.getPorts();
    proxyPorts.push(servers[clusterSize - 1]._mesh.happn.server.config.services.proxy.port);
  });

  before('create test clients', async () => {
    _AdminClient = await testclient.create('_ADMIN', 'happn', proxyPorts[0]);
    await users.add(_AdminClient, 'username', 'password');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'block');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'getEvents');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'getKeys');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'fireEvent');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'clearEvents');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'subscribeSecondEvent');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'fireSecondEvent');
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'offSecondEvent');
    for (let i = 0; i < clusterSize; i++) {
      testClients.push(await testclient.create('username', 'password', proxyPorts[i]));
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
    let otherMemberKey = Object.keys(orchestrator.registry.testComponent.members).filter(
      (memberKey) => memberKey !== orchestrator.endpoint
    )[0];
    let client2other = orchestrator.registry.testComponent.members[otherMemberKey].client;
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
          errors.push(new Error(`Duplicate connections at MESH_${index}: ${dupes}`));
        } else {
          errors.push(new Error(`Insufficients connections at MESH_${index}: ${dupes}`));
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
    let meshNames = indices.map((index) => `MESH_${index}`);

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
        test.expect(details.peerEndpoints.length).to.eql(clusterSize);
        test
          .expect(test._.isEqual(details.members.sort(), details.peerEndpoints.sort()))
          .to.be(true);
      } catch (e) {
        errored = true;
        errors.push(new Error(`Member/peer mismatch at MESH_${i}`));
      }
    }

    if (errored) {
      throw new Error('Test failed due to peer/member mismatch (some membersin unstable state)');
    }
  }
  const findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);
});
