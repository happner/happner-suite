const test = require('../../../__fixtures/utils/test_helper').create();
const HappnerAuthProvider = require('../../../../lib/services/security/authentication/happn-provider');

describe(test.testName(), () => {
  let mockHappn = null;
  let mockConfig = null;
  beforeEach(() => {
    mockHappn = {
      services: {
        crypto: test.sinon.stub(),
        cache: {
          getOrCreate: test.sinon.stub(),
        },
        session: test.sinon.stub(),
        system: {
          name: 'test',
        },
        error: {
          AccessDeniedError: test.sinon.stub(),
          InvalidCredentialsError: test.sinon.stub(),
        },
        security: {
          users: {
            getUser: test.sinon.stub(),
          },
          authorize: test.sinon.stub(),
          generatePermissionSetKey: test.sinon.stub(),
          generateToken: test.sinon.stub(),
          generateSession: test.sinon.stub(),
          decodeToken: test.sinon.stub(),
          checkTokenUserId: test.sinon.stub(),
          __checkRevocations: test.sinon.stub(),
          checkIPAddressWhitelistPolicy: test.sinon.stub(),
          verifyAuthenticationDigest: test.sinon.stub(),
          matchPassword: test.sinon.stub(),
        },
      },
    };

    mockConfig = {
      accountLockout: {
        enabled: null,
        attempts: null,
        retryInterval: null,
      },
      allowAnonymousAccess: null,
      lockTokenToLoginType: null,
      disableDefaultAdminNetworkConnections: null,
    };
  });

  afterEach(() => {
    mockHappn = null;
    mockConfig = null;
  });

  context('create', () => {
    it('creates an instance', () => {
      const happnerAuthProvider = HappnerAuthProvider.create(mockHappn, mockConfig);

      test.chai.expect(happnerAuthProvider.constructor.name).to.equal('HappnAuthProvider');
      test.chai.expect(happnerAuthProvider).to.be.instanceOf(HappnerAuthProvider);
    });
  });
  context('__providerTokenLogin', () => {
    it('returns accessDenied if ok is falsy', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        token: 'token',
      };
      const previousSession = {
        username: 'username',
      };

      mockHappn.services.error.AccessDeniedError.callsFake((message) => {
        return message;
      });

      const result = happnerAuthProvider.__providerTokenLogin(
        credentials,
        previousSession,
        1,
        callback
      );

      await test.chai.expect(result).to.eventually.equal('mockResult');
      test.chai
        .expect(callback)
        .to.have.been.calledWithExactly(
          `token userid does not match userid for username: ${previousSession.username}`
        );
    });

    it('returns invalidCredentials if authorized is falsy', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        token: 'token',
      };
      const previousSession = {
        username: 'username',
      };

      mockHappn.services.security.checkTokenUserId.returns(true);
      mockHappn.services.security.authorize.returns([null, 'mockReason']);
      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('mockReason');
        return message;
      });

      const result = happnerAuthProvider.__providerTokenLogin(
        credentials,
        previousSession,
        1,
        callback
      );

      await test.chai.expect(result).to.eventually.equal('mockResult');
      test.chai.expect(callback).to.have.been.calledWithExactly('mockReason');
    });

    it('returns invalidCredentials if user is falsy, invalid credentials', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        token: 'token',
      };
      const previousSession = {
        username: 'username',
      };

      mockHappn.services.security.checkTokenUserId.returns(true);
      mockHappn.services.security.authorize.returns(['item1', 'mockReason']);
      mockHappn.services.security.users.getUser.returns(null);
      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      const result = happnerAuthProvider.__providerTokenLogin(
        credentials,
        previousSession,
        1,
        callback
      );

      await test.chai.expect(result).to.eventually.equal('mockResult');
      test.chai.expect(callback).to.have.been.calledWithExactly('Invalid credentials');
    });

    it('successfully logs user in', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        token: 'token',
      };
      const user = {
        username: 'mockUsername',
        password: 'mockPassword',
      };
      const previousSession = {
        username: 'username',
      };

      mockHappn.services.security.checkTokenUserId.returns(true);
      mockHappn.services.security.authorize.returns(['item1', 'mockReason']);
      mockHappn.services.security.users.getUser.returns(user);
      mockHappn.services.security.generateSession.returns('mockSession');
      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      happnerAuthProvider.__providerTokenLogin(credentials, previousSession, 1, callback);

      await require('node:timers/promises').setTimeout(50);
      test.chai.expect(callback).to.have.been.calledWithExactly(null, 'mockSession');
      test.chai.expect(mockHappn.services.security.generateSession).to.have.been.calledWithExactly(
        user,
        1,
        credentials,
        {
          session: previousSession,
          token: credentials.token,
        },
        undefined
      );
    });
  });
  context('__digestLogin', () => {});
  context('__providerCredsLogin', () => {});
});
