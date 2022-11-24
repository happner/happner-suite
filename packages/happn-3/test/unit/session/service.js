const test = require('../../__fixtures/utils/test_helper').create();

describe(test.testName(__filename, 3), function () {
  const Logger = require('happn-logger');
  const SessionService = require('../../../lib/services/session/service');
  const ClientBase = require('../../../lib/client');
  const LocalPlugin = require('../../../lib/services/session/localclient').Wrapper;
  const uuid = require('happn-commons').uuid;

  this.timeout(5000);
  let mockHappn;

  beforeEach(() => {
    mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        security: {
          revokeToken: test.sinon.stub(),
          getCookieName: test.sinon.stub(),
        },
        error: {
          handleSystem: test.sinon.stub(),
        },
        server: {},
        protocol: {
          processMessageIn: test.sinon.stub(),
          processSystemOut: test.sinon.stub(),
        },
        subscription: {
          clearSessionSubscriptions: test.sinon.stub(),
        },
        system: {
          getDescription: test.sinon.stub(),
        },
      },
    };
  });

  afterEach(() => {
    mockHappn = null;
  });

  it('should test the stats method', function () {
    const sessionService = new SessionService({
      logger: Logger,
    });
    test.expect(sessionService.stats()).to.eql({
      sessions: 0,
    });
  });

  it('should test the __safeSessionData method', function () {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const safe = sessionService.__safeSessionData({
      id: 'sessionData.id',
      info: 'sessionData.info',
      type: 'sessionData.type',
      timestamp: 'sessionData.timestamp',
      policy: 'sessionData.policy',
      token: 'sessionData.token',
      not: 'visible',
      user: {
        username: 'username',
        publicKey: 'publicKey',
        secret: 'secret',
      },
      url: 'test.url.com',
    });
    test.expect(safe).to.eql({
      id: 'sessionData.id',
      info: 'sessionData.info',
      type: 'sessionData.type',
      msgCount: undefined,
      legacyPing: false,
      timestamp: 'sessionData.timestamp',
      policy: 'sessionData.policy',
      protocol: undefined,
      cookieName: undefined,
      browser: false,
      intraProc: false,
      sourceAddress: null,
      sourcePort: null,
      upgradeUrl: 'test.url.com',
      happnVersion: undefined,
      happn: undefined,
      user: { username: 'username', publicKey: 'publicKey' },
      authType: undefined,
    });
  });

  it('should test the onConnect method', function (done) {
    const sessionService = new SessionService({
      logger: Logger,
    });
    sessionService.happn = {
      services: {
        system: {},
      },
    };
    sessionService.happn.services.system = {
      getDescription: function () {
        return 'description';
      },
    };
    var client = {
      on: function () {},
    };

    sessionService.on('connect', function (data) {
      test.expect(client.happnConnected > 0).to.be(true);
      test.expect(client.sessionId).to.not.be(undefined);
      test.expect(data).to.eql({
        id: client.sessionId,
        info: undefined,
        type: undefined,
        msgCount: 0,
        legacyPing: false,
        timestamp: undefined,
        policy: undefined,
        protocol: 'happn',
        cookieName: undefined,
        browser: false,
        intraProc: true,
        sourceAddress: undefined,
        sourcePort: undefined,
        upgradeUrl: undefined,
        happnVersion: undefined,
        happn: 'description',
        authType: undefined,
      });
      done();
    });

    sessionService.onConnect(client);
  });

  it('should test the __configureSession method', function () {
    const sessionService = new SessionService({ logger: Logger });
    var message = {
      data: {
        protocol: 'happn_4',
      },
    };
    var client = {
      sessionId: 0,
    };
    sessionService.__configureSession(message, client);

    sessionService.__sessions[0] = {
      client: client,
      data: {},
    };
    sessionService.__configureSession(message, client);
    test.expect(client.happnProtocol).to.be('happn_4');
  });

  it('should test the getSessionEventJSON method, anonymous', function () {
    const sessionService = new SessionService({ logger: Logger });
    test
      .expect(
        sessionService.getSessionEventJSON('test-event', {
          sourceAddress: '127.0.0.1',
          sourcePort: 5678,
          upgradeUrl: 'http://test/upgrade',
          happnVersion: '1.2.3',
          protocol: 'happn_4',
        })
      )
      .to.eql(
        JSON.stringify({
          event: 'test-event',
          username: 'anonymous (unsecure connection)',
          sourceAddress: '127.0.0.1',
          sourcePort: 5678,
          upgradeUrl: 'http://test/upgrade',
          happnVersion: '1.2.3',
          happnProtocolVersion: 'happn_4',
        })
      );
  });

  it('should test the getSessionEventJSON method, user', function () {
    const sessionService = new SessionService({ logger: Logger });
    test
      .expect(
        sessionService.getSessionEventJSON('test-event', {
          user: {
            username: 'test-username',
          },
          sourceAddress: '127.0.0.1',
          sourcePort: 5678,
          upgradeUrl: 'http://test/upgrade',
          happnVersion: '1.2.3',
          protocol: 'happn_4',
        })
      )
      .to.eql(
        JSON.stringify({
          event: 'test-event',
          username: 'test-username',
          sourceAddress: '127.0.0.1',
          sourcePort: 5678,
          upgradeUrl: 'http://test/upgrade',
          happnVersion: '1.2.3',
          happnProtocolVersion: 'happn_4',
        })
      );
  });

  it('should test the logSessionAttached method', function (done) {
    const sessionService = new SessionService({
      logger: {
        createLogger: () => {
          return {
            $$TRACE: () => {},
            debug: (message) => {
              test.expect(message).to.eql(
                JSON.stringify({
                  event: 'session attached',
                  username: 'test-username',
                  sourceAddress: '127.0.0.1',
                  sourcePort: 5678,
                  upgradeUrl: 'http://test/upgrade',
                  happnVersion: '1.2.3',
                  happnProtocolVersion: 'happn_4',
                })
              );
              done();
            },
          };
        },
      },
    });
    sessionService.config = {};
    sessionService.logSessionAttached({
      user: {
        username: 'test-username',
      },
      sourceAddress: '127.0.0.1',
      sourcePort: 5678,
      upgradeUrl: 'http://test/upgrade',
      happnVersion: '1.2.3',
      protocol: 'happn_4',
    });
  });

  it('should test the logSessionDetached method', function (done) {
    const sessionService = new SessionService({
      logger: {
        createLogger: () => {
          return {
            $$TRACE: () => {},
            debug: (message) => {
              test.expect(message).to.eql(
                JSON.stringify({
                  event: 'session detached',
                  username: 'test-username',
                  sourceAddress: '127.0.0.1',
                  sourcePort: 5678,
                  upgradeUrl: 'http://test/upgrade',
                  happnVersion: '1.2.3',
                  happnProtocolVersion: 'happn_4',
                })
              );
              done();
            },
          };
        },
      },
    });
    sessionService.config = {};
    sessionService.logSessionDetached({
      user: {
        username: 'test-username',
      },
      sourceAddress: '127.0.0.1',
      sourcePort: 5678,
      upgradeUrl: 'http://test/upgrade',
      happnVersion: '1.2.3',
      protocol: 'happn_4',
    });
  });

  it('should test the logSessionAttached method is disabled', function (done) {
    const sessionService = new SessionService({
      logger: {
        createLogger: () => {
          return {
            $$TRACE: () => {},
            info: (message) => {
              test.expect(message).to.eql(
                JSON.stringify({
                  event: 'session attached',
                  username: 'test-username',
                  sourceAddress: '127.0.0.1',
                  sourcePort: 5678,
                  upgradeUrl: 'http://test/upgrade',
                  happnVersion: '1.2.3',
                  happnProtocolVersion: 'happn_4',
                })
              );
              done(new Error('should not have happened'));
            },
          };
        },
      },
    });
    sessionService.config = { disableSessionEventLogging: true };
    sessionService.logSessionAttached({
      user: {
        username: 'test-username',
      },
      sourceAddress: '127.0.0.1',
      sourcePort: 5678,
      upgradeUrl: 'http://test/upgrade',
      happnVersion: '1.2.3',
      protocol: 'happn_4',
    });
    setTimeout(done, 2000);
  });

  it('should test the logSessionDetached method is disabled', function (done) {
    const sessionService = new SessionService({
      logger: {
        createLogger: () => {
          return {
            $$TRACE: () => {},
            info: (message) => {
              test.expect(message).to.eql(
                JSON.stringify({
                  event: 'session detached',
                  username: 'test-username',
                  sourceAddress: '127.0.0.1',
                  sourcePort: 5678,
                  upgradeUrl: 'http://test/upgrade',
                  happnVersion: '1.2.3',
                  happnProtocolVersion: 'happn_4',
                })
              );
              done(new Error('should not have happened'));
            },
          };
        },
      },
    });
    sessionService.config = { disableSessionEventLogging: true };
    sessionService.logSessionDetached({
      user: {
        username: 'test-username',
      },
      sourceAddress: '127.0.0.1',
      sourcePort: 5678,
      upgradeUrl: 'http://test/upgrade',
      happnVersion: '1.2.3',
      protocol: 'happn_4',
    });
    setTimeout(done, 2000);
  });

  it('processRevokeSessionToken, calls callback with error and message', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    sessionService.happn = mockHappn;
    const callback = test.sinon.stub();
    const mockMessage = {
      session: {
        token: 'mockToken',
      },
    };

    mockHappn.services.security.revokeToken.callsFake((_, __, cb) => {
      test.chai.expect(_).to.equal('mockToken');
      test.chai.expect(__).to.equal('mockReason');

      cb(new Error('test error'));
    });

    sessionService.processRevokeSessionToken(mockMessage, 'mockReason', callback);

    test.chai
      .expect(callback)
      .to.have.been.calledOnceWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error')),
        mockMessage
      );
  });

  it('getClient, returns client', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.onConnect({ on: test.sinon.stub() });

    const result = sessionService.getClient('033e720c-b65a-4bd4-9a80-09175af398eb');

    test.chai.expect(result).to.have.ownProperty('happnConnected', 1666181617938);
    test.chai
      .expect(result)
      .to.have.ownProperty('sessionId', '033e720c-b65a-4bd4-9a80-09175af398eb');

    uuidStub.restore();
    nowStub.restore();
  });

  it('getClient, returns null', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    const result = sessionService.getClient('033e720c-b65a-4bd4-9a80-09175af398eb');

    test.chai.expect(result).to.be.null;
  });

  it('getSession, returns session', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.system.getDescription.returns('mockDescription');
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.onConnect(client);

    const result = sessionService.getSession('033e720c-b65a-4bd4-9a80-09175af398eb');

    test.chai.expect(result).to.eql({
      address: 'mockAdress',
      encrypted: true,
      happn: 'mockDescription',
      headers: {},
      id: '033e720c-b65a-4bd4-9a80-09175af398eb',
      msgCount: 0,
      protocol: 'happn',
      url: 'mockUrl',
    });

    uuidStub.restore();
    nowStub.restore();
  });

  it('getSession, returns null', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    const result = sessionService.getSession('033e720c-b65a-4bd4-9a80-09175af398eb');

    test.chai.expect(result).to.be.null;
  });

  it.skip('disconnectSessions', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();

    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.system.getDescription.returns('mockDescription');
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.onConnect(client);

    sessionService.happn = mockHappn;
    sessionService.disconnectSessions('test', 'mockMessage', callback, false);

    uuidStub.restore();
    nowStub.restore();
  });

  it('finalizeDisconnect, returns and calls callback if session is falsy', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();

    sessionService.finalizeDisconnect(
      { sessionId: '033e720c-b65a-4bd4-9a80-09175af398eb' },
      callback
    );

    test.chai.expect(callback).to.have.been.calledOnceWithExactly();
  });

  it('finalizeDisconnect, calls callback', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();
    const remove = test.sinon.stub();

    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.system.getDescription.returns('mockDescription');
    mockHappn.services.cache.create.returns({
      remove,
    });
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.initialize({ primusOpts: '' }, test.sinon.stub());
    sessionService.onConnect(client);
    sessionService.initializeCaches(test.sinon.stub());
    sessionService.finalizeDisconnect(
      { sessionId: '033e720c-b65a-4bd4-9a80-09175af398eb' },
      callback
    );

    test.chai.expect(callback).to.have.been.calledOnceWithExactly();
    test.chai
      .expect(remove)
      .to.have.been.calledOnceWithExactly('033e720c-b65a-4bd4-9a80-09175af398eb');

    uuidStub.restore();
    nowStub.restore();
  });

  it('finalizeDisconnect, calls callback with error', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();
    const remove = test.sinon.stub().throws(new Error('test error'));

    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.system.getDescription.returns('mockDescription');
    mockHappn.services.cache.create.returns({
      remove,
    });
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.initialize({ primusOpts: '' }, test.sinon.stub());
    sessionService.onConnect(client);
    sessionService.initializeCaches(test.sinon.stub());
    sessionService.finalizeDisconnect(
      { sessionId: '033e720c-b65a-4bd4-9a80-09175af398eb' },
      callback
    );

    test.chai
      .expect(callback)
      .to.have.been.calledOnceWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );

    uuidStub.restore();
    nowStub.restore();
  });

  it('getClientUpgradeHeaders, returns if headers is falsy', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    sessionService.happn = mockHappn;

    const result = sessionService.getClientUpgradeHeaders(null);

    test.chai.expect(result).to.eql({});
  });

  it('getClientUpgradeHeaders, returns if headersObj', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    const headers = {
      'x-forwarded-proto': 'x-forwarded-proto',
      'x-forwarded-port': 'x-forwarded-port',
      'x-forwarded-for': 'x-forwarded-for',
      item: 'item',
    };
    const result = sessionService.getClientUpgradeHeaders(headers);

    test.chai.expect(result).to.eql({
      'x-forwarded-proto': 'x-forwarded-proto',
      'x-forwarded-port': 'x-forwarded-port',
      'x-forwarded-for': 'x-forwarded-for',
    });
  });

  it('socketErrorWarning, first string exists', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    const err = {
      message: 'Failed to decode incoming data',
    };
    const result = sessionService.socketErrorWarning(err);

    test.chai.expect(result).to.be.true;
  });

  it('socketErrorWarning, second string exists', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    const err = {
      message: 'Invalid WebSocket frame',
    };
    const result = sessionService.socketErrorWarning(err);

    test.chai.expect(result).to.be.true;
  });

  it('socketErrorWarning, none exists', () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    const err = {
      message: '',
    };
    const result = sessionService.socketErrorWarning(err);

    test.chai.expect(result).to.be.false;
  });

  it('securityDirectoryChanged, resolves', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    const getClientSpy = test.sinon.spy(sessionService, 'getClient');

    const result = sessionService.securityDirectoryChanged('whatHappnd', 'changedData', [
      { id: 1 },
    ]);

    await test.chai.expect(result).to.eventually.eql([{ id: 1 }]);
    test.chai.expect(getClientSpy).to.not.have.been.called;

    getClientSpy.restore();
  });

  it('securityDirectoryChanged, resolves if client is falsy', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    mockHappn.services.protocol.processSystemOut.callsFake((_, sessionCB) => {
      sessionCB();
    });
    sessionService.happn = mockHappn;

    const getClientSpy = test.sinon.spy(sessionService, 'getClient');

    const result = sessionService.securityDirectoryChanged('link-group', 'changedData', [
      { id: '033e720c-b65a-4bd4-9a80-09175af398eb' },
    ]);

    await test.chai
      .expect(result)
      .to.eventually.eql([{ id: '033e720c-b65a-4bd4-9a80-09175af398eb' }]);
    test.chai.expect(getClientSpy).to.have.been.called;
    test.chai.expect(mockHappn.services.protocol.processSystemOut).to.not.have.been.called;

    getClientSpy.restore();
  });

  it('securityDirectoryChanged, resolves if client is truthy', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.protocol.processSystemOut.callsFake((_, sessionCB) => {
      sessionCB();
    });
    mockHappn.services.system.getDescription.returns('mockDescription');
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);
    const getClientSpy = test.sinon.spy(sessionService, 'getClient');

    sessionService.onConnect(client);

    const result = sessionService.securityDirectoryChanged('link-group', 'changedData', [
      { id: '033e720c-b65a-4bd4-9a80-09175af398eb' },
    ]);

    await test.chai
      .expect(result)
      .to.eventually.eql([{ id: '033e720c-b65a-4bd4-9a80-09175af398eb' }]);
    test.chai.expect(getClientSpy).to.have.been.called;
    test.chai
      .expect(mockHappn.services.protocol.processSystemOut)
      .to.have.been.calledOnceWithExactly(
        {
          session: { id: '033e720c-b65a-4bd4-9a80-09175af398eb' },
          eventKey: 'security-data-changed',
          data: {
            whatHappnd: 'link-group',
            changedData: 'changedData',
          },
        },
        test.sinon.match.instanceOf(Function)
      );

    getClientSpy.restore();
    uuidStub.restore();
    nowStub.restore();
  });

  it('securityDirectoryChanged, rejects with error', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.protocol.processSystemOut.throws(new Error('test error'));
    mockHappn.services.system.getDescription.returns('mockDescription');
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);
    const getClientSpy = test.sinon.spy(sessionService, 'getClient');

    sessionService.onConnect(client);

    const result = sessionService.securityDirectoryChanged('link-group', 'changedData', [
      { id: '033e720c-b65a-4bd4-9a80-09175af398eb' },
    ]);

    await test.chai.expect(result).to.eventually.be.rejectedWith('test error');
    test.chai.expect(getClientSpy).to.have.been.called;

    getClientSpy.restore();
    uuidStub.restore();
    nowStub.restore();
  });

  it('onDisconnect, calls finalizeDisconnect', async () => {
    const sessionService = new SessionService({
      logger: {
        createLogger: test.sinon.stub().returns({
          warn: test.sinon.stub(),
          $$TRACE: test.sinon.stub(),
          debug: test.sinon.stub(),
        }),
      },
    });
    const remove = test.sinon.stub();
    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.cache.create.returns({
      remove,
    });
    mockHappn.services.system.getDescription.returns('mockDescription');
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.initialize({ primusOpts: '' }, test.sinon.stub());
    sessionService.onConnect(client);
    sessionService.initializeCaches(test.sinon.stub());
    sessionService.onDisconnect({ sessionId: '033e720c-b65a-4bd4-9a80-09175af398eb' });

    test.chai.expect(mockHappn.services.subscription.clearSessionSubscriptions).to.have.been.called;
    test.chai
      .expect(remove)
      .to.have.been.calledOnceWithExactly('033e720c-b65a-4bd4-9a80-09175af398eb');
    test.chai.expect(sessionService.log.warn).to.not.have.been.called;

    uuidStub.restore();
    nowStub.restore();
  });

  it('onDisconnect, finalizeDisconnect callback gets called with error', async () => {
    const sessionService = new SessionService({
      logger: {
        createLogger: test.sinon.stub().returns({
          warn: test.sinon.stub(),
          $$TRACE: test.sinon.stub(),
          debug: test.sinon.stub(),
        }),
      },
    });
    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.cache.create.returns({
      remove: test.sinon.stub().throws(new Error('test error')),
    });
    mockHappn.services.system.getDescription.returns('mockDescription');
    sessionService.happn = mockHappn;

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.initialize({ primusOpts: '' }, test.sinon.stub());
    sessionService.onConnect(client);
    sessionService.initializeCaches(test.sinon.stub());
    sessionService.onDisconnect({ sessionId: '033e720c-b65a-4bd4-9a80-09175af398eb' });

    test.chai
      .expect(sessionService.log.warn)
      .to.have.been.calledOnceWithExactly(
        'client disconnect error, for session id: ' + '033e720c-b65a-4bd4-9a80-09175af398eb',
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );

    uuidStub.restore();
    nowStub.restore();
  });

  it('initializeCaches, config.activeSessionsCache is falsy', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();

    mockHappn.services.cache.create.returns('mockActiveSession');
    sessionService.happn = mockHappn;

    sessionService.initialize({ activeSessionsCache: null }, test.sinon.stub());
    sessionService.initializeCaches(callback);

    test.chai.expect(callback).to.have.been.calledOnceWithExactly();
    test.chai
      .expect(mockHappn.services.cache.create)
      .to.have.been.calledOnceWithExactly('service_session_active_sessions', {
        type: 'static',
      });
    test.chai.expect(sessionService.config.activeSessionsCache).to.eql({
      type: 'static',
    });
  });

  it('initializeCaches, config.activeSessionsCache is falsy', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();

    mockHappn.services.cache.create.returns('mockActiveSession');
    sessionService.happn = mockHappn;

    sessionService.initialize({ activeSessionsCache: { type: 'dynamic' } }, test.sinon.stub());
    sessionService.initializeCaches(callback);

    test.chai.expect(callback).to.have.been.calledOnceWithExactly();
    test.chai
      .expect(mockHappn.services.cache.create)
      .to.have.been.calledOnceWithExactly('service_session_active_sessions', {
        type: 'dynamic',
      });
  });

  it('localClient, calls callback with error', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();

    sessionService.happn = mockHappn;

    const createStub = test.sinon.stub(ClientBase, 'create').callsFake((_, cb) => {
      cb(new Error('test error'));
    });

    sessionService.localClient({}, callback);

    test.chai.expect(createStub).to.have.been.calledOnceWithExactly(
      {
        config: {},
        plugin: LocalPlugin,
        context: mockHappn,
      },
      test.sinon.match.instanceOf(Function)
    );
    test.chai
      .expect(callback)
      .to.have.been.calledOnceWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );

    createStub.restore();
  });

  it('localClient, calls callback with new instance', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();
    const config = test.sinon.stub();

    sessionService.happn = mockHappn;

    const createStub = test.sinon.stub(ClientBase, 'create').callsFake((_, cb) => {
      cb(null, ClientBase);
    });

    sessionService.localClient(config, callback);

    test.chai.expect(createStub).to.have.been.calledOnceWithExactly(
      {
        config: {},
        plugin: LocalPlugin,
        context: mockHappn,
      },
      test.sinon.match.instanceOf(Function)
    );
    test.chai.expect(config).to.have.been.calledOnceWithExactly(null, ClientBase);

    createStub.restore();
  });

  it('attachSession, returns if sessionData is equal to null', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const callback = test.sinon.stub();
    const config = test.sinon.stub();

    sessionService.happn = mockHappn;

    const result = sessionService.attachSession(config, callback);

    test.chai.expect(result).to.have.returned;
    test.chai.expect(result).to.equal();
  });

  it('attachSession, returns sessionData', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const set = test.sinon.stub();

    sessionService.happn = mockHappn;

    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
    };

    mockHappn.services.cache.create.returns({
      set,
    });
    mockHappn.services.system.getDescription.returns('mockDescription');

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.initialize({ disableSessionEventLogging: true }, test.sinon.stub());
    sessionService.initializeCaches(test.sinon.stub());
    sessionService.onConnect(client);

    const result = sessionService.attachSession('033e720c-b65a-4bd4-9a80-09175af398eb', {
      item1: 'item1',
    });

    test.chai.expect(result).to.eql({
      address: 'mockAdress',
      encrypted: true,
      happn: 'mockDescription',
      headers: {},
      id: '033e720c-b65a-4bd4-9a80-09175af398eb',
      item1: 'item1',
      msgCount: 0,
      protocol: 'happn',
      url: 'mockUrl',
      authType: undefined,
    });

    test.chai
      .expect(set)
      .to.have.been.calledOnceWithExactly('033e720c-b65a-4bd4-9a80-09175af398eb', {
        msgCount: 0,
        id: '033e720c-b65a-4bd4-9a80-09175af398eb',
        protocol: 'happn',
        happn: 'mockDescription',
        headers: {},
        encrypted: true,
        address: 'mockAdress',
        url: 'mockUrl',
        item1: 'item1',
        authType: undefined,
      });

    uuidStub.restore();
    nowStub.restore();
  });

  it('handleMessage, calls processMessageIn callback without error', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const set = test.sinon.stub();

    sessionService.happn = mockHappn;

    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
      write: test.sinon.stub(),
      onLegacyPing: test.sinon.stub(),
    };

    mockHappn.services.cache.create.returns({
      set,
    });
    mockHappn.services.protocol.processMessageIn.callsFake((_, cb) => {
      cb(null, {
        response: {},
      });
    });
    mockHappn.services.system.getDescription.returns('mockDescription');

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.onConnect(client);
    sessionService.handleMessage('test', client);

    test.chai.expect(mockHappn.services.protocol.processMessageIn).to.have.been.calledOnce;
    test.chai.expect(mockHappn.services.error.handleSystem).to.not.have.been.called;
    test.chai.expect(client.onLegacyPing).to.not.have.been.called;
    test.chai.expect(client.write).to.have.been.calledOnceWithExactly({
      __outbound: true,
    });

    uuidStub.restore();
    nowStub.restore();
  });

  it('handleMessage, calls processMessageIn callback with error', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const set = test.sinon.stub();

    sessionService.happn = mockHappn;

    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
      write: test.sinon.stub(),
      onLegacyPing: test.sinon.stub(),
    };

    mockHappn.services.cache.create.returns({
      set,
    });
    mockHappn.services.protocol.processMessageIn.callsFake((_, cb) => {
      cb(new Error('test error'));
    });
    mockHappn.services.system.getDescription.returns('mockDescription');

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.onConnect(client);
    sessionService.handleMessage('test', client);

    test.chai.expect(mockHappn.services.protocol.processMessageIn).to.have.been.calledOnce;
    test.chai
      .expect(mockHappn.services.error.handleSystem)
      .to.have.been.calledOnceWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error')),
        'SessionService.handleMessage',
        1
      );
    test.chai.expect(client.onLegacyPing).to.not.have.been.calledOnceWithExactly('test');
    test.chai.expect(client.write).to.not.have.been.called;

    uuidStub.restore();
    nowStub.restore();
  });

  it('handleMessage, returns if message.indexOf primus::ping:: is true, session exists', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });
    const set = test.sinon.stub();

    sessionService.happn = mockHappn;

    const client = {
      on: test.sinon.stub(),
      address: 'mockAdress',
      request: {
        connection: {
          encrypted: 'mockEncrypted',
        },
        url: 'mockUrl',
      },
      write: test.sinon.stub(),
      onLegacyPing: test.sinon.stub(),
    };

    mockHappn.services.cache.create.returns({
      set,
    });
    mockHappn.services.system.getDescription.returns('mockDescription');

    const uuidStub = test.sinon.stub(uuid, 'v4').returns('033e720c-b65a-4bd4-9a80-09175af398eb');
    const nowStub = test.sinon.stub(Date, 'now').returns(1666181617938);

    sessionService.onConnect(client);
    sessionService.handleMessage('primus::ping::', client);

    test.chai.expect(client.onLegacyPing).to.have.been.calledOnceWithExactly('primus::ping::');

    uuidStub.restore();
    nowStub.restore();
  });

  it('handleMessage, returns if message.indexOf primus::ping:: is true, session does not exist', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    sessionService.happn = mockHappn;

    const client = {
      sessionId: null,
      onLegacyPing: test.sinon.stub(),
    };

    sessionService.handleMessage('primus::ping::', client);

    test.chai.expect(client.onLegacyPing).to.have.been.calledOnceWithExactly('primus::ping::');
  });

  it('handleMessage, returns and calles __discardMessage if session does not exist', async () => {
    const sessionService = new SessionService({
      logger: Logger,
    });

    sessionService.happn = mockHappn;

    const client = {};
    const emitSpy = test.sinon.spy(sessionService, 'emit');

    sessionService.handleMessage({ action: 'configure-session' }, client);

    test.chai
      .expect(emitSpy)
      .to.have.been.calledOnceWithExactly('message-discarded', { action: 'configure-session' });
  });
});
