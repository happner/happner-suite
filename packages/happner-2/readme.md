[![npm](https://img.shields.io/npm/v/happner-2.svg)](https://www.npmjs.com/package/happner-2)

<img src="https://raw.githubusercontent.com/happner/happner-website/master/images/HAPPNER%20Logo.png" width="300"></img>

## premise

Happner-2 is a cloud application and RPC framework ideal for integrating multiple micro services into a unified offering. It enables the creation of an interconnected mesh of local (within a single process) and remote (across multiple processes) components. The mesh components can easily call upon each other's methods or listen to each other's events in a manner uncomplicated by remoteness.

## uses happn-3

Happner uses [happn-3](https://github.com/happner/happner-suite/tree/develop/packages/happn-3) as the data persistence and pub/sub framework that allows for communication between happner services and components.

## cluster-able

It is possible to create a cluster of happner services, using [happner-cluster](https://github.com/happner/happner-suite/tree/develop/packages/happner-cluster)

## installation

`npm i happner-2 --save`

## demonstration

These walkthroughs use *happner* to create a rudimentary monitoring service.

* [Quick Start](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/walkthrough/the-basics.md)

## documentation

* [Configuration](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/configuration.md)
* [Happn](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/happn.md)
* [Modules and Components](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/modules.md)
* [Autoloading and Defaulting](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/autoload.md)
* [Security](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/security.md)

###

* [Event Api](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/event.md)
* [Local Event Api](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/local-event.md)
* [Exchange Api](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/exchange.md)
* [Data Api](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/data.md)
* [Web Routes and Middleware](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/webroutes.md)
* [REST component](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/restcomponent.md)

###

* [Starting and Stopping Mesh Node](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/starting.md)
* [Mesh events](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/mesh-events.md)
* [Using the loader to start a mesh](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/loader.md)
* [System Components](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/system.md)
* [Using the Client](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/client.md)
* [utility scripts](https://github.com/happner/happner-suite/blob/develop/packages/happner-2/docs/utility-scripts.md)
