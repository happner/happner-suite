const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();

const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 180e3 }, (test) => {
  const _ = test._;
  let _AdminClient;
  let nodeConfigs = [];
  let testClients = [];
  let meshNames = [];
  let clusterSize = 6;
  let servers;

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
          path: libDir + 'integration-39-local-component',
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

    for (let i = 1; i <= clusterSize; i++) {
      testClients.push(await testclient.create('username', 'password', getSeq.getPort(i)));
    }
    // return Promise.all(testClients);
  });
  after('disconnect _ADMIN client', async () => {
    await _AdminClient.disconnect();
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
    blockNode(5, 1000);
    await test.delay(4000);
    await testConnections();
  });

  it('short kill', async () => {
    restartNode(5, 0);
    await test.delay(12000);
    await testConnections();
  });

  it('minor chaos', async () => {
    restartNode(1);
    restartNode(3);
    blockNode(6);
    await test.delay(12000);
    await testConnections();
  });

  it('major chaost', async () => {
    let restartClientPromises = [];
    let indices = Array.from(Array(clusterSize).keys());
    let nodes2change = [1, 2]; //_.sampleSize(indices, 4);
    for (let index of nodes2change) {
      index / 3 < 0.5 ? restartClientPromises.push(restartNode(index)) : blockNode(index);
    }
    await test.delay(12000);
    await Promise.all(restartClientPromises);
    restartClientPromises = [];
    // nodes2change = _.sampleSize(indices, 4);

    for (let index of nodes2change) {
      index / 3 < 0.5 ? blockNode(index) : restartClientPromises.push(restartNode(index));
    }
    await test.delay(12000);
    await Promise.all(restartClientPromises);
    await testConnections();
  });

  it('controlled chaos', async () => {
    blockNode(1, 4000);
    blockNode(2, 4000);

    await test.delay(11000);
    await testConnections();
    blockNode(3, 4000);
    await test.delay(11000);
    await testConnections();
    // await test.delay(8000);
    // await testConnections();
    // await test.delay(30000);
    // await testConnections();
  });


  it.only('controlled chaos', async () => {
    blockNode(1);
    await test.delay(12e3);
    await testConnections();
    blockNode(2);
    await test.delay(12e3);
    await testConnections();
  });

  it('controlled chaos', async () => {
    let restartClientPromises = [];
    let indices = Array.from(Array(clusterSize).keys());
    let nodes2change = [0, 1, 2]; //_.sampleSize(indices, 3);
    for (let index of nodes2change) {
      index > 0 /*Math.random() < 0.5*/
        ? restartClientPromises.push(restartNode(index))
        : blockNode(index);
    }
    await test.delay(12000);
    // await testConnections();
    // await Promise.all(restartClientPromises);
    restartClientPromises = [];
    nodes2change = [3, 4, 5]; //_.sampleSize(indices, 3);

    for (let index of nodes2change) {
      index > 4 /* Math.random() < 0.5 */
        ? restartClientPromises.push(restartNode(index))
        : blockNode(index);
    }
    await test.delay(12000);
    // await Promise.all(restartClientPromises);
    await testConnections();
    await testConnections();
  });

  it('major chaost', async () => {
    let restartClientPromises = [];
    let indices = Array.from(Array(clusterSize).keys());
    let nodes2change = [0, 1, 2]; //_.sampleSize(indices, 3);
    for (let index of nodes2change) {
      index > 0 /*Math.random() < 0.5*/
        ? restartClientPromises.push(restartNode(index))
        : blockNode(index);
    }
    await test.delay(12000);

    // await Promise.all(restartClientPromises);
    restartClientPromises = [];
    nodes2change = [3, 4, 5]; //_.sampleSize(indices, 3);

    for (let index of nodes2change) {
      index > 4 /* Math.random() < 0.5 */
        ? restartClientPromises.push(restartNode(index))
        : blockNode(index);
    }
    await test.delay(12000);
    // await Promise.all(restartClientPromises);
    await testConnections();
    await testConnections();
  });

  it('major chaos, longer delays', async () => {
    let delay = 10000;
    let indices = Array.from(Array(clusterSize).keys());

    let nodes2change = _.sampleSize(indices, 4);
    console.log({ nodes2change });

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(25000);
    await testConnections();

    nodes2change = _.sampleSize(indices, 4);
    console.log({ nodes2change });

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(25000);
    await testConnections();

    nodes2change = _.sampleSize(indices, 4);
    // console.log({ nodes2change });

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(25000);
    await testConnections();
  });

  it('major chaos, roughly simultaneous arrive/depart', async () => {
    let delay = 8000;
    let pick = 3;
    let indices = Array.from(Array(clusterSize).keys());
    let nodes2change = pickNexcluding(indices, pick, []);
    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(delay);
    nodes2change = pickNexcluding(indices, pick, nodes2change);
    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(delay);
    nodes2change = pickNexcluding(indices, pick, nodes2change);
    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(delay);
    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(17000);
    await testConnections();

    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(delay);
    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(delay);
    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    nodes2change = pickNexcluding(indices, pick, nodes2change);

    for (let index of nodes2change) {
      Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
    }
    await test.delay(17000);
    await testConnections();
  });

  async function testConnections() {
    for (let client of testClients) {
      await client.exchange.testComponent.clearEvents();
      // console.log('CLEARED ', index);
    }
    await test.delay(1000);
    for (let [index, client] of testClients.entries()) {
      // console.log('FIRING ', index);
      await client.exchange.testComponent.fireEvent();
      await test.delay(300);
    }
    await test.delay(1000);
    // console.log(testClients.length);
    let errored = false;
    for (let [index, client] of testClients.entries()) {
      let events = await client.exchange.testComponent.getEvents();
      let connected = events.map((event) => event.split(':')[0]);
      try {
        test.expect(_.isEqual(connected, meshNames)).to.be(true);
      } catch (e) {
        errored = true;
        console.log('ERROR at index ', index);
        console.log({ connected, meshNames });
        let dupes = findDuplicates(connected).map((dupe) => dupe.split('_')[1]);
        console.log('dupes at ', index, ' : ', dupes);
        // throw e;
        // let keys = await clusterHelper.listMembers(index);
        // console.log('MEMVERS AT NODE ', keys);
        // for (let index of dupes) {
        //   let keys = await clusterHelper.listMembers(index);
        //   // console.log('MEMVERS AT DUPE ', index, keys);
        // }
      }
    }
    if (errored) {
      throw new Error('Failed');
    }
  }

  async function restartNode(index, restartDelay = 5000) {
    testClients[index] = null;
    console.log('RESTARTING NODE ', index);
    let stopped = await clusterHelper.stopChild(index);
    if (stopped !== true) throw new Error('FAILED TO STOP NODE');
    await test.delay(restartDelay);
    servers[index] = await clusterHelper.start(nodeConfigs[index], index);
    testClients[index] = await testclient.create('username', 'password', getSeq.getPort(index + 1));
  }

  async function blockNode(index, delay = 8000) {
    try {
      console.log('BLOCKING NODE ', index);
      await testClients[index].exchange.testComponent.block(delay);
    } catch (e) {
      console.log('CAUGHT', e);
    }
  }
  function pickNexcluding(arr, n, exclude) {
    let eligible = arr.filter((x) => !exclude.includes(x));
    return _.sampleSize(eligible, n);
  }
  const findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);
});
