## HAPPNER SECURITY

## users groups and permissions

_happner meshes can run in secure mode, a scheme comprising of users, groups and permissions allows for this, we have yet to complete the documentation for this, but to get a comprehensive picture of how this works, please look at [the test for now](https://github.com/happner/happner-suite/blob/master/packages/happner-2/test/integration/security/advanced-security.js)_

## security directory events

_the happner security module emits the following events pertaining to changes on the security directory:_

- upsert-group - when a group is upserted
- upsert-user - when a user is upserted
- link-group - when a user is linked to a group
- unlink-group - when a user is unlinked from a group
- delete-group - when a group is deleted
- delete-user when a user is deleted

```javascript
//you need to switch this on by first calling attachToSecurityChanges method

adminClient.exchange.security.attachToSecurityChanges(function(e){
	 adminClient.event.security.on('upsert-user', function(data){
        ...
      });

```

please look at [the test](https://github.com/happner/happner-suite/blob/master/packages/happner-2/test/integration/security/permission-changes-events.js)

## security session events

_the security module emits an event for every time a client connects or disconnects from the system_

```javascript
	//you need to switch this on by first calling attachToSessionChanges method
	adminClient.exchange.security.attachToSessionChanges(function(e){
		adminClient.event.security.on('connect', function(data){
	      ...
	    });

	    adminClient.event.security.on('disconnect', function(data){
	      ...
	    });
```

please look at [the test](https://github.com/happner/happner-suite/blob/master/packages/happner-2/test/integration/security/session-changes-events.js)

## security service functions

#### exchange.security.addGroupPermissions(groupName, permissions)

Adds new permissions to existing permissions for groupName.

```javascript
var addPermissions = {
  methods: {
    '/meshname/component/method': { authorized: true }
  },
  events: {
    '/meshname/component/event': {}
  },
  web: {
    '/component/webmethod': { authorized: true, actions: ['get'] }
  }
};

$happn.exchange.security
  .addGroupPermissions('groupName', addPermissions)
  .then(function(updatedPermissions) {})
  .catch();
```

- `authorized: true` will be assumed if unspecified.
- If the webmethod actions already had `['post', 'put']` then get will be added.

#### exchange.security.removeGroupPermissions(groupName, permissions)

Removes permissions from an existing group.

```javascript
var removePermissions = {
  methods: {
    '/meshname/component/method': {} // empty means delete entire permission
  },
  web: {
    '/component/webmethod': { actions: ['post'] } // delete only specified action
  }
};
```

- Pass an empty object for the permission to be deleted.
- Only the specified webmethod actions are removed. The permission is left otherwise unchanged.

## upserting groups:

_a security group can be upserted, if the group does not exist, it is created, if it does its properties and permissions are merged with the passed group argument by default. The permissions of the group can be overwritten by setting the overwrite option to true_

```javascript
var testUpsertGroup = {
  name: 'TEST_UPSERT_EXISTING',

  custom_data: 'TEST UPSERT EXISTING',

  permissions: {
    methods: {
      //in a /Mesh name/component name/method name - with possible wildcards
      '/meshname/component/method1': { authorized: true }
    },
    events: {
      //in a /Mesh name/component name/event key - with possible wildcards
      '/meshname/component/event1': { authorized: true }
    }
  }
};

adminClient.exchange.security.upsertGroup(testUpsertGroup, function(e, upserted) {
  //group was upserted, permissions were merged with existing group if it existed
});

var testUpsertGroupOverwrite = {
  name: 'TEST_UPSERT_EXISTING',

  custom_data: 'TEST UPSERT EXISTING',

  permissions: {
    methods: {
      //in a /Mesh name/component name/method name - with possible wildcards
      '/meshname/component/method1': { authorized: true }
    },
    events: {
      //in a /Mesh name/component name/event key - with possible wildcards
      '/meshname/component/event1': { authorized: true }
    }
  }
};

adminClient.exchange.security.upsertGroup(
  testUpsertGroupOverwrite,
  { overwritePermissions: true },
  function(e, upserted) {
    //group was upserted, permissions were overwritten with existing group if it existed
  }
);
```

## upserting users:

_a user can be upserted, if the user does not exist, it is created, if it does its properties and group subscriptions are merged with the passed user argument by default. The subscriptions of the user can be overwritten by setting the overwriteSubscriptions option to true_

```javascript

 var testUpsertUser = {
    username: 'TEST_UPSERT_EXISTING_6',
    password: 'TEST PWD',
    custom_data: {
      something: 'useful'
    },
		application_data: {
			something: 'untouchable by the user'
		}
    groups:{}
  };

 testUpsertUser.groups['TEST_UPSERT_EXISTING_6_1'] = true;

 adminClient.exchange.security.upsertUser(testUpsertUser, function(e, result){
  //user was added and subscribed to group TEST_UPSERT_EXISTING_6_1
 });

 var testUpsertUserOverwrite = {
    username: 'TEST_UPSERT_EXISTING_6',
    password: 'TEST PWD',
    custom_data: {
      something: 'useful'
    },
    groups:{}
  };

 testUpsertUserOverwrite.groups['TEST_UPSERT_EXISTING_6_1'] = true;

 adminClient.exchange.security.upsertUser(testUpsertUserOverwrite, {overwriteMemberships:true}, function(e, result){
  //user was added and subscribed to group TEST_UPSERT_EXISTING_6_1 and unsibscribed from all other groups
 });

```

## updateOwnUser

_all users are afforded the right to update their own passwords and custom_data, the application_data property is not editable by the user, and can only be updated by the administrator_

```javascript
//Assuming testUserClient is logged in as myUsername, with password myOldPassword

var myUser = {
  username: 'myUsername',
  password: 'myNewPassword',
  oldPassword: 'myOldPassword', //don't forget the old password
  custom_data: {
    field: 'profane'
  },
  application_data: {
    //NB: this will be ignored - and can only be changed by an administrator
    field: 'sacred'
  }
};

testUserClient.exchange.security.updateOwnUser(myUser, function(e, result) {
  //you have now updated your own user
});
```

## preventing a user from being able to modify the custom_data property

```javascript
const myMesh = await Mesh.create({
	happn: {
	secure: true
	},
	modules: {
		...
	},
	components: {
	security: {
		allowOwnCustomDataUpdates: false //the system security component config is set up with this flag
	},
		...
	}
});
// any user that updates their own user - will not be able to update a special field called custom_data on their user
await testUserClient.exchange.security.updateOwnUser({
	username: 'myOwnUser',
	custom_data: {
		something: 'changed' // this change will be ignored
	}
});
```

## listing users

_users can be listed by username (partial match possible) or group name (exact match only)_

```javascript
//assuming we have a happner-2 client that is logged in with admin rights:
//list all users with a username starting with "test"
adminClient.exchange.security
  .listUsers('test*')
  .then(function(users) {
    //returns:
    // [
    // 	{username:'test1', custom_data:{test:1}},
    // 	{username:'test2', custom_data:{test:2}}
    // ]
    //list all users that belong to the 'test' group (with name 'test')
    // NOTE: optional criteria
    return adminClient.exchange.security.listUsersByGroup('test', {
      criteria: { 'custom_data.extra': 8 }
    });
  })
  .then(function(users) {
    //returns:
    // [
    // 	{username:'test1', custom_data:{extra:8}},
    // 	{username:'test3', custom_data:{extra:8}}
    // ]

    //much faster - just list usernames for users belonging to the 'test' group (with name 'test')
    return adminClient.exchange.security.listUserNamesByGroup('test');
  })
  .then(function(usernames) {
    //returns:
    // [
    // 'test1',
    // 'test3',
    // 'test4'
    // ]
  });
```

## authority delegation:

### system-wide delegation:

By default inter mesh calls are done via the endpoint's user, and component to component calls are done using the \_ADMIN user, this means security is enforced only between the external mesh/client and the edge node of the mesh. To ensure that the originator of a call is checked against the security directory regardless of how deep the exchange call stack execution goes, the authorityDelegationOn config option should be set to true on a secure mesh:

```javascript
const Mesh = require('happner-2');
let meshConfig = { secure: true, authorityDelegationOn: true };
const myMesh1 = await Mesh.create(meshConfig);

//this can be configured per component as well, here is an example that excludes a specific component
meshConfig = {
	secure:true,
	authorityDelegationOn:true,
	modules:{
		"test-module":{
			instance:{
				testMethod:function($happn, callback){

				}
			}
		},
		"test-module-1":{
			instance:{
				testMethod:function($happn, callback){

				}
			}
		}
	},
	components:{
		"test-module":{
			authorityDelegationOn:false//this component will call all consecutive methods using _ADMIN or the configured endpoint user
		},
		"test-module-1":{
			//this component will call all consecutive methods using the origin user
		}
	}
}
const myMesh2 = await Mesh.create(meshConfig);

//here is an example that includes a specific component
meshConfig = {
	secure:true,
	//authorityDelegationOn:true, - by default for all components authority delegation is off
	modules:{
		"test-module":{
			instance:{
				testMethod:function($happn, callback){

				}
			}
		},
		"test-module-1":{
			instance:{
				testMethod:function($happn, callback){

				}
			}
		}
	},
	components:{
		"test-module":{
			authorityDelegationOn:true//this component will call all consecutive methods using _ADMIN or the configured endpoint user
		},
		"test-module-1":{
			//this component will call all consecutive methods using the origin user
		}
	}
}

const myMesh3 = await Mesh.create(meshConfig);
```

### per request delegation:

Provided a user belongs to the special system group "_MESH_DELEGATE", the user is able to invoke a method on the mesh "as" a different user, this is possible using the following mechanisms:

#### inside a component method via $happn:
*code taken from this [demo](https://github.com/happner/happner-suite/blob/master/packages/demos/happner-2/security-exchange-as.js):*
``` javascript
const assert = require('assert');
const Mesh = require('happner-2');
const MeshClient = Mesh.MeshClient;


async function start() {
  class MyComponent {
    async myMethod(param, $happn, $origin) {
      const result = await $happn
        .as('some_other_username') // NB: this is where the magic happns
        .exchange.myComponent.myOtherMethod(param, $origin.username);
      return result;
    }
    // we are calling this other method in the same component for the purposes of brevity, but this could be a call to a remote component and method as well
    async myOtherMethod(param, originUsername, $origin) {
      return `${originUsername} called myOtherMethod as ${$origin.username} with param ${param}`;
    }
  }

  // set up the happner config
  const happnerConfig = {
    name: 'meshname',
    secure: true,
    modules: {
      myComponent: {
        instance: new MyComponent(),
      },
    },
    components: {
      myComponent: {},
    },
  };

  //start the mesh
  const mesh = await Mesh.create(happnerConfig);

  // access the security layer directly (not over websockets)
  const security = mesh.exchange.security;

  //create our delegate user
  await security.addUser({
    username: 'delegate_username',
    password: 'password',
  });

  //link to the mesh delegate
  await security.linkGroup('_MESH_DELEGATE', 'delegate_username');

  //create our delegated user, allowed to call myOtherMethod only
  await security.addUser({
    username: 'some_other_username',
    password: 'password',
    permissions: {
      methods: {
        '/meshname/myComponent/myOtherMethod': { authorized: true },
      },
    },
  });

  // we call the above component from an external client using the user with the name 'delegate_username' as follows:
  const mySession = await MeshClient.create({
    username: 'delegate_username',
    password: 'password',
  });
  const result = await mySession.exchange.myComponent.myMethod(1);
  // eslint-disable-next-line no-undef
  assert(result === 'delegate_username called myOtherMethod as some_other_username with param 1');
  // eslint-disable-next-line no-console
  console.log(result);
  await mesh.stop();
  process.exit();
}

start();
```
#### from outside via the mesh client:
*code taken from this [demo](https://github.com/happner/happner-suite/blob/master/packages/demos/happner-2/security-exchange-as-mesh-client.js):*
``` javascript
const Mesh = require('happner-2');
const MeshClient = Mesh.MeshClient;
const assert = require('assert');

async function start() {
  class MyComponent {
    async myMethod(param, originUsername, $origin) {
      return `${originUsername} called myMethod as ${$origin.username} with param ${param}`;
    }
  }

  // set up the happner config
  const happnerConfig = {
    name: 'meshname',
    secure: true,
    modules: {
      myComponent: {
        instance: new MyComponent(),
      },
    },
    components: {
      myComponent: {},
    },
  };

  //start the mesh
  const mesh = await Mesh.create(happnerConfig);

  // access the security layer directly (not over websockets)
  const security = mesh.exchange.security;

  //create our delegate user
  await security.addUser({
    username: 'delegate_username',
    password: 'password',
  });

  //link to the mesh delegate
  await security.linkGroup('_MESH_DELEGATE', 'delegate_username');

  //create our delegated user, allowed to call myOtherMethod only
  await security.addUser({
    username: 'some_other_username',
    password: 'password',
    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/myComponent/myMethod': { authorized: true },
      },
    },
  });

  // we call the above component from an external happner client using the user with the name 'delegate_username' as follows:
  const mySession = await MeshClient.create({
    username: 'delegate_username',
    password: 'password',
  });
  const result = await mySession.exchange.$call({
    component: 'myComponent',
    method: 'myMethod',
    arguments: [1, 'delegate_username'],
    as: 'some_other_username',
  });
  // eslint-disable-next-line no-console
  console.log(result);
  // eslint-disable-next-line no-undef
  assert(result === 'delegate_username called myMethod as some_other_username with param 1');
  await mesh.stop();
  process.exit();
}

start();

```

#### from outside via the happner-client:
*code taken from this [demo](https://github.com/happner/happner-suite/blob/master/packages/demos/happner-2/security-exchange-as-happner-client.js):*
``` javascript
const Mesh = require('happner-2');
const HappnerClient = require('happner-client');
const assert = require('assert');

async function start() {
  class MyComponent {
    async myMethod(param, originUsername, $origin) {
      return `${originUsername} called myMethod as ${$origin.username} with param ${param}`;
    }
  }

  // set up the happner config
  const happnerConfig = {
    name: 'meshname',
    secure: true,
    modules: {
      myComponent: {
        instance: new MyComponent(),
      },
    },
    components: {
      myComponent: {},
    },
  };

  //start the mesh
  const mesh = await Mesh.create(happnerConfig);

  // access the security layer directly (not over websockets)
  const security = mesh.exchange.security;

  //create our delegate user
  await security.addUser({
    username: 'delegate_username',
    password: 'password',
  });

  //link to the mesh delegate
  await security.linkGroup('_MESH_DELEGATE', 'delegate_username');

  //create our delegated user, allowed to call myOtherMethod only
  await security.addUser({
    username: 'some_other_username',
    password: 'password',
    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/myComponent/myMethod': { authorized: true },
      },
    },
  });

  // we call the above component from an external happner client using the user with the name 'delegate_username' as follows:
  const createdClient = new HappnerClient({ secure: true });
  await createdClient.connect({
    username: 'delegate_username',
    password: 'password',
  });
  const mySession = createdClient.construct({
    myComponent: {
      version: '*',
      methods: {
        myMethod: {},
      },
    },
  });
  const result = await mySession.exchange.$call({
    component: 'myComponent',
    method: 'myMethod',
    arguments: [1, 'delegate_username'],
    as: 'some_other_username',
  });
  // eslint-disable-next-line no-console
  console.log(result);
  // eslint-disable-next-line no-undef
  assert(result === 'delegate_username called myMethod as some_other_username with param 1');
  await mesh.stop();
  process.exit();
}

start();

```

#### from outside via the light-client:
*code taken from this [demo](https://github.com/happner/happner-suite/blob/master/packages/demos/happner-2/security-exchange-as-light-client.js):*
``` javascript
const Mesh = require('happner-2');
const LightClient = require('happner-client').Light;
const assert = require('assert');

async function start() {
  class MyComponent {
    async myMethod(param, originUsername, $origin) {
      return `${originUsername} called myMethod as ${$origin.username} with param ${param}`;
    }
  }

  // set up the happner config
  const happnerConfig = {
    name: 'meshname',
    secure: true,
    modules: {
      myComponent: {
        instance: new MyComponent(),
      },
    },
    components: {
      myComponent: {},
    },
  };

  //start the mesh
  const mesh = await Mesh.create(happnerConfig);

  // access the security layer directly (not over websockets)
  const security = mesh.exchange.security;

  //create our delegate user
  await security.addUser({
    username: 'delegate_username',
    password: 'password',
  });

  //link to the mesh delegate
  await security.linkGroup('_MESH_DELEGATE', 'delegate_username');

  //create our delegated user, allowed to call myOtherMethod only
  await security.addUser({
    username: 'some_other_username',
    password: 'password',
    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/myComponent/myMethod': { authorized: true },
      },
    },
  });

  // we call the above component from an external happner client using the user with the name 'delegate_username' as follows:
  const mySession = new LightClient({ secure: true, domain: 'meshname' });
  await mySession.connect({
    username: 'delegate_username',
    password: 'password',
  });
  const result = await mySession.exchange.$call({
    component: 'myComponent',
    method: 'myMethod',
    arguments: [1, 'delegate_username'],
    as: 'some_other_username',
  });
  // eslint-disable-next-line no-console
  console.log(result);
  // eslint-disable-next-line no-undef
  assert(result === 'delegate_username called myMethod as some_other_username with param 1');
  await mesh.stop();
  process.exit();
}

start();
```

#### from outside via a http RPC request:
*code taken from this [demo](https://github.com/happner/happner-suite/blob/master/packages/demos/happner-2/security-exchange-as-http-rpc.js):*
``` javascript
const Mesh = require('happner-2');
const assert = require('assert');
const test = require('happn-commons-test').create();
const axios = test.axios;

async function start() {
  class MyComponent {
    async myMethod(param, originUsername, $origin) {
      return `${originUsername} called myMethod as ${$origin.username} with param ${param}`;
    }
  }

  // set up the happner config
  const happnerConfig = {
    name: 'meshname',
    secure: true,
    modules: {
      myComponent: {
        instance: new MyComponent(),
      },
    },
    components: {
      myComponent: {},
    },
  };

  //start the mesh
  const mesh = await Mesh.create(happnerConfig);

  // access the security layer directly (not over websockets)
  const security = mesh.exchange.security;

  //create our delegate user
  await security.addUser({
    username: 'delegate_username',
    password: 'password',
  });

  //link to the mesh delegate
  await security.linkGroup('_MESH_DELEGATE', 'delegate_username');

  //create our delegated user, allowed to call myOtherMethod only
  await security.addUser({
    username: 'some_other_username',
    password: 'password',
    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/myComponent/myMethod': { authorized: true },
      },
    },
  });

  const token = (
    await axios.post(`http://127.0.0.1:55000/rest/login`, {
      username: 'delegate_username',
      password: 'password',
    })
  ).data.data.token;

  const result = (
    await axios.post(
      `http://127.0.0.1:55000/rest/method/myComponent/myMethod?happn_token=${token}`,
      {
        parameters: {
          param: 1,
          originUsername: 'delegate_username',
        },
        as: 'some_other_username',
      }
    )
  ).data.data;
  // eslint-disable-next-line no-console
  console.log(result);
  // eslint-disable-next-line no-undef
  assert(result === 'delegate_username called myMethod as some_other_username with param 1');
  await mesh.stop();
  process.exit();
}

start();

```

## lookup tables and permissions:

### lookup permissions

A lookup permission consists of a lookup table name, an array of allowed actions, a regEx, and a handlebars style mapping which transforms the regEx and session information into an array of paths. For example:

```javascript
let lookupPermission = {
	table: 'TABLE1',
	actions: ['on'],
    regex: '^/_data/historianStore/(.*)',
    path: '/device/{{user.custom_data.oem}}/{{user.custom_data.companies}}/{{$1}}'
    }; 
```
Note that multiple lookup permissions can reference the same table. Lookup permissions are attached to groups, not users.
Whenever the user makes a request that matches a regex in one of the lookup permissions of one of their groups, an array of paths will be created.
Any substrings of the form "{{$[0-9]*}}"   (e.g. `{{$1}},{{$2}}...`) refer to capture groups in the permission's regex, while the handlebarred key-type subtrings (e..g `{{user.custom_data.oem}}`) refer to values at that property path of the session info. These values can be arrays or strings.
Once the paths have been mapped, the permission will check if any of these paths are on the lookupTable it is linked to. 
If any are, the action is allowed.

**methods for lookup permission:**
``` javascript
// upsertLookupPermission:: String, Object -> Promise
adminClient.exchange.security.upsertLookupPermission(groupName, permission);

// removeLookupPermission:: String, Object -> Promise
adminClient.exchange.security.removeLookupPermission(groupName, permission);

// fetchLookupPermissions:: String -> Promise(Array)
adminClient.exchange.security.fetchLookupPermissions(groupName)

// unlinkLookupTable:: String, String -> Promise
adminClient.exchange.security.unlinkLookupTable(groupName, tableName);
```
Upsert, remove and fetch are self-explanatory. unlinkLookupTable removes any lookup permissions in  `groupName` that refer to `tableName`

### lookup tables
A lookup table is an object with a name and a list of paths that a lookup permission checks against. For example: 
``` javascript
let lookupTable = {
      name: 'OEM_ABC_LOOKUP',
      paths: [
        '/device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_1',
        '/device/OEM_ABC/COMPANY_GHI/SPECIAL_DEVICE_ID_2'
      ]
}    
```

**methods for lookup table**
``` javascript
// upsertLookupTable:: Object -> Promise
adminClient.exchange.security.upsertLookupTable(lookupTable)

// fetchLookupTable:: String -> Promise(Object) 
adminClient.exchange.security.fetchLookupTable(tableName)

// deleteLookupTable:: String -> Promise
adminClient.exchange.security.deleteLookupTable(tableName)
```
Upsert, fetch and delete work as expected. If we upsert a table and one by that name already exists, the paths for the two tables will be concatenated. 

**methods for lookup paths**

These methods insert or remove a path from a lookup table:
``` javascript
// insertLookupPath:: String, String -> Promise
adminClient.exchange.security.insertLookupPath(tableName, path);
//removeLookupPath:: String, String -> Promise
adminClient.exchange.security.removeLookupPath(tableName, path);
```

hardening responses:
--------------------

Currently happn clients are prevented from accessing the /_exchange/responses/[mesh name]/[component name]/[method name]/\* path using a regular expression check - injected into the underlying happn service by way of a [custom layer](https://github.com/happner/happner-suite/blob/master/packages/happner-2/test/integration/mesh/happn-layer-middleware.js), [over here](https://github.com/happner/happner-suite/blob/master/packages/happner-2/lib/system/happn.js#L222), a better solution to this, is to use the [targetClients functionality](https://github.com/happner/happn-3/blob/master/test/integration/api/targetclients.js) of happn-3, to push _response messages only to the origin of the _request. This is made possible by passing the directResponses:true option in the mesh config, as follows:

```javascript

//this can be done by adding targetResponses:true to the mesh configuration
//the custom layer is now not initialized so there is a small performance gain
//and this is a less wasteful security measure
var meshConfig = {secure:true, directResponses:true}

var myMesh = new Mesh.create(meshConfig, function(e, created){
  ...
})

````

####NB: this is not backwards compatible with any happner clients older than 1.29.0
