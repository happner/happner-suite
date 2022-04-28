/* eslint-disable no-console */
const HappnerClient = require('happner-client');
const Mesh = require('../../..');
const commander = require('commander');

commander
  .option('--clients [number]', 'clients count')
  .option('--calls [number]', 'method calls')
  .option('--events [number]', 'event emits')
  .option('--interval [number]', 'activity interval')
  .option('--ports [string]', 'ports commaseparated')
  .parse(process.argv);

commander.ports = commander.ports || '55001';
commander.clients = parseInt(commander.clients || 1);
commander.calls = parseInt(commander.calls || 1);
commander.events = parseInt(commander.events || 1);
commander.interval = parseInt(commander.interval || 1000);

var ports = commander.ports.split(',');
var totalEventsEmitted = 0;
var totalWebCalls = 0;
var totalDataCalls = 0;
var totalMethodCalls = 0;
var totalEventsEmittedPrevious = 0;
var totalWebCallsPrevious = 0;
var totalDataCallsPrevious = 0;
var totalMethodCallsPrevious = 0;
var totalLookupTableCalls = 0;
var totalLookupTableCallsErrors = 0;
var totalLookupTableCallsPrevious = 0;
var totalLookupTableCallsErrorsPrevious = 0;
var HashRing = require('hashring');
var randomPort = new HashRing();

console.log(`ACTIVITY: ${process.pid}`);

ports.forEach((port) => {
  randomPort.add(port);
});

createClients()
  .then((clients) => {
    return startActivity(clients);
  })
  .then(() => {
    console.log('STARTED ACTIVITY...');
  });

function failAndExit(e) {
  console.log('FAILED:::', e.message);
  console.log(e.stack);
  process.exit(1);
}

let description;
function getDescription(api) {
  return new Promise((resolve) => {
    if (description) return resolve(description);
    api.data.get('/mesh/schema/description', (e, schema) => {
      if (e) return failAndExit(e);
      description = schema;
      return resolve(description);
    });
  });
}

function addUserPermissions(api, user, callback) {
  api.exchange.security.addUserPermissions(
    user.username,
    {
      methods: {
        'DOMAIN_NAME/remoteComponent1/testJSON': { authorized: true },
        'DOMAIN_NAME/remoteComponent1/brokeredMethod1': { authorized: true },
      },
      events: {
        'DOMAIN_NAME/remoteComponent1/*': { authorized: true },
      },
      data: {
        '/_data/set/test/{{custom_data.allowed}}': {
          actions: ['get', 'set', 'on'],
          authorized: true,
        },
      },
    },
    callback
  );
}

async function addGroupAndLookupTablePermissions(api, user, callback) {
  try {
    let testTable = {
      name: 'STANDARD_ABC',
      paths: [
        '/lookup-path/7/1',
        '/lookup-path/6/1',
        '/lookup-path/5/2',
        '/lookup-path/4/2',
        '/lookup-path/3/3',
        '/lookup-path/2/3',
        '/lookup-path/1/4',
      ],
    };
    let permission = {
      regex: '^/test-lookup-table/(.*)',
      actions: ['get', 'set'],
      table: 'STANDARD_ABC',
      path: '/lookup-path/{{user.custom_data.allowed}}/{{$1}}',
    };
    let testGroup = {
      name: 'LOOKUP_TABLES_GRP',
      permissions: {},
    };
    const testGroupSaved = await api.exchange.security.upsertGroup(testGroup);
    await api.exchange.security.upsertLookupTable(testTable);
    await api.exchange.security.upsertLookupPermission(testGroupSaved.name, permission);
    await api.exchange.security.linkGroup(testGroupSaved, user);
    callback();
  } catch (e) {
    callback(e);
  }
}

let usersCount = 0;

function createUser() {
  const client = new HappnerClient();
  const port = randomPort.get(Date.now());
  return new Promise((resolve) => {
    client.connect(
      null,
      {
        username: '_ADMIN',
        password: 'happn',
        port,
      },
      (e) => {
        if (e) return failAndExit(e);
        const api = client.construct({
          security: {
            version: '*',
            methods: {
              upsertUser: {},
              addUserPermissions: {},
              upsertGroup: {},
              upsertLookupTable: {},
              upsertLookupPermission: {},
              linkGroup: {},
            },
          },
        });
        const user = {
          username: `users-${usersCount++}`,
          password: 'password',
          custom_data: { allowed: [1, 2, 3, 4, 5, 6, 7] },
        };
        api.exchange.security.upsertUser(user, (e) => {
          if (e) return failAndExit(e);
          addUserPermissions(api, user, (e) => {
            if (e) return failAndExit(e);
            addGroupAndLookupTablePermissions(api, user, (e) => {
              if (e) return failAndExit(e);
              resolve(user);
            });
          });
        });
      }
    );
  });
}

