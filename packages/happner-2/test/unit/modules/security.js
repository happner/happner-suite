require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const SecurityModule = require('../../../lib/modules/security/index');
  it('can initialize the security component', async () => {
    const security = createSecurityModule(mockSecurityService());
    test.expect(security.__adminUser).to.be(null);
    test.expect(security.__initialized).to.be(false);
    test.expect(security.__systemGroups).to.eql({});
    test.expect(security.__attachToSecurityChangesActivated).to.be(false);
    test.expect(security.__attachToSessionChangesActivated).to.be(false);
  });
  it('links a group, using just strings', function (done) {
    const securityService = mockSecurityService(
      { username: 'testUser', permissions: {} },
      { name: 'testGroup', permissions: {} }
    );
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup($happn, 'testGroup', 'testUser', (e, linked) => {
      test.expect(e).to.be(null);
      test.expect(linked).to.be(true);
      test.expect(securityService.users.getUser.lastCall.args[0]).to.be('testUser');
      test.expect(securityService.groups.getGroup.lastCall.args[0]).to.be('testGroup');
      done();
    });
  });

  it('links a group, using group as string, user as object', function (done) {
    const securityService = mockSecurityService(
      { username: 'testUser', permissions: {} },
      { name: 'testGroup', permissions: {} }
    );
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup(
      $happn,
      'testGroup',
      { username: 'testUser', permissions: {} },
      (e, linked) => {
        test.expect(e).to.be(null);
        test.expect(linked).to.be(true);
        test.expect(securityService.users.getUser.lastCall).to.eql(null);
        test.expect(securityService.groups.getGroup.lastCall.args[0]).to.be('testGroup');
        done();
      }
    );
  });

  it('links a group, using group as string, group as object', function (done) {
    const securityService = mockSecurityService(
      { username: 'testUser', permissions: {} },
      { name: 'testGroup', permissions: {} }
    );
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup($happn, { name: 'testGroup', permissions: {} }, 'testUser', (e, linked) => {
      test.expect(e).to.be(null);
      test.expect(linked).to.be(true);
      test.expect(securityService.users.getUser.lastCall.args[0]).to.be('testUser');
      test.expect(securityService.groups.getGroup.lastCall).to.eql(null);
      done();
    });
  });

  it('fails to link a group, could not find group', function (done) {
    const securityService = mockSecurityService({ username: 'testUser', permissions: {} }, null);
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup($happn, 'testGroup', 'testUser', (e) => {
      test.expect(e.message).to.be('group with name testGroup does not exist');
      done();
    });
  });

  it('fails to link a group, could not find user', function (done) {
    const securityService = mockSecurityService(null, { name: 'testGroup', permissions: {} });
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup($happn, 'testGroup', 'testUser', (e) => {
      test.expect(e.message).to.be('user with name testUser does not exist');
      done();
    });
  });

  it('fails to link a group, getUser error', function (done) {
    const securityService = mockSecurityService(
      { username: 'testUser', permissions: {} },
      { name: 'testGroup', permissions: {} }
    );
    securityService.users.getUser = test.sinon.stub().callsArgWith(1, new Error('test error'));
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup($happn, 'testGroup', 'testUser', (e) => {
      test.expect(e.message).to.be('test error');
      done();
    });
  });

  it('fails to link a group, getGroup error', function (done) {
    const securityService = mockSecurityService(
      { username: 'testUser', permissions: {} },
      { name: 'testGroup', permissions: {} }
    );
    securityService.groups.getGroup = test.sinon.stub().callsArgWith(1, new Error('test error'));
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup($happn, 'testGroup', 'testUser', (e) => {
      test.expect(e.message).to.be('test error');
      done();
    });
  });

  it('fails to link a group, linkGroup error', function (done) {
    const securityService = mockSecurityService(
      { username: 'testUser', permissions: {} },
      { name: 'testGroup', permissions: {} }
    );
    securityService.users.linkGroup = test.sinon.stub().callsArgWith(3, new Error('test error'));
    const $happn = mockHappn();
    const security = createSecurityModule(securityService);
    security.__initialized = true;
    security.linkGroup($happn, 'testGroup', 'testUser', (e) => {
      test.expect(e.message).to.be('test error');
      done();
    });
  });

  function mockHappn() {
    return {};
  }
  function createSecurityModule(securityService) {
    const security = new SecurityModule();
    security.__securityService = securityService;
    return security;
  }
  function mockSecurityService(user = null, group = null) {
    return {
      users: {
        linkGroup: test.sinon.stub().callsArgWith(3, null, true),
        getUser: test.sinon.stub().callsArgWith(1, null, user),
      },
      groups: {
        getGroup: test.sinon.stub().callsArgWith(1, null, group),
      },
    };
  }
});
