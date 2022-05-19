[![npm](https://img.shields.io/npm/v/happn-cluster.svg)](https://www.npmjs.com/package/happn-cluster)
[![Build Status](https://travis-ci.org/happner/happn-cluster.svg?branch=master)](https://travis-ci.org/happner/happn-cluster)
[![Coverage Status](https://coveralls.io/repos/happner/happn-cluster/badge.svg?branch=master&service=github)](https://coveralls.io/github/happner/happn-cluster?branch=master)

# happn-cluster

Extends happn with cluster ability.

## Configure

See [happn](https://github.com/happner/happn) for full complement of happn config.

```javascript
var HappnCluster = require('happn-cluster');
var defaultConfig = {
    // name: undefined,  // defaults from happn service host:port (10-0-0-1_55000)
    // host: '0.0.0.0', // happn service ip
    // port: 57000,    // happn service port
    // secure: true,  // to enable security
    // announceHost: 'externally-visible-ip-or-hostname', // eg. when docker
    services: {

      // // security sub-config (to enable security)
      // security: {
      //   config: {
      //     adminUser: {
      //       username: '_ADMIN', // <---- leave this as _ADMIN
      //       password: 'happn'
      //     }
      //   }
      // },

      // shared data plugin sub-config (defaults displayed)
      data: {
        config: {
          datastores: [
            //mongo is defaulted:
            // {
            //     name: 'mongo',
            //     provider: 'happn-db-provider-mongo',
            //     settings: {
            //         collection: process.env.MONGO_COLLECTION || 'happn-cluster',
            //         database: process.env.MONGO_DATABASE || 'happn-cluster',,
            //         url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
            //     },
            //     isDefault: true,
            // },
          ]
        }
      },

      // proxy sub-config (defaults displayed)
      proxy: {
        config: {
          port: 55000,
          host: '0.0.0.0',
          allowSelfSignedCerts: false,
          // timeout: 20 * 60 * 1000, // request socket idle timeout
          // defer: false,
          // keyPath: 'path/to/key',
          // certPath: 'path/to/cert'
        }
      },

      // orchestrator sub-config (defaults displayed)
      orchestrator: {
        config: {
          clusterName: 'happn-cluster',
          serviceName: 'happn-cluster-node',
          deployment: 'Test-Deploy',
          replicate: ['*'],
          timing: {
            keepaliveThreshold: 6e3,
            stabiliseTimeout: 15e3,
            keepAlive: 5e3,
            memberRefresh: 5e3,
            healthReport: 10e3
          },
          cluster: {
            'happn-cluster-node': 1
          },
          minimumePeers: 1 //Deprecated
      },
      replicator: {
        config: {
          //when users, groups or permissions change - the security directory updates are
          //batched and pushed out to the cluster, every 3000ms - you can change this to make
          //the pushes happen less or more often, the batches are also de-duplicated by
          //whatHappend (link-group, unlink-group etc) and the user or group name in question.
          securityChangesetReplicateInterval: 3000 //once every 3 seconds
        }
      }
    }
  }
}
let server = await HappnCluster.create(defaultConfig);
```

## NB: by default replicate will replicate all events across the cluster (see above config.replcate is ['\*']) - because we are now using happn-3 version 8.0.0 the / and \* characters have stricter rules, ie: to replicate all events for a set or remove with path /my/test/event you need to set replicate to ['/my/\*/\*'], /my/\* and /my\* or /my/te\*/event will no longer work.

### Happn Config

#### name

Each happn node in the cluster requires a unique name. The name will default from the host:port below to produce something like '10-0-0-1_55000'. If happn is configured to listen at 0.0.0.0 then the name will default instead from the first public IPv4 address found in interfaces.

#### host

The host/ip that the happn service should listen on. Also supports [dface](https://github.com/happner/dface) spec for cloning nodes into a DHCP environment.

#### port

The port that the happn service should listen on.

#### secure

Set true to enable security.

**If one cluster node is secure, they all need to be secure.**

#### announceHost

When using docker the internal container ip is announced into the cluster for remote members to connect to. But that ip is not accessible, use this config to specify the ip or hostname of the accessible external interface. Note that a similar issue occurs with the ports so all ports require a **same-to-same mapping when using docker**.

### Security Sub-Config

Inter-cluster connections are made using the admin user. All nodes in the cluster will need the same
admin username and password configured.

**Once created, the admin user's password cannot be changed from config.**

To change the admin password.

- Stop all cluster nodes.
- Put the new password into all cluster node configs.
- Delete the old \_ADMIN user and \_ADMIN group membership from the shared database.

```bash
mongo mongodb://127.0.0.1:27017/happn-cluster
> use happn-cluster
> db['happn-cluster'].remove({path: {$in: ['/_SYSTEM/_SECURITY/_USER/_ADMIN', '/_SYSTEM/_SECURITY/_USER/_ADMIN/_USER_GROUP/_ADMIN']}});
```

- Restart the cluster (admin user will be regenerated with new password)

**The above also applies after starting a cluster with security unconfigured. The admin user is still created with the default password 'happn'. Upon turning on security later the password will then need to be changed as described above.**

### Shared Data Sub-Config

By configuring a shared data service all nodes in the cluster can serve the same data to clients. The
default uses the [happn mongo plugin](https://github.com/happner/happn-service-mongo). The localhost
url is porbably not what you want.

### Proxy Sub-Config

A starting cluster node immediately starts the happn service listening to allow the orchestrator to
establish the inter-cluster replication bridges.

Clients attaching to this happn service port will therefore be connecting before the node is ready.

Instead, clients should connect through the proxy port, whose start is pended until the node is ready.

#### config.[port, host]

The socket address where the proxy listens for clients.

#### config.[keyPath, certPath]

Specify key and cert filenames to switch switch on https

#### config.allowSelfSignedCerts

Allow connecting to local happn which is listening with https and self signed cert.

#### config.defer

Set to true to not start the proxy service. If set the `services.proxy.start()` will need to be called externally.

#### config.timeout

Configure proxy's request-side socket's idle timeout. Default 20 minutes.

### Orchestrator Sub-Config

#### config.clusterName

Every member of the cluster should have the same configured `clusterName`.
The name is limited to characters acceptable in happn paths, namely '\_\*-', numbers and letters.
Joining members with a different clusterName will be ignored by the orchestrator.

#### config.serviceName

Every member of the cluster should have a serviceName.
Cluster will not be stable until a minimum number of each service by name, as defined in `config.cluster`
have joined the cluster. The serviceName is not unique by node. Multiple nodes can be of the same service, 
and any requests to components on those nodes will round-robin between the nodes which have that component.
The name is limited to characters acceptable in happn paths, namely '\_\*-', numbers and letters.


#### config.deployment

Every member of the cluster should have the same configured `deployment`.
The name is limited to characters acceptable in happn paths, namely '\_\*-', numbers and letters.
This is used as a part of the path where the keepalives are stored and looked up, so that nodes will only see other nodes in the same deployment.


#### config.replicate

Array of happn paths or path masks that will be replicated throughout the cluster.

#### config.timing:
Contains the timing for variables related to membership, keepAlives,stabilisation, and health reporting
**NB.** These keepAlive ,keepAliveThreshold, and memberRefresh are set fairly long (around 5 seconds) by default, for regular use.  For testing purposes, it is recommended to shorten them as required, as well as config.keepAliveThreshold (above)  

##### config.timing.stabiliseTimeout

Defines how long to wait for this starting node to become fully connected (stabilised) before giving up and stopping the node. In all known cases a starting node will either reach stability or fail explicitly with an error. This is a failsafe (for unknown cases) to prevent endlessly awaiting stability where it would be better to stop and try joining the cluster again.  This is not defaulted (i.e. will default to waiting forever to stabilise)
**Note that this acts in opposition to `config.cluster` - A starting node awaiting minimum services as described in config.cluster will still time out.**

##### config.timing.keepAlive
How often the node sends a keepalive to the DB. The keepAlive is set on a path that includes the deployment (see above)
  
##### config.timing.keepAliveThreshhold
The maximum age that keepalive records in the DB can be in order to be considered as still active.
This should be set to slightly longer than the keepAlive timing above

##### config.timing.memberRefresh:
How often the node requests member list from DB, and then updates, connects and subscribes as required.

##### config.timing.healthReport: 
How often the node reports its health. The health report includes the node's state, and a list of how many peers of each service it has and expects.
It will also log a JSON which has the following structure:
```
      {
      MEMBER_ID: "Service-1-node-1" 
      MEMBER_ENDPOINT: "1.2.3.8:1234" // This node's ip address and port in the network
      TOTAL_CLUSTER_MEMBERS: 4        //Member is another node we know about 
      TOTAL_CLUSTER_PEERS: 3          // Peer is a node that is connected to, connected from, and subscribed to.
      UNHEALTHY_MEMBERS: ["1.2.3.4:456", "1.2.2.5:987"] //Array: other cluster nods which are any or all of the following:
                                                        //  not connected to, connected from, or subscribed to.
      STATUS: "CONNECTING" //String: the node's current state
    };
```    

#### config.cluster 
An object with key value pairs of serviceName, mimnimumRequired, e.g.
```
{
    deviceServer: 3,
    userManager: 2
}
```
The cluster will not enter a stable state until it has at least minimumRequired of each service. Note that a node whose service name is not included in cluster.config will not be connected to. (This could be changed to be configurable, if required.)  

#### config.minimumPeers 
*Deprecated, use config.cluster instead. If both config.minimumPeers and config.clusster are set, minimumPeers will be ignored* 
This pends the starting of the proxy until there are this many known peers in the cluster. This prevents
the `thundering herd` (of clients) from settling all their sockets permanently onto the first started node.
For backwards compatibility, if minimumPeers is set, and config.cluster is not, config.cluster will be created as `{*this.serviceName*: this.minimumPeers }`

