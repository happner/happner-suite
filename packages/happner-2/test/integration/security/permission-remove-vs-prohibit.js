require('../../__fixtures/utils/test_helper').describe({ timeout: 20e3 }, (test) => {
  const path = require('path');
  const Mesh = test.Mesh;
  const test_id = test.newid();
  const dbFileName =
    '.' + path.sep + 'temp' + path.sep + 'b1-permission-remove-vs-prohibit' + test_id + '.nedb';

  /* 
    Generally, at happn-3 level, it is possible to either remove a permission or to add a prohibition to some path.
    These tests show, that happner-2 when removing group or user permissions, does not place a prohibition there. 
    It seems that the only way currently to add a prohibition from Happner-2 is to upsert a group or user with an explicit
    prohibition in its permissions. The only real reason for having an explicit permission, rather than just removing a permission is
    when we have permission on e.g. PATH/1/2/* but we want to prohibit on e.g. PATH/1/2/3/4 
*/

  let mesh;
  let config = {
    name: 'meshname',
    happn: {
      secure: true,
      adminPassword: test_id,
      filename: dbFileName,
    },
    modules: {
      module: {
        instance: {
          method1: function ($happn, callback) {
            $happn.emit('event1');
            callback(null, 'reply1');
          },
          method2: function ($happn, callback) {
            $happn.emit('event2');
            callback(null, 'reply2');
          },
          webmethod1: function (req, res) {
            res.end('ok1');
          },
          webmethod2: function (req, res) {
            res.end('ok2');
          },
        },
      },
    },
    components: {
      component: {
        module: 'module',
        web: {
          routes: {
            webmethod1: 'webmethod1',
            webmethod2: 'webmethod2',
          },
        },
      },
    },
  };

  before(async function () {
    mesh = new Mesh();
    await mesh.initialize(config);
    await mesh.start();
  });

  let adminClient = new Mesh.MeshClient({ secure: true, test: 'adminClient' });

  before('logs in with the admin user', function (done) {
    // Credentials for the login method
    let credentials = {
      username: '_ADMIN', // pending
      password: test_id,
    };

    adminClient
      .login(credentials)
      .then(function () {
        done();
      })
      .catch(done);
  });

  let user,
    groupName = 'group';

  before('create test user and group, and link them', async function () {
    user = {
      username: 'username',
      password: 'password',
    };

    let group = {
      name: groupName,
      custom_data: {
        customString: 'custom1',
        customNumber: 0,
      },
      permissions: {
        methods: {
          '/meshname/component/method1': { authorized: true },
        },
        events: {
          '/meshname/component/event1': { authorized: true },
        },
        web: {
          '/component/webmethod1': {
            authorized: true,
            actions: ['get', 'put', 'post', 'head', 'delete'],
          },
        },
      },
    };
    let results = await Promise.all([
      adminClient.exchange.security.addGroup(group),
      adminClient.exchange.security.addUser(user),
    ]);
    await adminClient.exchange.security.linkGroup(...results);
  });

  let client;

  before('login test user and verify security', async function () {
    client = new Mesh.MeshClient({ test: '_client' });
    await client.login(user);
  });

  after('logs out', function (done) {
    adminClient.disconnect(function (e) {
      done(e);
    }, 99);
  });

  after(async function () {
    await mesh.stop({ reconnect: false });
  });

  let addPermissions = {
    methods: {
      '/meshname/component/method2': { authorized: true },
    },
    events: {
      '/meshname/component/event2': {
        /*authorized: true */
      }, // assumed true
    },
    web: {
      '/component/webmethod1': { authorized: true, actions: ['options'] }, // amend into existing
      '/component/webmethod2': { authorized: true, actions: ['get'] },
    },
  };

  let removePermissions = {
    methods: {
      '/meshname/component/method1': {}, // remove whole permission path
    },
    events: {
      'meshname/component/event1': {},
    },
    web: {
      '/component/webmethod1': {
        actions: [
          // remove ONLY these actions
          'put',
          'head',
        ],
      },
    },
  };

  it('can remove group permissions, does not leave a prohibit', async function () {
    await adminClient.exchange.security.addGroupPermissions(groupName, addPermissions);

    let fetchedGroup = await adminClient.exchange.security.getGroup(groupName);

    test.expect(fetchedGroup).to.eql({
      name: 'group',
      custom_data: {
        customString: 'custom1',
        customNumber: 0,
      },
      permissions: {
        methods: {
          'meshname/component/method2': { authorized: true },
          'meshname/component/method1': { authorized: true },
        },
        events: {
          'meshname/component/event2': { authorized: true },
          'meshname/component/event1': { authorized: true },
        },
        web: {
          'component/webmethod1': {
            authorized: true,
            actions: ['delete', 'get', 'head', 'options', 'post', 'put'],
          },
          'component/webmethod2': {
            authorized: true,
            actions: ['get'],
          },
        },
        data: {},
      },
    });

    await adminClient.exchange.security.removeGroupPermissions(groupName, removePermissions);

    fetchedGroup = await adminClient.exchange.security.getGroup(groupName);

    test.expect(fetchedGroup).to.eql({
      name: 'group',
      custom_data: {
        customString: 'custom1',
        customNumber: 0,
      },
      permissions: {
        methods: {
          'meshname/component/method2': { authorized: true },
        },
        events: {
          'meshname/component/event2': { authorized: true },
        },
        web: {
          'component/webmethod1': {
            authorized: true,
            actions: ['delete', 'get', 'options', 'post'],
          },
          'component/webmethod2': {
            authorized: true,
            actions: ['get'],
          },
        },
        data: {},
      },
    });
  });

  it('upsert a user with permissions, and tests removing permissions from the user does not leave a prohibit', async () => {
    let testUpsertUser = {
      username: 'REMOVE_USER',
      password: 'TEST PWD',
      custom_data: {
        something: 'useful',
      },
      permissions: {
        methods: {
          '/meshname/component/method1': { authorized: true },
        },
        events: {
          '/meshname/component/event1': { authorized: true },
        },
      },
    };
    let testUpsertClient = new Mesh.MeshClient({ secure: true, test: 'testUpsertClient6' });

    await adminClient.exchange.security.addUser(testUpsertUser);
    await testUpsertClient.login(testUpsertUser);

    await adminClient.exchange.security.addUserPermissions('REMOVE_USER', addPermissions);

    let user = await adminClient.exchange.security.getUser('REMOVE_USER');
    test.expect(user.permissions).to.eql({
      methods: {
        'meshname/component/method2': { authorized: true },
        'meshname/component/method1': { authorized: true },
      },
      events: {
        'meshname/component/event2': { authorized: true },
        'meshname/component/event1': { authorized: true },
      },
      web: {
        'component/webmethod1': {
          authorized: true,
          actions: ['options'],
        },
        'component/webmethod2': {
          authorized: true,
          actions: ['get'],
        },
      },
      data: {},
    });
    await adminClient.exchange.security.removeUserPermissions('REMOVE_USER', removePermissions);

    user = await adminClient.exchange.security.getUser('REMOVE_USER');
    test.expect(user.permissions).to.eql({
      methods: {
        'meshname/component/method2': { authorized: true },
      },
      events: {
        'meshname/component/event2': { authorized: true },
      },
      web: {
        'component/webmethod1': {
          authorized: true,
          actions: ['options'],
        },
        'component/webmethod2': {
          authorized: true,
          actions: ['get'],
        },
      },
      data: {},
    });
  });
});
