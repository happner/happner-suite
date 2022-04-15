/* eslint-disable no-console */
const HappnerClient = require('happner-client');
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
var totalEmits = 0;
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
            },
          },
        });
        const user = {
          username: `users-${usersCount++}`,
          password: 'password',
          custom_data: { allowed: [1, 2, 3, 4, 5] },
        };
        api.exchange.security.upsertUser(user, (e) => {
          if (e) return failAndExit(e);
          api.exchange.security.addUserPermissions(
            user.username,
            {
              methods: {
                'DOMAIN_NAME/data/set': { authorized: true },
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
            (e) => {
              if (e) return failAndExit(e);
              console.log('RESOLVED:::', user);
              resolve(user);
            }
          );
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
          const api = { data: client.dataClient() };
          getDescription(api).then((schema) => {
            api.happner = client.construct(schema.components);
            console.log('COMPONENTS', JSON.stringify(schema.components, null, 2));
            api.port = port;
            api.token = api.data.session.token;
            api.happner.event.remoteComponent1.on(
              'test/*',
              () => {
                totalEventsEmitted++;
              },
              () => {
                resolve(api);
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

function startActivity(clients) {
  clients.forEach((client) => {
    client.happner.exchange.data.set('test/1', { totalDataCalls }, (e) => {
      if (e) return failAndExit(e);
      totalMethodCalls++;
    });
    client.happner.exchange.remoteComponent1.brokeredMethod1((e) => {
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
    `total events emitted calls:::${totalEventsEmitted}, per sec: ${
      totalEventsEmitted - totalEventsEmittedPrevious
    }`
  );
  console.log(
    `total data calls:::${totalDataCalls}, per sec: ${totalDataCalls - totalDataCallsPrevious}`
  );
  console.log(
    `total web calls:::${totalWebCalls}, per sec: ${totalWebCalls - totalWebCallsPrevious}`
  );
  console.log(
    `total method calls:::${totalMethodCalls}, per sec: ${
      totalMethodCalls - totalMethodCallsPrevious
    }`
  );
  totalEventsEmittedPrevious = totalEventsEmitted;
  totalWebCallsPrevious = totalWebCalls;
  totalDataCallsPrevious = totalDataCalls;
  totalMethodCallsPrevious = totalMethodCalls;
}, 1e3);
