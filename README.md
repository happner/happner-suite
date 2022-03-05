happner-suite (WIP)
-------------------
This is a work in progress and is not for public consumption yet. We have moved all separate happner components together into a monorepo, for ease of development.

We are also modernizing a lot of the internals, and will be re-doing the documentation - which has admittedly prevented adoption by anyone who has not worked on this framework.

The happner suite has 4 top-level modules:

1. happn-3 - the bottom layer, this manages data-storage, pub/sub and security. happn-3 can be used independently from the other layers - it's technical equivalent would be firebase.
2. happner-2 - the rpc layer, this sits on top of happn-3 and provides a means of exposing javascript module methods to the outside world.
3. happn-cluster - sits on top of happn-3, allows for the creation of a pub/sub cluster.
4. happner-cluster - sits on top of happn-3, happner-2 and happn-cluster, allows for the creation of a clustered rpc setup, where work is distributed across multiple cluster nodes in the cloud.

major releases (migration documentation)
-----------------------------------------------------------------
- [2022-03 happn v12-v13 and happner v11-v12](https://github.com/happner/happner-suite/tree/master/documentation/migration/major-release-2022-03.md)

setup:
-----

```bash
git clone https://github.com/happner/happner-suite.git
cd happner-suite
npm i
```

main modules:
-------------

happn-3 ![coverage](https://github.com/happner/happner-suite/blob/platform-coverage/master/latest/happn-3.badge.svg?raw=true)
-------
This the pub/sub and datastorage layer of the system - happn-3 is similar to firebase in a lot of respects, it combines datastorage with an events communicated over websockets.

[quickstart]()
[happn-3 documentation]()

happner-2 ![coverage](https://github.com/happner/happner-suite/blob/platform-coverage/master/latest/happner-2.badge.svg?raw=true)
---------
This is the rpc layer, it uses happn-3 for communication, and provides the ability to discover and call server-side components as if they were local.

[quickstart]()
[happner-2 documentation]()

happn-cluster ![coverage](https://github.com/happner/happner-suite/blob/platform-coverage/master/latest/happn-cluster.badge.svg?raw=true)
-------------
Adds cluster capability to happn-3.

[quickstart]()
[happn-cluster documentation]()

happner-cluster ![coverage](https://github.com/happner/happner-suite/blob/platform-coverage/master/latest/happner-cluster.badge.svg?raw=true)
---------------
Adds cluster-capability to happner-cluster.

[quickstart]()
[happner-cluster documentation]()

supporting modules:
--------------------

data providers:
---------------
*The data providers are plugins that need to be setup as npm dependencies and configured as data providers*

happn-db-provider-loki ![coverage](https://github.com/happner/happner-suite/blob/platform-coverage/master/latest/happn-db-provider-loki.badge.svg?raw=true)
----------------------
*the default embedded data provider, see [loki](https://github.com/techfort/LokiJS)*

```javascript
// configure in happn

// configure in happner

```

happn-db-provider-mongo ![coverage](https://github.com/happner/happner-suite/blob/platform-coverage/master/latest/happn-db-provider-mongo.badge.svg?raw=true)
----------------------
*mandatory for clustered setup or situations where there is high data volume*

```javascript
// configure in happn

// configure in happner

```

happn-db-provider-nedb
----------------------
*still maintained for backward compatability - this was the original default embedded data provider (will eventually be discontinued)*

```javascript
// configure in happn

// configure in happner

```

happn-db-provider-elasticsearch ![coverage](https://github.com/happner/happner-suite/blob/platform-coverage/master/latest/happn-db-provider-elasticsearch.badge.svg?raw=true)
----------------------
*still maintained for backward compatability - only for elasticsearch 6.4.0 downwards (will eventually be discontinued)*

```javascript
// configure in happn

// configure in happner

```