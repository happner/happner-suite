const libDir = require('../../_lib/lib-dir');
const baseConfig = require('../../_lib/base-config');
const users = require('../../_lib/users');
const testclient = require('../../_lib/client');
const getSeq = require('../../_lib/helpers/getSeq');
const clusterHelper = require('../../_lib/helpers/multiProcessClusterManager').create();
const clearMongoCollection = require('../../_lib/clear-mongo-collection');

require('../../_lib/test-helper').describe({ timeout: 600e3 }, (test) => {
  const _ = test._;
  let _AdminClient,
    nodeConfigs = [],
    testClients = [],
    meshNames = [],
    clusterSize = 8,
    servers,
    proxyPorts,
    killedPorts = [];

  before('clear mongo collection', (done) => {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  before('start cluster', async () => {
    const serverPromises = [];
    for (let i = 0; i < clusterSize; i++) {
      const remoteComponent = baseConfig(i, 2, true);
      remoteComponent.happn.services.orchestrator.config.serviceName = 'testComponent';
      remoteComponent.happn.services.orchestrator.config.cluster = { testComponent: clusterSize };
      remoteComponent.happn.services.cache.config.statisticsInterval = 0;
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
    }
    servers = await Promise.all(serverPromises);
    proxyPorts = await clusterHelper.getPorts();
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

  it('short block', async () => {
    blockNode(5, 1e3);
    await test.delay(5e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 5]);
  });
  it('short kill', async () => {
    await restartNode(5, 3e3);
    await test.delay(5e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 5]);
  });

  it('longer block', async () => {
    blockNode(5, 5e3);
    await test.delay(9e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 5]);
  });

  it('longer kill', async () => {
    await restartNode(5, 5e3);
    await test.delay(5e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 5]);
  });

  it('longest block', async () => {
    blockNode(5, 8e3);
    await test.delay(14e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 5]);
  });

  it('longest block with early test', async () => {
    blockNode(5, 8e3);
    await test.delay(10e3);
    try {
      await testConnections();
      await checkPeers();
    } catch (e) {
      //Expected error => Nodes will not have (fully) re-connected yet
      test
        .expect(e.err.toString())
        .to.eql('Error: Test failed due to duplicate or insufficient connections');
      e.errors.forEach((error) =>
        test.expect(error.toString().startsWith('Error: Insufficients connections')).to.be(true)
      );
    }
    await test.delay(7e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 5]);
  });
  it('longest kill', async () => {
    await restartNode(5, 8e3);
    await test.delay(5e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 5]);
  });

  it('block block', async () => {
    blockNode(1);
    await test.delay(12e3);
    await testConnections();
    blockNode(2);
    await test.delay(12e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 2, 5]);
  });

  it('kill kill', async () => {
    await restartNode(1, 5e3);
    await test.delay(7e3);
    await testConnections();
    await restartNode(2, 5e3);
    await test.delay(7e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 2, 5]);
  });

  it('block kill', async () => {
    blockNode(1);
    await test.delay(10e3);
    await testConnections();
    await restartNode(2, 5e3);
    await test.delay(7e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 2, 5]);
  });

  it('kill block', async () => {
    await restartNode(1, 5e3);
    await test.delay(7e3);
    await testConnections();
    blockNode(2);
    await test.delay(12e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([1, 2, 5]);
  });

  it('multiple changes at once ', async () => {
    restartNode(1);
    restartNode(3);
    blockNode(6);
    await test.delay(15e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions([0, 1, 3, 6]);
  });

  it('minor chaos', async () => {
    let indices = Array.from(Array(clusterSize).keys());
    let nodes2change = _.sampleSize(indices, 3);
    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index) : blockNode(index);
    }
    await test.delay(15e3);
    await testConnections();

    nodes2change = _.sampleSize(indices, 3);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index) : blockNode(index);
    }
    await test.delay(15e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions();
  });

  it('major chaos, longer delays', async () => {
    let delay = 10e3;
    let indices = Array.from(Array(clusterSize).keys());
    let nodes2change = _.sampleSize(indices, 3);
    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(25e3);
    await testConnections();
    await checkPeers();
    nodes2change = _.sampleSize(indices, 3);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(25e3);
    await testConnections();
    await checkPeers();

    nodes2change = _.sampleSize(indices, 3);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(25e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions();
  });

  it('major chaos, roughly simultaneous arrive/depart', async () => {
    let restartPromises = [];
    let delay = 12e3;
    let restartDelay = 4e3;
    let pick = 3;
    let indices = Array.from(Array(clusterSize).keys());
    let nodes2change = pickNexcluding(indices, pick, []);
    for (let index of nodes2change) {
      Math.random() < 0.5
        ? restartPromises.push(restartNode(index, restartDelay))
        : blockNode(index, delay);
    }
    await test.delay(delay);
    await Promise.all(restartPromises); //Need to ensure all nodes have a user client
    restartPromises = [];
    nodes2change = pickNexcluding(indices, pick, nodes2change);
    for (let index of nodes2change) {
      Math.random() < 0.5
        ? restartPromises.push(restartNode(index, restartDelay))
        : blockNode(index, delay);
    }
    await test.delay(delay);
    await Promise.all(restartPromises);
    restartPromises = [];
    nodes2change = pickNexcluding(indices, pick, nodes2change);
    for (let index of nodes2change) {
      Math.random() < 0.5
        ? restartPromises.push(restartNode(index, restartDelay))
        : blockNode(index, delay);
    }
    await test.delay(delay);
    await Promise.all(restartPromises);
    restartPromises = [];
    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5
        ? restartPromises.push(restartNode(index, restartDelay))
        : blockNode(index, delay);
    }
    await test.delay(25e3);
    await testConnections();
    await checkPeers();
    await testNewSubscriptions();

    nodes2change = pickNexcluding(indices, pick, []);

    for (let index of nodes2change) {
      Math.random() < 0.5
        ? restartPromises.push(restartNode(index, restartDelay))
        : blockNode(index, delay);
    }
    await test.delay(delay);
    await Promise.all(restartPromises);
    restartPromises = [];
    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5
        ? restartPromises.push(restartNode(index, restartDelay))
        : blockNode(index, delay);
    }
    await test.delay(delay);
    await Promise.all(restartPromises);
    restartPromises = [];
    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5
        ? restartPromises.push(restartNode(index, restartDelay))
        : blockNode(index, delay);
    }
    await test.delay(25e3);
    await Promise.all(restartPromises); //Shouldn't be necessary, just in case
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
      // eslint-disable-next-line no-console
      console.log(errors);
      throw new Error('Test failed due to duplicate or insufficient connections');
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
    for (let i = 0; i < clusterSize; i++) {
      try {
        let details = await clusterHelper.listMembers(i);
        test.expect(details.members.length).to.be.above(clusterSize - 1);
        test.expect(details.peers.length).to.be(clusterSize);
        test.expect(details.peerEndpoints.length).to.be(clusterSize);
        test
          .expect(
            details.peerEndpoints.every((peerEndpoint) => details.members.includes(peerEndpoint))
          )
          .to.be(true); // Killed nodes endpoints will still be listed as members.
      } catch (e) {
        console.log(e);
        errored = true;
        errors.push(new Error(`Member/peer mismatch at ${getSeq.getMeshName(i + 1)}`));
      }
    }
    if (errored) {
      console.log(JSON.stringify(errors, null, 2));
      throw new Error('Test failed due to peer/member mismatch (some members in unstable state)');
    }
  }
  async function restartNode(index, restartDelay = 5000) {
    testClients[index] = null;
    let stopped = await clusterHelper.stopChild(index);
    if (stopped !== true) throw new Error('FAILED TO STOP NODE');

    await test.delay(restartDelay);
    servers[index] = await clusterHelper.start(nodeConfigs[index], index);
    await test.delay(2e3);
    killedPorts.push(proxyPorts[index]);
    proxyPorts[index] = (await clusterHelper.getPorts(index))[0];
    testClients[index] = await testclient.create('username', 'password', proxyPorts[index]);
  }

  async function blockNode(index, delay = 8e3) {
    await testClients[index].exchange.testComponent.block(delay);
  }

  function pickNexcluding(arr, n, exclude) {
    let eligible = arr.filter((x) => !exclude.includes(x));
    return _.sampleSize(eligible, n);
  }
  const findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);
});
