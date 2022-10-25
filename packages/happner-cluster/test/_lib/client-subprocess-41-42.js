const testclient = require('./client');
const getSeq = require('./helpers/getSeq');
const delay = require('await-delay');
let testClients = [];
let port = parseInt(process.argv[2]);
let responsePromises = [];
const test = require('happn-commons-test').create();

(async () => {
  for (let i = 0; i < 4; i++) {
    let id = Date.now().toString().slice(-5);
    let client = await testclient.create('username', 'password', port);
    testClients.push({
      id,
      client,
    });
  }
  for (let i = 0; i < 4; i++) {
    let id = Date.now().toString().slice(-5);
    let client = await testclient.create('username', 'password', port + 1);
    testClients.push({
      id,
      client,
    });
  }
  for (let i = 0; i < 200; i++) {
    for (let tc of testClients) {
      try {
        if (tc && tc.client) {
          let promise = tc.client?.exchange?.busyComponent?.setData(tc.id + '-' + i.toString());
          responsePromises.push(promise);
        }
      } catch (e) {
        await delay(5);
        continue;
      }
      await delay(5);
    }
  }
  test.expect(responsePromises.length).to.be(1600);
  let resolved = 0,
    rejected = 0;
  let uniqueRemoteNodeIds = [];
  for (let prom of responsePromises) {
    await Promise.resolve(prom)
      .then((res) => {
        if (res) {
          test.expect(res.startsWith('data/busy')).to.be(true);
          resolved++;
          let nodeId = res.split('/')[2];
          if (!uniqueRemoteNodeIds.includes(nodeId)) uniqueRemoteNodeIds.push(nodeId);
        }
      })
      .catch((rej) => {
        test.expect(rej).to.be('Request timed out');
        rejected++;
      });
  }

  test.expect(resolved + rejected <= 1600).to.be(true);
  test.expect(uniqueRemoteNodeIds.length).to.be(2);
  console.log(uniqueRemoteNodeIds);
  await test.delay(5000)
  let newNodeIds;

  for (let tc of testClients) {
    let responses = [];
    for (i = 0; i < 6; i++) {
      let promise = tc.client.exchange.busyComponent.setData(tc.id + '-' + i.toString());
      responses.push(promise);
    }
    responses = await Promise.all(responses);
    console.log(responses)
    let nodeIds = responses.reduce((arr, current) => {
      let id = current.split('/')[2];
      if (!arr.includes(id)) arr.push(id);
      return arr;
    }, []);
    // test.expect(nodeIds.length).to.be(2);
    console.log(nodeIds.length);
    console.log(nodeIds);

    // test.expect(test._.isEqual(nodeIds, uniqueRemoteNodeIds)).to.be(false);
    // if (!newNodeIds) newNodeIds = nodeIds;
    // test
    //   .expect(test._.isEqual(nodeIds, newNodeIds) || test._.isEqual(nodeIds.reverse(), newNodeIds))
    //   .to.be(true);
  }
  process.send('ok');
})();
