## Quickstart

### Motivation

Hapnp-cluster provides clustering capapbilities for happn, so that multiple happn cluster nodes will have access to the same data and data structures in a shared database and a shared pub-sub event bus.

### Installation

In youre project's root directory, run

```bash
npm i happn-cluster
```

### Creating a single node 'cluster' with default config

```javascript
// in async function
let node = await require('happn-cluster').create();
```

This will create a single, satisfied clustrer node, which can be connect and be connected to from other nodes with the same cluster name (default: 'happn-cluster') and deployment (default: 'Test-Deploy'). By default, the node will refresh it's list of members every 5 seconds, and send a keepAlive to the database every 5 seconds (so that other nodes can look it up).

### Creating a multiple node cluster

#### Requirements

1. A shared mongo database that all nodes can access.
2. Each node must be accessible on an ip:port combination.

#### Happn paths:

Certain strings will be limited to characters acceptable in happn paths, namely '\_\*-', numbers and letters. These will be explicitly marked in a comment.

#### Simplest configuration on one device

Assumes a single device, with a mongo db available at localhost:27017

```javascript
(async () => {
  let config = {
    //Example
    port: 1234, //int, on a single device, use a different port for each node.
    services: {
      orchestrator: {
        config: {
          deployment: 'DEPLOYMENT_123', //String, happn-path
          minimumPeers: 3,
        },
      },
      proxy: {
        config: {
          port: 4567, //int, on a single device, use a different proxy port for each node.
        },
      },
    },
  };
  let nodes = [];
  for (let port of [9000, 9100, 9200]) {
    config.port = port;
    config.services.proxy.config.port = port + 50;
    nodes.push(require('happn-cluster').create(config)); // nodes require each other to stabilise, so we cannot await them one at a time.
  }
  await Promise.all(nodes); //We need to await them all together.
})();
```

after the above, we can see the following

```javascript
(async () => {
  // Without clients
  await nodes[0].services.data.upsert('/some/happn/path', { an: 'object' });
  let stored = await nodes[2].services.data.get('/some/happn/path');
  //  stored = {
  //    data: {an: 'object'},
  //    meta: {...}
  //  }

  // With clients
  let client1 = await require('happn-3').client.create({ port: 9000 });
  let client2 = await require('happn-3').client.create({ port: 9200 });
  await client2.set('test/data', { data: 'one' });
  let result = await client1.get('test/data');
  // result = {data: 'one', meta: {...}}

  client1.on('test/data', (data, meta) => console.log(data)); //handler
  await client2.set('test/data', { data: 'two' });
  await client2.publish('test/data', { data: 'three' });
  // the handler above will log:
  // {data: 'two'}
  // {data: 'three'}
})();
```

#### Cluster configuration with services

```javascript
//Example
let config = {
  services: {
    orchestrator: {
      config: {
        deployment: 'DEPLOYMENT_123', //String, happn-path
        serviceName: 'THIS_SERVICE',
        clusterName: 'THIS_CLUSTER',
        cluster: {
          // key-value pairs: service name, and expected minimum nodes of that service
          THIS_SERVICE: 3,
          THAT_SERVICE: 2,
        },
      },
    },
  },
};
```

By adding an explicit cluster config at `config.services.orchestrator.config.cluster`, we can specify the minimum amount required of each service by name. The cluster will not stabilise until there at least as many nodes of each service as defined in this config. So, the example above will not stabilise until there are at least 3 nodes with serviceName "THIS_SERVICE", and 2 with serviceName "THAT_SERVICE"
Notes:

1. As in the example above, the serviceName is also set in the orcchestrator config.
2. Another node will not be able to join this cluster if it has a different clusterName or deployment.
3. Another node will not be able to join this cluster if it's service name is not included as a key in `...orchestrator.config.cluster`
4. The serviceName does not in any way constrain the rest of tthe set-up of a node, so two nodes with the same serviceName could be very different, although it is recommended that one uses the service names descriptively, so that nodes with the same serviceName fulfill a similar function.

### Database set-up:

```javascript
config = {
    services: {
        data: {
            config: {
                datastores : [{
                    name: 'DATASTORE-NAME', //default: 'mongo'
                    provider: 'happn-db-provider-mongo',
                    settings: {
                    collection: 'COLLECTION_NAME', //defaults to: 'happn-cluster'
                    database: 'DB_NAME',  //defaults to: 'happn-cluster'
                    url: 'mongodb://MONGO_URL:PORT' //defaults to:  'mongodb://127.0.0.1:27017',
                    } ]
                }
            }
        }
    }

```

As mentioned above, each cluster node must have access to a shared mongo db, using happn-db-provider-mongo. By default, if there is no datastore with happn-db-provider-mongo configured as a provider, one will be added that points to localhost at the default mongo port. This will not work if the nodes are on seperate devices, in which case a mongodb datastore must be explicitly configured in each nodes config, as above.

### Replication:

By default, the cluster nodes will replicate events on **all** paths. If you want to constrain which events will replicate, you can set `config.services.orchestrator.config.replicate = [....]` This is an array of paths that **will** be replicated, and can accept wildcardsm for example:

```javascript
config.services.orchestrator.config.replicate = [
    'path1/2/*',
    'path2/*/4',
    'path3/4/5'
]
```
Will limit replication to only paths matching (With wildcards) the above.


### Timing:
There are five timing settings which can be adjusted in `config.services.orchestrator.config.timing`
These are:
1. keepAlive (default 5e3): how often a keepAlive message is sent to the db.
2. keepaliveThreshold (default 6e3) : How old another nodes db entry can be, to still be considered an active part of the cluster. This should be slightly longer than the keepAlive.
3. memberRefresh (default 5e3): How often this node checks the db for a list of active members, and connects and subscribes to those members as required. 
4. stabiliseTimeout (default undefined): How long the cluster will wait for other required members as defined by config.cluster or config.minimumPeers before shutting down for failure to stabilse.
5. Health (default 10e3): How often this node will log a brief report and JSON detailing its current state and health

As  an example, for testing one might want to set: 
```
config.services.orchestrator.config.timing = {
    keepAlive: 2e3,
    keepAliveThreshold: 3e3,
    memberRefresh: 2e3
}  