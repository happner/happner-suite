## Quickstart

### Motivation

Happner-2 is a cloud application and RPC framework ideal for integrating multiple micro services into a unified offering. It enables the creation of an interconnected mesh of local (within a single process) and remote (across multiple processes) components. The mesh components can easily call upon each other's methods or listen to each other's events in a manner uncomplicated by remoteness.

### installation

```bash
npm install happner-2
```

### Modules and Components, creating a simple component in a mesh

A module is a node module which normally will have a start method. A component is a network aware instance of a component. We will create a simple component for demonstration purposes.
The following two files in a directory would suffice as a fairly minimal happner-2 component. First we define the module's code:

```js
//index.js
module.exports = class WhoAmI {
  constructor() {}
  start($happn, callback) {
    callback();
  }
  getComponentName($happn, callback) {
    // $happn is injected by the happner framework
    let error = null;
    $happn.emit("Message", {some: 'data'}); //Component has access to happn's event api
    $happn.log.info('getComponentName Method called in WhoAmI Component'); //And logger
    callback(error, { name: $happn.name });
  }
};
```

Then we include a minimal package.json

```json
{
  "name": "whoAmI",
  "version": "1.0.0"
}
```
Note that happn and happner use semantic versioning throughout.

If we put the previous files in a `whoami` directory in the root directory of our project, we could start a happner instance with the components as follows:

```js
const Mesh = require('happner-2');
let config = {
  name: "FirstMesh",
  modules: {
    whoAmI: {
      path: './whoami',
    },
  },
  components: {
    whoAmI: {},
  },
};
let happner2mesh = new Mesh();
(async () => {
  await happner2mesh.initialize(config);
  let result = await happner2mesh.echange.whoAmI.getComponentName();
  console.log(result);
  // result = {name: "whoAmI"}
})();
```
For more information on modules and components, see [Modules and Components](https://github.com/happner/happner-suite/blob/docs/master/packages/happner-2/docs/modules.md)  

### Endpoints
Part of the power of Happner-2 is that (with the right credentials) it can configure an endpoint that points to any other happner-2 instance. If the happner-2 mesh instance in the final example above is running, we can create amnother mesh, that can call the WhoAmI component's methods:
```js
const Mesh = require('happner-2');
let config = {
  name: "SecondMesh",
  happn: {
    port: 55001 //First mesh is on default 55000
  }
  endpoints: {
    FirstMesh: 55000 
  }
};
let happner2mesh = new Mesh();
(async () => {
  await happner2mesh.initialize(config);
  let result = await happner2mesh.exchange.FirstMesh.whoAmI.getComponentName();
  console.log(result);
  // result = {name: "whoAmI"}
})();

```
When trying to provide multiple micro-services in multiple mesh nodes, it may be preferable to use Happner-Cluster, see [Happner-cluster Quickstart](https://github.com/happner/happner-suite/blob/docs/master/packages/happner-cluster/QUICKSTART.md)  

### The Happner Client
The happner client connects to a happner mesh (server), and (with the correct permissions) has access to the methods and events of components (both local - on the mesh that the client connects to - and remote - on any meshes that mesh is connected to).
As an example, if the two meshes described above are running, we can create a client in a seperate process as follows:
```js
const Happner = require('happner-2');
let testClient = new Happner.MeshClient();
(async () => {
  await testClient.login({
    port: 55001,
  }); // Note, our happner server is not secure, so username and password are not needed
  await testClient.event.whoAmI.on('Message', (data) => {
    console.log('Happner client got \'Message\' Event from whoAmI component, with data: ', data);
  }); //Client has access to the happn event api

  let result = await testClient.exchange.FirstMesh.whoAmI.getComponentName();  // Has access to components, even on remote meshes.
  // Event Handler Logs "Happner client got 'Message' Event from whoAmI component, with data:  { some: 'data' }"
  // result == {name: 'whoAmI'}
})();

```
### Happner Client in Browser
To create a happner client in the browser, you can use the following:
```html
  <body>
    <script>

      window.LOG_LEVEL = 'trace';

      let options = {
        hostname: window.location.hostname,
        port: window.location.port || 55000,
        reconnect:{
          max:180000, //max interval for reconnect attempts - default is 3 minutes
          retries: Infinity //will keep on retrying, forever
        }
      };
      let client = new MeshClient( options );

      // Credentials for the login method, if happn server is secure
      let credentials = {
        username: 'username', 
         password: 'password', 
      }

      // login with callback
      client.login(credentials, function(e) { 
        //... do things with client... 
      })
    </script>
  </body>
</html>
```

### Happner-2 Mesh configuration
For a full list of configuration options, see [Happner-2 documentation - configuuration](https://github.com/happner/happner-2/blob/master/docs/configuration.md]