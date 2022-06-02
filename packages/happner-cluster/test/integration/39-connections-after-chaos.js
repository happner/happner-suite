const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();

const clearMongoCollection = require('../_lib/clear-mongo-collection');
const Helper = require('../_lib/helpers/helper');

require('../_lib/test-helper').describe({ timeout: 600e3 }, (test) => {
  const _ = test._;
  let _AdminClient;
  let nodeConfigs = [];
  let testClients = [];
  let meshNames = [];
  let clusterSize = 7;
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
    await users.allowMethod(_AdminClient, 'username', 'testComponent', 'subscribeSecondEvent');

    
    for (let i = 1; i <= clusterSize; i++) {
      testClients.push(await testclient.create('username', 'password', getSeq.getPort(i)));
    }
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
    await retestConnectionsAfterDelayWrapper(async () => {
      blockNode(5, 1000);
      await test.delay(15e3);
      await testConnections();
      await checkPeers();
    });
  });
  it('short kill', async () => {
    await retestConnectionsAfterDelayWrapper(async () => {
      await restartNode(5, 0);
      await test.delay(10e3);
      await testConnections();
      await checkPeers();
    });
  });

  it('long block', async () => {
    await retestConnectionsAfterDelayWrapper(async () => {
      blockNode(5, 5000);
      await test.delay(20e3);
      await testConnections();
      await checkPeers();
    });
  });

  it('long kill', async () => {
    await retestConnectionsAfterDelayWrapper(async () => {
      await restartNode(5, 5000);
      await test.delay(10e3);
      await testConnections();
      await checkPeers();
    });
  });

  it('longest block', async () => {
    await retestConnectionsAfterDelayWrapper(async () => {
      blockNode(5, 8e3);
      await test.delay(15e3);
      await testConnections();
      await checkPeers();
    });
  });
  
  it('longest block with early test', async () => {
    await retestConnectionsAfterDelayWrapper(async () => {
      blockNode(5, 8e3);
      await test.delay(10e3);
      try {
        await testConnections();
        await checkPeers();
      } catch (e) {
        console.log('EXPECTE ERROR', e.err.toString());
        test
          .expect(e.err.toString())
          .to.eql('Error: Test failed due to duplicate or insufficient connections');
        e.errors.forEach((error) =>
          test.expect(error.toString().startsWith('Error: Insufficients connections')).to.be(true)
        );
      }
      await test.delay(10e3);
      await testConnections();
      await checkPeers();
    });
  });
  it('longest kill', async () => {
    await retestConnectionsAfterDelayWrapper(async () => {
      await restartNode(5, 8000);
      await test.delay(8000);
      await testConnections();
      await checkPeers();
    });
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

  // it('controlled chaos', async () => {
  //   blockNode(1);
  //   await test.delay(14e3);
  //   await testConnections();
  //   blockNode(2);
  //   await test.delay(14e3);
  //   await testConnections();
  // });

  // it('controlled chaos', async () => {
  //   let restartClientPromises = [];
  //   let indices = Array.from(Array(clusterSize).keys());
  //   let nodes2change = [0, 1, 2]; //_.sampleSize(indices, 3);
  //   for (let index of nodes2change) {
  //     index > 0 /*Math.random() < 0.5*/
  //       ? restartClientPromises.push(restartNode(index))
  //       : blockNode(index);
  //   }
  //   await test.delay(12000);
  //   // await testConnections();
  //   // await Promise.all(restartClientPromises);
  //   restartClientPromises = [];
  //   nodes2change = [3, 4, 5]; //_.sampleSize(indices, 3);

  //   for (let index of nodes2change) {
  //     index > 4 /* Math.random() < 0.5 */
  //       ? restartClientPromises.push(restartNode(index))
  //       : blockNode(index);
  //   }
  //   await test.delay(12000);
  //   // await Promise.all(restartClientPromises);
  //   await testConnections();
  //   await testConnections();
  // });

  // it.only('major chaost', async () => {
  //   // blockNode(1, 2000);
  //   // blockNode(2, 3000);
  //   await restartNode(0, 7000);

  //   await test.delay(17000);
  //   await testConnections();
  // });
  // it('major chaost', async () => {
  //   // let restartClientPromises = [];
  //   // let indices = Array.from(Array(clusterSize).keys());
  //   // let nodes2change = [0, 1, 2]; //_.sampleSize(indices, 3);
  //   // for (let index of nodes2change) {
  //   //   index > 0 /*Math.random() < 0.5*/
  //   //     ? restartNode(index)
  //   //     : blockNode(index);
  //   // }
  //   restartNode(0);
  //   blockNode(1);
  //   blockNode(2);

  //   await test.delay(15e3);

  //   // await Promise.all(restartClientPromises);
  //   // restartClientPromises = [];
  //   // nodes2change = [3, 4, 5]; //_.sampleSize(indices, 3);
  //   blockNode(3);
  //   blockNode(4);
  //   restartNode(5);
  //   // for (let index of nodes2change) {
  //   //   index > 4 /* Math.random() < 0.5 */ ? restartNode(index) : blockNode(index);
  //   // }
  //   await test.delay(15e3);
  //   // await Promise.all(restartClientPromises);
  //   await testConnections();
  //   await checkPeers();
  //   let members = await clusterHelper.listMembers(1);
  //   console.log(members);
  // });

  // it('major chaos, longer delays', async () => {
  //   let delay = 10000;
  //   let indices = Array.from(Array(clusterSize).keys());

  //   let nodes2change = _.sampleSize(indices, 4);
  //   console.log({ nodes2change });

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(25000);
  //   await testConnections();

  //   nodes2change = _.sampleSize(indices, 4);
  //   console.log({ nodes2change });

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(25000);
  //   await testConnections();

  //   nodes2change = _.sampleSize(indices, 4);
  //   // console.log({ nodes2change });

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(25000);
  //   await testConnections();
  // });

  // it('major chaos, roughly simultaneous arrive/depart', async () => {
  //   let delay = 8000;
  //   let pick = 3;
  //   let indices = Array.from(Array(clusterSize).keys());
  //   let nodes2change = pickNexcluding(indices, pick, []);
  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(delay);
  //   nodes2change = pickNexcluding(indices, pick, nodes2change);
  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(delay);
  //   nodes2change = pickNexcluding(indices, pick, nodes2change);
  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(delay);
  //   nodes2change = pickNexcluding(indices, pick, nodes2change);

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(17000);
  //   await testConnections();

  //   nodes2change = pickNexcluding(indices, pick, nodes2change);

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(delay);
  //   nodes2change = pickNexcluding(indices, pick, nodes2change);

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(delay);
  //   nodes2change = pickNexcluding(indices, pick, nodes2change);

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   nodes2change = pickNexcluding(indices, pick, nodes2change);

  //   for (let index of nodes2change) {
  //     Math.random() < 0.5 ? restartNode(index, delay) : blockNode(index, delay);
  //   }
  //   await test.delay(17000);
  //   await testConnections();
  // });

  async function testConnections() {
    for (let client of testClients) {
      await client.exchange.testComponent.clearEvents();
      // console.log('CLEARED ', index);
    }
    await test.delay(1000);
    for (let [index, client] of testClients.entries()) {
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
  async function checkPeers() {
    let errored = false;
    let errors = [];
    for (let i = 0; i < clusterSize; i++) {
      try {
        let details = await clusterHelper.listMembers(i);
        test.expect(details.members.length).to.eql(clusterSize);
        test.expect(details.peers.length).to.eql(clusterSize);
        test.expect(details.peerEndpoints.length).to.eql(clusterSize);
        test
          .expect(test._.isEqual(details.members.sort(), details.peerEndpoints.sort()))
          .to.be(true);
      } catch (e) {
        errored = true;
        errors.push(new Error(`Member/peer mismatch at ${getSeq.getMeshName(i + 1)}`));
      }
    }
    if (errored) {
      console.log(errors);
      throw new Error('Test failed due to peer/member mismatch (some membersin unstable state)');
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

  async function blockNode(index, delay = 8e3) {
    await testClients[index].exchange.testComponent.block(delay);
  }

  function pickNexcluding(arr, n, exclude) {
    let eligible = arr.filter((x) => !exclude.includes(x));
    return _.sampleSize(eligible, n);
  }
  const findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);
});
