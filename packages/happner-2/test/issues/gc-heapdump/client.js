const CLIENT_COUNT = 10;
const CYCLES = 80;
const test = require('../../__fixtures/utils/test_helper').create();
async function start() {
  let clients = await connectClients();
  for (let ii = 0; ii < CYCLES; ii++) {
    test.log(`running cycle ${ii} / ${CYCLES}`);
    var i = 1;
    for (let client of clients) {
      try {
        await client.exchange.component.method1();
        //await doRestCall(client);
      } catch (e) {
        test.log(`error  on request: `, e.message);
      }
      test.log(`called method ${i} times...`);
      await test.delay(10);
      i++;
    }
    await doHeapDump(clients[0]);
  }
  test.log('waiting 30 secs');
  await test.delay(30e3);
  await doHeapDump(clients[0]);
  test.log('did final dump');
}
async function doHeapDump(client) {
  try {
    await client.exchange.component.doHeapDump();
  } catch (e) {
    test.log('heap dump may have failed: ', e.message);
  }
}
async function doRestCall(client) {
  const restClient = require('restler');
  return new Promise((resolve, reject) => {
    restClient
      .postJson(
        'http://127.0.0.1:55000/rest/method/component/method1?happn_token=' + client.token,
        {
          parameters: {},
        }
      )
      .on('complete', function (result) {
        if (result.error) {
          return reject(result.error);
        }
        resolve();
      });
  });
}
async function connectClients() {
  let clients = [];
  let adminClient = new test.Mesh.MeshClient({ secure: true });
  await adminClient.login({ username: '_ADMIN', password: 'happn' });
  for (let i = 0; i < CLIENT_COUNT; i++) {
    clients.push(await createAndConnectClient(i, adminClient));
  }
  return clients;
}
async function createAndConnectClient(index, adminClient) {
  const testGroupAdded = await adminClient.exchange.security.upsertGroup({
    name: 'TEST GROUP' + index,
    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/component/*': { authorized: true },
      },
      events: {
        //in a /Mesh name/component name/event key - with possible wildcards
        '/meshname/component/*': { authorized: true },
      },
    },
  });
  const testUserAdded = await adminClient.exchange.security.upsertUser({
    username: 'user' + index,
    password: 'password',
  });
  await adminClient.exchange.security.linkGroup(testGroupAdded, testUserAdded);
  let testClient = new test.Mesh.MeshClient({ secure: true });
  await testClient.login({ username: 'user' + index, password: 'password' });
  return testClient;
}

start();
