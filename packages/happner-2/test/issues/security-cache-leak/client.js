const CLIENT_COUNT = 10;
const test = require('../../__fixtures/utils/test_helper').create();
async function start() {
  let clients = await connectClients();
  var i = 0;
  for (let ii = 0; ii < 5; ii++) {
    for (let client of clients) {
      try {
        //await client.exchange.component.method1();
        await doRestCall(client);
      } catch (e) {
        test.log(`error  on request: `, e.message);
      }
      if (i % 10 === 0) {
        test.log(`called method ${i} times...`);
      }
      await test.delay(100);
      i++;
    }
    await clients[0].exchange.component.doHeapDump();
  }
  test.log('waiting 30 secs');
  await test.delay(30e3);
  await clients[0].exchange.component.doHeapDump();
  test.log('did final dump');
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
