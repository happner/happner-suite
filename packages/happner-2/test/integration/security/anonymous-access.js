require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const test_id = test.newid();
  let mesh = new test.Mesh();
  let groupName = 'TEST GROUP' + test_id;

  const config = {
    name: test_id,
    happn: {
      secure: true,
      services: {
        security: {
          config: {
            allowAnonymousAccess: true,
          },
        },
      },
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
      module2: {
        instance: {
          method1: function ($happn, callback) {
            $happn.emit('event1');
            callback(null, 'reply2-1');
          },
          method2: function ($happn, callback) {
            $happn.emit('event2');
            callback(null, 'reply2-2');
          },
          webmethod1: function (req, res) {
            res.end('ok2-1');
          },
          webmethod2: function (req, res) {
            res.end('ok2-2');
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
      component2: {
        module: 'module2',
        web: {
          routes: {
            webmethod1: 'webmethod1',
            webmethod2: 'webmethod2',
          },
        },
      },
    },
  };

  before(function (done) {
    mesh = new test.Mesh();
    mesh.initialize(config, function (err) {
      if (err) {
        done(err);
      } else {
        mesh.start(done);
      }
    });
  });

  let adminClient = new test.Mesh.MeshClient({ secure: true, test: 'adminClient' });
  let anonymousUserClient = new test.Mesh.MeshClient({ secure: true, test: 'anonymousUserClient' });

  before('logs in with the admin and anonymous users', async () => {
    await adminClient.login({
      username: '_ADMIN', // pending
      password: 'happn',
    });
    await anonymousUserClient.login({
      username: '_ANONYMOUS',
    });
  });

  after('logs out', async () => {
    await adminClient.disconnect();
    await anonymousUserClient.disconnect();
    await mesh.stop({ reconnect: false });
  });

  before('adds test group to the anonymous user', async () => {
    await adminClient.exchange.security.addGroup({
      name: groupName,

      custom_data: {
        customString: 'custom1',
        customNumber: 0,
      },

      permissions: {
        methods: {
          '/component/method1': { authorized: true },
          '/component/method2': { authorized: false },
        },
        events: {
          '/component/event1': { authorized: true },
          '/component/event2': { authorized: false },
        },
        web: {
          '/component/webmethod1': {
            authorized: true,
            actions: ['get'],
          },
          '/component/webmethod2': {
            authorized: false,
            actions: ['*'],
          },
        },
      },
    });
    await adminClient.exchange.security.linkAnonymousGroup(groupName);
  });

  it('fails to update own details with anonymous user', async () => {
    let eMessage;
    try {
      await anonymousUserClient.exchange.security.updateOwnUser({
        username: '_ANONYMOUS',
        custom_data: 'test-data',
      });
    } catch (e) {
      eMessage = e.message;
    }
    test.expect(eMessage).to.be('Bad Password Arguments');

    try {
      await anonymousUserClient.exchange.security.resetPassword('test@test.com');
    } catch (e) {
      eMessage = e.message;
    }
    test.expect(eMessage).to.be('providerResetPassword not implemented.');
    try {
      await anonymousUserClient.exchange.security.resetPassword();
    } catch (e) {
      eMessage = e.message;
    }
    test.expect(eMessage).to.be('Invalid arguments');
  });

  it('succeeds and fails with method access', async () => {
    test.expect(await tryMethod(anonymousUserClient, 'component', 'method1')).to.be(true);
    test.expect(await tryMethod(anonymousUserClient, 'component', 'method2')).to.be(false);
  });

  it('succeeds and fails with events access', async () => {
    test.expect(await tryEvent(anonymousUserClient, 'component', 'event1')).to.be(true);
    test.expect(await tryEvent(anonymousUserClient, 'component', 'event2')).to.be(false);
  });

  it('succeeds and fails with web access', async () => {
    test.expect(await tryWeb(anonymousUserClient, 'component', 'webmethod1', 'GET')).to.be(true);
    test
      .expect(await tryWeb(anonymousUserClient, 'component', 'webmethod1', 'POST', {}))
      .to.be(false);
    test.expect(await tryWeb(anonymousUserClient, 'component', 'webmethod2', 'GET')).to.be(false);
  });

  it('unlinks the group - ensures the anonymous user has no access', async () => {
    await adminClient.exchange.security.unlinkAnonymousGroup(groupName);
    await test.delay(2000);
    test.expect(await tryMethod(anonymousUserClient, 'component', 'method1')).to.be(false);
    test.expect(await tryMethod(anonymousUserClient, 'component', 'method2')).to.be(false);
    test.expect(await tryEvent(anonymousUserClient, 'component', 'event1')).to.be(false);
    test.expect(await tryEvent(anonymousUserClient, 'component', 'event2')).to.be(false);
    test.expect(await tryWeb(anonymousUserClient, 'component', 'webmethod1', 'GET')).to.be(false);
    test
      .expect(await tryWeb(anonymousUserClient, 'component', 'webmethod1', 'POST', {}))
      .to.be(false);
    test.expect(await tryWeb(anonymousUserClient, 'component', 'webmethod2', 'GET')).to.be(false);
  });

  context('Anonymous user-permissions', () => {
    let permissions = {
      methods: {
        '/component2/method1': { authorized: true },
      },
      events: {
        '/component2/event1': { authorized: true },
      },
      web: {
        '/component2/webmethod1': {
          authorized: true,
          actions: ['get'],
        },
      },
    };

    before('It upserts permissions to the anonymous user', (done) => {
      adminClient.exchange.security.addUserPermissions('_ANONYMOUS', permissions, done);
    });

    it('succeeds and fails with method access', async () => {
      test.expect(await tryMethod(anonymousUserClient, 'component2', 'method1')).to.be(true);
      test.expect(await tryMethod(anonymousUserClient, 'component2', 'method2')).to.be(false);
    });

    it('succeeds and fails with events access', async () => {
      test.expect(await tryEvent(anonymousUserClient, 'component2', 'event1')).to.be(true);
      test.expect(await tryEvent(anonymousUserClient, 'component2', 'event2')).to.be(false);
    });

    it('succeeds and fails with web access', async () => {
      test.expect(await tryWeb(anonymousUserClient, 'component2', 'webmethod1', 'GET')).to.be(true);
      test
        .expect(await tryWeb(anonymousUserClient, 'component2', 'webmethod1', 'POST', {}))
        .to.be(false);
      test
        .expect(await tryWeb(anonymousUserClient, 'component2', 'webmethod2', 'GET'))
        .to.be(false);
    });

    it('removes the user permissions - ensures the anonymous user has no access', async () => {
      await adminClient.exchange.security.removeUserPermissions('_ANONYMOUS', permissions);
      await test.delay(2000);
      test.expect(await tryMethod(anonymousUserClient, 'component', 'method1')).to.be(false);
      test.expect(await tryMethod(anonymousUserClient, 'component', 'method2')).to.be(false);
      test.expect(await tryEvent(anonymousUserClient, 'component', 'event1')).to.be(false);
      test.expect(await tryEvent(anonymousUserClient, 'component', 'event2')).to.be(false);
      test.expect(await tryWeb(anonymousUserClient, 'component', 'webmethod1', 'GET')).to.be(false);
      test
        .expect(await tryWeb(anonymousUserClient, 'component', 'webmethod1', 'POST', {}))
        .to.be(false);
      test.expect(await tryWeb(anonymousUserClient, 'component', 'webmethod2', 'GET')).to.be(false);
    });
  });

  async function tryMethod(client, component, method, args) {
    try {
      await client.exchange[component][method].apply(args);
      return true;
    } catch (e) {
      if (e.message === 'unauthorized') {
        return false;
      }
      throw e;
    }
  }

  async function tryWeb(client, component, method, verb, body) {
    let response;
    try {
      response = await doRequest(`${component}/${method}`, client.token, verb, body);
      if (response.status === 200) return true;
    } catch (e) {
      if (e.message === 'Request failed with status code 403') return false;
    }
    throw new Error(`unexpected response`);
  }

  async function tryEvent(client, component, event) {
    try {
      await client.event[component].on(event, () => {});
      return true;
    } catch (e) {
      if (e.message === 'unauthorized') {
        return false;
      }
      throw e;
    }
  }

  async function doRequest(path, token, verb, body) {
    const requestor = test.axios.create({ baseURL: 'http://127.0.0.1:55000' });

    if (verb === 'POST') {
      return requestor.post(path + '?happn_token=' + token, body);
    }

    if (verb === 'GET') {
      return requestor.get(path + '?happn_token=' + token);
    }
  }
});
