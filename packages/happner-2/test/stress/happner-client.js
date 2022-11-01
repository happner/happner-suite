/*
Simon: run up a happner-client, for emulating reconnection logic and some activity
*/
/* eslint-disable no-console */
const commander = require('commander');
commander.option('--activity [number]', 'activity interval').parse(process.argv);

const HappnerClient = require('happner-client');
let client = new HappnerClient();

var model = {
  localComponent: {
    version: '*',
    methods: {
      testMethod: {},
      testFireEvent: {},
    },
  },
};

let api = client.construct(model);
client.connect(null, { username: '_ADMIN', password: 'happn' }, (e) => {
  if (e) {
    console.log('happner-client connection failed!!!', e);
    process.exit(1);
  }
  console.log('HAPPNER CLIENT CONNECTED:::');
  client.on('disconnected', reconnectScheduled);
  client.on('reconnected', reconnectSuccessful);

  if (commander.activity) {
    api.event.localComponent.on(
      'emit: 1',
      () => {
        console.log('emit: 1 done');
      },
      () => {
        doClientActivity();
      }
    );
  }
});

function doClientActivity() {
  api.exchange.localComponent.testFireEvent('1', (e) => {
    if (e) console.log('activity issue: ', e);
    setTimeout(doClientActivity, commander.activity);
  });
}

function reconnectScheduled() {
  console.log('happner-client: reconnect scheduled:::');
}

function reconnectSuccessful() {
  console.log('happner-client: reconnect successful:::');
}
