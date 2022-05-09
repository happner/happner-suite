## Quickstart

### Motivation

Happn-3 is a mini database, which also allows for a pub/sub on database changes and events. Data and events are stored/emmitted on paths, which can also be queried using wildcard syntax. Happn-3 also has security management features, which are used for a happn-server, as well as any of the packages that build on happn (happn-cluster, happner-2, happner-cluster). This package includes the code for both a happn server and a happn client.

### installation

```bash
npm install happn-3
```

### Creating a minimal happn server

Note: To create a more complex, happn-server, with security, users and groups, see [Putting it all together](#alltogether).
By default, the happn server will run on port 55000. To create a happn server

```js
let happn = require('happn-3');
  //async/await
(async () => {
    let happnServer = await happn.service.create();
  })
)();
```

alternatively,

```js
let happn = require('happn-3');
//Callback
let happnServer;
happn.service.create((error, happnInstance) => {
  happnServer = happnInstance;
});
```

For more details on configuration see:

### Creating a minimal happn client

Prequisites: a non-secure happn-server running at default or specified host and port.  
A happner client can be created in either node or the browser, as follows:  
Note that some of the default options are used here, as an example. For more info on options, see [Readme - Configuration](https://github.com/happner/happner-suite/tree/master/packages/happn-3#configuration)
**Node**:

```js
let happn = require('happn-3');
let options = {
    host: "127.0.0.1",  //default
    port: 55000 //default
}
let happnClient_instance;

/// async/await
(async(() => {
     happnClient_instance = await happn.client.create(options)
    })
)();
```

alternately:

```js
let happn = require('happn-3');
let options = {
  host: '127.0.0.1', //default
  port: 55000, //default
};
let happnClient_instance;

//callback
happn.client.create(options, (e, happn) => {
  happnClient_instance = client;
});
```

**Browser:**

```html
<script type="text/javascript" src="http://localhost:55000/browser_client"></script>
<script>
  var my_client_instance;
  let options = {
    host: '127.0.0.1', //default
    port: 55000, //default
  };
  HappnClient.create(options, function (e, instance) {
    //instance is now connected to the server listening on port 55000
    my_client_instance = instance;
  });
</script>
```

For more details on configuration optons, see

### Happn Paths

Happn stores data on paths. The client can also subscribe on these paths, and the happn server will emit an event when the data on a path is changed.  
Paths are made up of any number of string segments, joined by forward slashes (`/`)  
When searching for data, or subscribing to paths, wildcards can be used. So, for example:

```js
let data = await happnClient_instance.get('my/*/data');
// returns JSON stored at, for e.g.
// 'my/stored/data'
// 'my/temp/data'
```

Will get any (stored) values at any path which starts with 'my/' and ends with '/data'  
One could also use `happnClient_instance.get('my/data/*')`to get the stored data at all paths which start with 'my/data/'

### Happn client data operations

The happn-client can _set_, _get_, _remove_, _increment_ and _search_ data. (For additional data operations see readme);

so, for example:

```js
(async () => {
await happnClient_instance.set('my/path/1', {some: 'json'});
let data = await happnClient_instance.get('my/path/1');
// data is {some: 'json', _meta: {...} };
happnClient_instance.remove('my/path/1')
data = await happnClient_instance.get('my/path/1');
// data is null

await happnClient_instance.increemnt('my/gauge/1'});
// This  will create a gauage if there isn't one at the path
data = await happnClient_instance.get('my/gauge/1');
//data is {counter: {value: 1}, _meta: {...}

await happnClient_instance.increemnt('my/gauge/1'});
 data = await happnClient_instance.get('my/gauge/1');
//data is {counter: {value: 2}, _meta: {...}
})()
```

The search function allows for querying via mongo style queries and parameters, or using regular expressions, and is best described in more detail at **link to readme** https://github.com/happner/happner-suite/tree/master/packages/happn-3#search

### Events

Happn-3 will fire an event on setting or removing data on a path. There is also a publish method, which will fire the event without changing the stored data. By default, subscribing on an event will listen to all actions on that path, but this can be configured, see \*\*link to readme https://github.com/happner/happner-suite/tree/master/packages/happn-3#events
As an example:

```js
(async () => {
  let handle = await happnClient.on('/some/path/to/listen/to', (data) =>
    console.log('Received:', data)
  );
  await happnClient.set('/some/path/to/listen/to', { some: 'data' });
  // logs "Received: {some: 'data'}"
  await happnClient.publish('/some/path/to/listen/to', { other: 'data' });
  // logs "Received: {other: 'data'}"
  //Recieves the event, but:
  let data = await happnClient.get('/some/path/to/listen/to');
  // data == {some: 'data'} the store data is unchanged
  await happnClient.remove('/some/path/to/listen/to');
  // logs "Received: {removed: 1}"
  await happnClient.off(handle); // unsubscribe
})();
```

One can also use the once method to only listen to the first event that gets published on that path.  
One can also subscribe on paths using wildcards, and also to a variable depth of wildcards using `/**` syntax, which is covered in more detail at https://github.com/happner/happner-suite/tree/master/packages/happn-3#variable-depth-subscriptions

### Security

Happn has a rich security layer, which at it's simplest consists of users, groups and permissions. In order to use the security service, we first need to create a secure happn server

#### Creating a secure happn server:

```js
let happn = require('happn-3');
let secureHappnServer
(async () => {
  secureHappnServer = await happn.service.create({
    secure: true,
    services: {
      security: {
        config: {
          adminUser: {
            username: "_ADMIN" // default
            password: "happn" //default - NB: do not use in production.
          }
        }
      }
    }
  })
})();
```

Note that users, groups, and permissions can only be added explicitly by running methods on this secure happn server, and not over an internet connection. However, the security data is all stored on happn paths, and a secure admin client can access these paths (\*\*Check This!

### Permissions

_Code in this section is only as an example, not to be run_  
Permissions are normally stored as a list of paths and an array of permissible and/or prohibited actions on that path. The following is a complete list of all the actions that can be allowed or prohibited:

```js
['set', 'get', 'remove', 'on', '*', 'delete', 'put', 'post', 'head', 'options'];
```

With '\*' being a wildcard for allowing or prohibiting ALL of the otheractions listed.
The permissions for a group, or user, will look something like the following:

```js
{
  ...group,
  permissions: {
    'allowed/permission/path': {
      actions: ['on', 'get'] //actions is a list of ALLOWED actions
    },
    'allowed/permission/all': {
      actions: ['*'] // All actions are allowed on this path
    },
    'prohibited/permissions/path': {
      prohibit: ["on", "get"]  //On and get are explicitly prohibitted on this path. Other actions will also be prohibited unless they are explicitly allowed,
    },
    'mixed/permissions/example': {
      actions: ['*'],
      prohibit: ['set']
      //prohibition trumps permission, so in this case all actions EXCEPT set are permissible on this path.
    }
  }
}
```

### Users

At the simplest, users consist of a username, password, and (optionally) permissions. Users can only be created from a secure happn server instance.
To create a user

```js
//User
let user = await secureHappnSerer.services.security.users.upsertUser({
  username: 'user@somewhere.com',
  password: 'password',
  permissions: {
    'allowed/path/get': { actions: ['get'] },
    'allowed/path/all': { actions: ['*'] },
    'prohibited/path/all': { prohibit: ['*'] },
  },
});
```

### Groups

A group consists of a name and a list of permissions, as well as (optional) custom data. Like users, groups can only be created from a secure happn server instance.
To create a group:

```js
let group = await secureHappnSerer.services.security.groups.upsertGroup({
  name: 'GROUP_NAME',
  permissions: {
    'allowed/path/get': { actions: ['get'] },
    'allowed/path/all': { actions: ['*'] },
    'prohibited/path/all': { prohibit: ['*'] },
  },
  custom_data: {
    // ...whatever you want
  },
});
```

### Linking and unlinking users and groups

Users can be linked to groups, and will have all the permissions of (all) the groups they are linked to, as well as the user's own permissions, remembering that prohibition always trumps permission. Linking and unlinking can only be done from a secure happn server instance.
Linking and unlinking groups to users:

```js
let myUser = await secureHappnSerer.services.security.users.upsertUser{...})
let myGroup = await secureHappnSerer.services.security.groups.upsertGroup({...})
///link myGroup to myUser:
await secureHappnSerer.services.security.groups.linkGroup(myGroup, myUser);
///unlink myGroup from myUser:
await secureHappnSerer.services.security.groups.unlinkGroup(myGroup, myUser);
```

### Putting it all together

The following code, will create a secure happn server,

```js
let happn = require('happn-3');
//async/await
(async () => {
  let happnServer = await happn.service.create({ sevure: true }); // Will create default admin user: {username: '_ADMIN", password: 'happn'}
  let user = await secureHappnSerer.services.security.users.upsertUser({
    username: 'myUser1@somewhere.com',
    password: 'password',
    permissions: {
      'data/myUser1/*': { actions: ['*'] },  //Allows access to all actions on all subpaths of data/myUser1
    },
  });
  let group = await secureHappnSerer.services.security.groups.upsertGroup({
    name: 'MY_GROUP1',
    permissions: {
      'data/MY_GROUP1/*': { actions: ['*'] },
    },
  });
  await secureHappnSerer.services.security.groups.linkGroup(myGroup, myUser);
})();
```
