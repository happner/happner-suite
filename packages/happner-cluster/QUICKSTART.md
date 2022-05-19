## Quickstart

### Motivation

Hapnper-cluster provides clustering capabilities for happner, so that multiple happner cluster nodes will have access to the same components via RPC, as well as the underlying shared happn data structures and events bus. It is designed for an integrated offering of many micros-services which are aware of each other, and have access to shared databases and events.

### Installation

In your project's root directory, run

```bash
npm i happner-cluster
```

### Modules and Components

Modules and components are the same as in happner, see [Happner Quickstart - Modules and Components](https://github.com/happner/happner-suite/blob/docs/master/packages/happner-cluster/QUICKSTART.md) for the basics. There are a few extra steps needed to allow components to see and call each other over the cluster.
As an example, let's create a component that returns the current time.

```js
//index.js
module.exports = class Timer {
  constructor() {}
  start() {}

  async getSystemTime() {
    // Component methods should always be async, return a promise
    // or have a callback paramater that is called.
    let time = Date.now();
    return time;
  }
};
```

With a package.json as follows:

```json
{
  "name": "timer",
  "version": "1.0.0"
}
```

Note that happn and happner use semantic versioning throughout.

We can put the above two files in a `timer` directory in our project's root.

Now, we could create a watch component, which get's the current system, time from the timer, and converts it to a human readable, 24 hour format. Note the try/catch around the remote method call.

```js
//index.js
module.exports = class Watch {
  constructor() {}

  async start($happn) {}

  async getHumanTime($happn, callback) {
    try {
      let time = await $happn.exchange.timer.getSystemTime();
      // Call to remote component.
      // These will always return promises or call callback functions.
    } catch (e) {
      //It is advised to put any remote calls in a try/catch, as the
      //remote component or method may be unavailable, or it's mesh may be
      //down, and this can be handled
      throw e; //But for the purposes of this example, we will just throw.
    }
    let humanTime = new Date(time).toLocaleTimeString();
    return time;
  }
};
```

In the package.json for this module, we need to include the dependency on the remote timer component. This is done as follows:

```json
{
  "name": "watch",
  "version": "1.0.0",
  "happner": {
    "dependencies": {
      "watch": {
        "timer": {
          "version": "1.0.0"
        }
      }
    }
  }
}
```

We can put this in a /watch folder in our prjects root directory.

Note that in the dependencies section, we start with the component that HAS the dependency, which then lists the package(s) it depends ON, as this allows a single package.json to define more than one component class.

Also note that we define a version of the remote component that we want to use. This can be any semantic versioning string, such as "^1.2.0" or "~1.0.0". The component will only search for and call remote components that match this version.

### Creating cluster nodes

We can now create two nodes, one with the timer component, and one with the watch component.
var HappnerCluster = require('happner-cluster');
Firstly, with the timer component:

```js
const path = require('path');
let config = {
  name: 'MESH_1',
  domain: 'DOMAIN_NAME', // same as other cluster nodes
  modules: {
    timer: {
      path: path.resolve(__dirname, './timer'),
    },
  },
  components: {
    timer: {},
  },
};

(async () => {
  let node = await HappnerCluster.create(config);
})();
```

and secondly with the watch:

```js
var HappnerCluster = require('happner-cluster');
const delay = require('await-delay');
const path = require('path');
let config = {
  domain: 'DOMAIN_NAME', // same as other cluster nodes
  happn: {
    port: 57001,
    services: {
      proxy: {
        config: {
          port: 55001,
        },
      },
    },
  },
  modules: {
    watch: {
      path: path.resolve(__dirname, './watch'),
    },
  },
  components: {
    watch: {},
  },
};

(async () => {
  let node = await HappnerCluster.create(config);
})();
```

With the above two meshes running, we can attach a client, and use it to access the components.

### Happner Client

The happner-cluster client is created in the same way as the happner-2 client, for example:

```js
const Happner = require('happner-2');
var testClient = new Happner.MeshClient({ port: 55001 }); //Connecting to the second cluster node.
(async () => {
  await testClient.login();
  //   console.log(Object.keys(testClient.exchange.FirstMesh))
  let result = await testClient.exchange.watch.getHumanTime();
  // result == '10:45:23' // for example.
})();
```

### Brokering

We can also have nodes which are brokers, that is, they expose internal cluster components to any client that connects to them.
For example, if we set up a broker with the following package.json:

```json
{
  "name": "broker-component",
  "version": "1.0.1",
  "happner": {
    "dependencies": {
      "$broker": {
        "remoteCwatchomponent": {
          "version": "^1.0.0",
          "methods": {
            "getHumanTime": {}
          }
        }
      }
    }
  }
}
```

and an index.js

```js
module.exports = class Broker() {
  constructor() {}
  async start() {}
  //... Any other members you may want to add
}
```

Now, if we put the index.js and package.json in a broker folder, we can start a node with the broker component.

```js
var HappnerCluster = require('happner-cluster');
const delay = require('await-delay');
const path = require('path');
let config = {
  domain: 'DOMAIN_NAME', // same as other cluster nodes
  happn: {
    port: 57002,
    services: {
      proxy: {
        config: {
          port: 55002,
        },
      },
    },
  },
  modules: {
    watch: {
      path: path.resolve(__dirname, './watch'),
    },
  },
  components: {
    watch: {},
  },
};

(async () => {
  let node = await HappnerCluster.create(config);
})();
```
We can now attach a client to the broker node, and use the watch component as if it was local.
```js
const Happner = require('happner-2');
var testClient = new Happner.MeshClient({ port: 55002 }); //Connecting to the third cluster node.
(async () => {
  await testClient.login();
  //   console.log(Object.keys(testClient.exchange.FirstMesh))
  let result = await testClient.exchange.watch.getHumanTime(); //Can access this through the broker.
  // result == '10:45:23' // for example.
})();
```
For more informatino see [Happner-Cluster Readme - Brokering](https://github.com/happner/happner-suite/tree/develop/packages/happner-cluster#brokered-components-using-broker)