function createClient() {
  return new Promise((resolve) => {
    createUser().then((user) => {
      const client = new HappnerClient();
      const port = randomPort.get(Date.now());
      client.connect(
        null,
        {
          username: user.username,
          password: user.password,
          port,
        },
        (e) => {
          if (e) return failAndExit(e);
          const data = client.dataClient();
          const api = { data };
          getDescription(api).then((schema) => {
            api.happner = client.construct(schema.components);
            //console.log('COMPONENTS', JSON.stringify(schema.components, null, 2));
            api.port = port;
            api.token = api.data.session.token;
            api.happner.event.remoteComponent1.on(
              'test/*',
              () => {
                totalEventsEmitted++;
              },
              () => {
                resolve([api, data]);
              }
            );
          });
        }
      );
    });
  });
}

function doRequest(path, client) {
  return new Promise((resolve, reject) => {
    var request = require('request');
    var options;

    options = {
      url: `http://127.0.0.1:${client.port}${path}?happn_token=${client.token}`,
    };

    request(options, function (error, response, body) {
      if (error) return reject(error);
      resolve({
        response,
        body,
      });
    });
  });
}

async function createClients() {
  const createdClients = [];
  for (var i = 0; i < commander.clients; i++) {
    createdClients.push(await createClient());
  }
  return createdClients;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let callIndex = 0;

function startActivity(clients) {
  callIndex++;
  clients.forEach(([client, data]) => {
    // client.happner.exchange.data.set('test/1', { totalDataCalls }, (e) => {
    //   if (e) return failAndExit(e);
    //   totalMethodCalls++;
    // });
    const lookupTablePath = `/test-lookup-table/${getRandomInt(0, 5)}`;
    //console.log(`lookup table path: ${lookupTablePath}`);
    data.set(lookupTablePath, { totalLookupTableCalls }, (e) => {
      if (e) {
        //console.log(`lookup failure: ${e.message} successes ${totalLookupTableCalls}`);
        return totalLookupTableCallsErrors++;
      }
      totalLookupTableCalls++;
    });
    client.happner.exchange.remoteComponent1.brokeredMethod1(callIndex, (e) => {
      if (e) return failAndExit(e);
      totalDataCalls++;
    });
    doRequest('/remoteComponent1/testJSON', client)
      .then(() => {
        totalWebCalls++;
      })
      .catch((e) => {
        console.log('web method failed...', e);
      });
  });
  setTimeout(() => {
    startActivity(clients);
  }, commander.interval);
}
setInterval(() => {
  console.log(
    `total totalLookupTableCalls:::${totalLookupTableCalls}, per sec: ${
      (totalLookupTableCalls - totalLookupTableCallsPrevious) / 5
    }`
  );

  console.log(
    `total totalLookupTableCallsErrors:::${totalLookupTableCallsErrors}, per sec: ${
      (totalLookupTableCallsErrors - totalLookupTableCallsErrorsPrevious) / 5
    }`
  );

  console.log(
    `total events emitted calls:::${totalEventsEmitted}, per sec: ${
      (totalEventsEmitted - totalEventsEmittedPrevious) / 5
    }`
  );
  console.log(
    `total data calls:::${totalDataCalls}, per sec: ${
      (totalDataCalls - totalDataCallsPrevious) / 5
    }`
  );
  console.log(
    `total web calls:::${totalWebCalls}, per sec: ${(totalWebCalls - totalWebCallsPrevious) / 5}`
  );
  console.log(
    `total method calls:::${totalMethodCalls}, per sec: ${
      (totalMethodCalls - totalMethodCallsPrevious) / 5
    }`
  );
  totalEventsEmittedPrevious = totalEventsEmitted;
  totalWebCallsPrevious = totalWebCalls;
  totalDataCallsPrevious = totalDataCalls;
  totalMethodCallsPrevious = totalMethodCalls;
  totalLookupTableCallsPrevious = totalLookupTableCalls;
  totalLookupTableCallsErrorsPrevious = totalLookupTableCallsErrors;
}, 5e3);
