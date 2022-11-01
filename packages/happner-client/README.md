[![npm](https://img.shields.io/npm/v/happner-client.svg)](https://www.npmjs.com/package/happner-client)
[![Build Status](https://travis-ci.org/happner/happner-client.svg?branch=master)](https://travis-ci.org/happner/happner-client)
[![Coverage Status](https://coveralls.io/repos/happner/happner-client/badge.svg?branch=master&service=github)](https://coveralls.io/github/happner/happner-client?branch=master)

# happner-client

The client for happner-2 and happner cluster services.

`npm install happner-client`

## Usage

### Create client instance.

```javascript
var HappnerClient = require('happner-client');
var client = new HappnerClient({
  requestTimeout: 10 * 1000, // (default) milliseconds timeout on api request (set ack)
  responseTimeout: 20 * 1000, // (default) timeout awaiting response
  logger: null // (defualt) optional happner-logger
});
```

### Connect

```javascript
var optionalInfo = {
  // meta data for login
  ///////////////////// in $origin
}
client.connect(
  { // connection
    host: 'localhost',
    port: 55000
  },
  { // options
    protocol: 'https',
  	username: '_ADMIN',
    password: 'happn',
    allowSelfSignedCerts: true,
    info: {}
  }
).then(...).catch(...); // also supports callback


// connection can be defaulted (eg. in browser)
client.connect(null, {username: '_ADMIN', password: 'happn'}, function (e) {
})
```

### Events

```javascript
client.on('connected', function () {
  // event fired on successful connection to server
});

client.on('reconnected', function () {
  // event fired on successful reconnection to server
});

client.on('disconnected', function () {
  // event fired when disconnected from server
});

client.on('reconnecting', function () {
  // event fired when attempting to reconnect
});

client.on('error', function (e) {
  // includes model verification mismatches
});
```

### Construct your API

```javascript
var kitchenModel = {
  fridge: {
    version: '^1.0.0', // requires that server has matching version of fridge component
    methods: {
      getTemperature: {
        // optional parameters for clientside validation
        params: [
          {name: 'shelves', type: 'array'}
        ]
      }
    }
  }
};

var kitchen = client.construct(kitchenModel);
```

### Use API functions

```javascript
// with callback
kitchen.exchange.fridge.getTemperature(['top', 'middle'], function (e, temps) {});

// with promise
kitchen.exchange.fridge.getTemperature(['top', 'middle'])
	.then(function (temps) {})
	.catch(function (e) {})
```

### Listen to API events

```javascript
kitchen.event.fridge.on('/eventName', function (data) {});
```
### Discover component methods
*NB: this will only work if you connect before you construct*
```javascript
//initialize the client with discover Methods true
const client = new HappnerClient({ discoverMethods: true });

//set up your model, declaring which components you wish to discover
var model = {
  component1: {
    version: '^1.0.0'
    //no need for method declarations
  },
  component2: {
    version: '^1.0.0'
    //no need for method declarations
  }
};
//on connection the remote mesh schema will be pulled
await client.connect(null, {
  username: '_ADMIN',
  password: 'xxx'
});
//on construct the components in the model will be updated with the available methods
const createdApi = createdClient.construct(model);
await createdApi.component1.discoveredMethod();
```
### Access happn data points directly, via the dataClient

```javascript
//assuming we have connected
//var client = new HappnerClient(...
//client.connect(...
var dataClient = client.dataClient();

//dataClient is the underlying happn-3 client for the happner-client connection, so you have all the happn-3 goodness:
dataClient.on('/test/point', function(data){

}).then(...);

dataClient.set('/test/point', {my: 'data'}).then(...)

dataClient.get('/test/point').then(...)

dataClient.remove('/test/point').then(...)

```
see [this test](https://github.com/happner/happner-client/blob/master/test/24-func-data.js) for a full demonstration

## Browser usage

Assuming served from [happner-2](https://github.com/happner/happner-2) packaged `/api/client` script

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>

  <!-- includes Happner.HappnerClient -->
  <script src="/api/client"></script>

  </head>
<body>

  <script>

    var client = new Happner.HappnerClient({
      requestTimeout: 10 * 1000,
      responseTimeout: 20 * 1000
    });

    var model = {
      'component': {
        version: '^2.0.0',
        methods: {
          method1: {}
        }
      }
    };

    var api = client.construct(model);

    client.connect()

      .then(function () {
        // subscribe to events (requires connected)
        api.event.component.on('test/event', function (data, meta) {
          console.log('EVENT', meta.path);
        });
      })

      .catch(function (error) {
        console.error('connection error', error);
      });

    // repeat call on exchange
    setInterval(function () {

      api.exchange.component.method1()
        .then(function (reply) {
          console.log('REPLY', reply);
        })
        .catch(function (error) {
          console.error('ERROR', error);
        });

    }, 1000);

  </script>

</body>
</html>
```
