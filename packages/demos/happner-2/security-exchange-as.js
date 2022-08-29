const Mesh = require('happner-2');
const MeshClient = Mesh.MeshClient;
const assert = require('assert');

async function start() {
  class MyComponent {
    async myMethod(param, $happn, $origin) {
      const result = await $happn
        .as('some_other_username')
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
        //in a /Mesh name/component name/method name - with possible wildcards
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
