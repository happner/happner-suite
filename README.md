happner-suite (WIP)
-------------------
This is a work in progress and is not for public consumption yet. We have moved all separate happner components together into a monorepo, for ease of development.

We are also modernizing a lot of the internals, and will be re-doing the documentation - which has admittedly prevented adoption by anyone who has not worked on this framework.

setup:
-----

```bash
git clone https://github.com/happner/happner-suite.git
cd happner-suite
npm i
```

main modules:
-------------

happn-3
-------
This the pub/sub and datastorage layer of the system - happn-3 is similar to firebase in a lot of respects, it combines datastorage with an events communicated over websockets.

[getting started with happn-3]()
[happn-3 documentation]()

happner-2
---------
This is the rpc layer, it uses happn-3 for communication, and provides the ability to discover and call server-side components as if they were local.

[getting started with happner-2]()
[happner-2 documentation]()

happn-cluster
-------------
Adds cluster capability to happn-3.

[getting started with happn-cluster]()
[happn-cluster documentation]()

happner-cluster
---------------
Adds cluster capability to happner-cluster.

[getting started with happner-cluster]()
[happner-cluster documentation]()

supporting modules:
--------------------

data providers:
---------------

happn-db-provider-loki
----------------------
![coverage](https://github.com/happner/happner-suite/tree/platform-coverage/develop/latest/happn-db-provider-loki.badge.svg?raw=true)
