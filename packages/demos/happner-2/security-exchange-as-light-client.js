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
