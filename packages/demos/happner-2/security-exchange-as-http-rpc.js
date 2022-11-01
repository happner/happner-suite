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
