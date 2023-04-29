const test = require('../../../__fixtures/utils/test_helper').create();
const HappnerAuthProvider = require('../../../../lib/providers/security-happn-auth-provider');

describe(test.testName(), () => {
  let mockSecurityFacade = null;
  let mockConfig = null;
  beforeEach(() => {
    mockSecurityFacade = {
      utils: { coerceArray: test.sinon.stub() },
      crypto: test.sinon.stub(),
      cache: {
        getOrCreate: test.sinon.stub(),
      },
      session: test.sinon.stub(),
      system: {
        name: 'test',
      },
      error: {
        AccessDeniedError: test.sinon.stub().returns('AccessDeniedError'),
        InvalidCredentialsError: test.sinon.stub().returns('InvalidCredentialsError'),
        SystemError: test.sinon.stub().returns('SystemError'),
      },
      users: {
        getUser: test.sinon.stub(),
        getPasswordHash: test.sinon.stub(),
      },
      security: {
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
    mockSecurityFacade = null;
    mockConfig = null;
  });

  context('create', () => {
    it('creates an instance', () => {
      const happnerAuthProvider = HappnerAuthProvider.create(mockSecurityFacade, mockConfig);

      test.chai.expect(happnerAuthProvider.constructor.name).to.equal('HappnAuthProvider');
      test.chai.expect(happnerAuthProvider).to.be.instanceOf(HappnerAuthProvider);
    });
  });
  context('providerTokenLogin', () => {
    it('returns accessDenied if ok is falsy', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const credentials = {};
      const decodeToken = {
        username: 'mockUsername',
      };

      const result = happnerAuthProvider.providerTokenLogin(credentials, decodeToken, 1);

      await test.chai.expect(result).to.eventually.rejectedWith('AccessDeniedError');
      test.chai
        .expect(mockSecurityFacade.security.checkTokenUserId)
        .to.have.been.calledWithExactly({
          username: 'mockUsername',
        });
    });

    it('returns invalidCredentials if authorized is falsy', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const credentials = {
        token: 'mockToken',
      };
      const decodeToken = {
        username: 'mockUsername',
      };

      mockSecurityFacade.security.checkTokenUserId.returns(true);
      mockSecurityFacade.utils.coerceArray.returns([null, 'mockReason']);
      mockSecurityFacade.security.authorize.returns('mockAuthorize');

      const result = happnerAuthProvider.providerTokenLogin(credentials, decodeToken, 1);

      await test.chai.expect(result).to.eventually.rejectedWith('InvalidCredentialsError');
    });

    it('returns invalidCredentials if user is null, invalid credentials', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const credentials = {
        token: 'mockToken',
      };
      const decodedToken = {
        username: 'mockUsername',
      };

      mockSecurityFacade.security.checkTokenUserId.returns(true);
      mockSecurityFacade.utils.coerceArray.returns(['mockAuthorize', 'mockReason']);
      mockSecurityFacade.security.authorize.returns('mockAuthorize');
      mockSecurityFacade.users.getUser.returns(null);

      const result = happnerAuthProvider.providerTokenLogin(credentials, decodedToken, 1);

      await test.chai.expect(result).to.eventually.rejectedWith('InvalidCredentialsError');
      test.chai
        .expect(mockSecurityFacade.users.getUser)
        .to.have.been.calledWithExactly('mockUsername');
      test.chai
        .expect(mockSecurityFacade.utils.coerceArray)
        .to.have.been.calledWithExactly('mockAuthorize');
    });

    it('successfully logs user in', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const credentials = {
        token: 'mockToken',
      };
      const decodedToken = {
        username: 'mockUsername',
        password: 'mockPassword',
      };

      mockSecurityFacade.security.checkTokenUserId.returns(true);
      mockSecurityFacade.utils.coerceArray.returns(['mockAuthorize', 'mockReason']);
      mockSecurityFacade.security.authorize.returns('mockAuthorize');
      mockSecurityFacade.users.getUser.returns({
        username: 'mockUsername',
        password: 'mockPassword',
      });
      mockSecurityFacade.security.generateSession.returns('mockSession');

      const result = happnerAuthProvider.providerTokenLogin(credentials, decodedToken, 1);

      await test.chai.expect(result).to.eventually.equal('mockSession');
      test.chai.expect(mockSecurityFacade.users.getUser).to.not.haveOwnProperty('password');
      test.chai.expect(mockSecurityFacade.security.generateSession).to.have.been.calledWithExactly(
        { username: 'mockUsername' },
        1,
        { token: 'mockToken' },
        {
          session: { username: 'mockUsername', password: 'mockPassword' },
          token: 'mockToken',
        },
        undefined
      );
    });
  });

  context('#digestLogin', () => {
    it('fails to login, user.publicKey is not equal to credentials.publicKey', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const mockCredentials = {
        username: 'mockUsername',
        password: 'mockPassword',
        digest: 'mockLearning',
        publicKey: 'mockPublicKey',
      };

      mockSecurityFacade.users.getUser.returns({
        username: 'mockUsername',
        password: 'mockPassword',
        publicKey: null,
      });
      mockConfig.accountLockout.enabled = false;

      const result = happnerAuthProvider.providerCredsLogin(mockCredentials, 1);

      await test.chai.expect(result).to.be.eventually.rejectedWith('InvalidCredentialsError');
    });

    it('checks of verifyAuthenticationDigest is not equal to true when it returns.', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const mockCredentials = {
        username: 'mockUsername',
        password: 'mockPassword',
        digest: 'mockLearning',
        publicKey: 'mockPublicKey',
      };

      mockSecurityFacade.users.getUser.returns({
        username: 'mockUsername',
        password: 'mockPassword',
        publicKey: 'mockPublicKey',
      });
      mockConfig.accountLockout.enabled = false;

      const result = happnerAuthProvider.providerCredsLogin(mockCredentials, 1);

      await test.chai.expect(result).to.be.eventually.rejectedWith('InvalidCredentialsError');
      test.chai
        .expect(mockSecurityFacade.security.verifyAuthenticationDigest)
        .to.have.been.calledWithExactly({
          username: 'mockUsername',
          password: 'mockPassword',
          digest: 'mockLearning',
          publicKey: 'mockPublicKey',
        });
    });

    it('successfully logs user in', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const mockCredentials = {
        username: 'mockUsername',
        password: 'mockPassword',
        digest: 'mockLearning',
        publicKey: 'mockPublicKey',
      };

      mockSecurityFacade.security.generateSession.returns('mockSession');
      mockSecurityFacade.security.verifyAuthenticationDigest.returns(true);
      mockSecurityFacade.users.getUser.returns({
        username: 'mockUsername',
        password: 'mockPassword',
        publicKey: 'mockPublicKey',
      });
      mockConfig.accountLockout.enabled = false;

      const result = happnerAuthProvider.providerCredsLogin(mockCredentials, 1);

      await test.chai.expect(result).to.eventually.equal('mockSession');
      test.chai.expect(mockSecurityFacade.security.generateSession).to.have.been.calledWithExactly(
        { username: 'mockUsername', publicKey: 'mockPublicKey' },
        1,
        {
          username: 'mockUsername',
          password: 'mockPassword',
          digest: 'mockLearning',
          publicKey: 'mockPublicKey',
        },
        undefined,
        undefined
      );
    });
  });

  context('providerCredsLogin', () => {
    it('getUser method returns null', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const mockCredentials = {
        username: 'mockUsername',
        password: 'mockPassword',
        digest: 'mockLearning',
        publicKey: 'mockPublicKey',
      };

      mockSecurityFacade.users.getUser.returns(null);
      mockConfig.accountLockout.enabled = false;

      const result = happnerAuthProvider.providerCredsLogin(mockCredentials, 1);

      await test.chai.expect(result).to.eventually.rejectedWith('InvalidCredentialsError');
      test.chai
        .expect(mockSecurityFacade.users.getUser)
        .to.have.been.calledWithExactly('mockUsername');
    });

    it('matchPassword, fails to log in', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const mockCredentials = {
        username: 'mockUsername',
        password: 'mockPassword',
        digest: false,
        publicKey: 'mockPublicKey',
      };
      mockSecurityFacade.users.getPasswordHash.returns(false);
      mockSecurityFacade.security.matchPassword.returns(false);
      mockSecurityFacade.users.getUser.returns({
        username: 'mockUsername',
        password: 'mockPassword',
      });
      mockConfig.accountLockout.enabled = false;

      const result = happnerAuthProvider.providerCredsLogin(mockCredentials, 1);

      await test.chai.expect(result).to.eventually.rejectedWith('InvalidCredentialsError');
      test.chai
        .expect(mockSecurityFacade.users.getPasswordHash)
        .to.have.been.calledWithExactly('mockUsername');
      test.chai
        .expect(mockSecurityFacade.security.matchPassword)
        .to.have.been.calledWithExactly('mockPassword', false);
    });

    it('matchPassword, successfully logs in', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const mockCredentials = {
        username: 'mockUsername',
        password: 'mockPassword',
        digest: false,
        publicKey: 'mockPublicKey',
      };

      mockSecurityFacade.security.generateSession.returns('mockSession');
      mockSecurityFacade.security.matchPassword.returns(true);
      mockSecurityFacade.users.getPasswordHash.returns(false);
      mockSecurityFacade.users.getUser.returns({
        username: 'mockUsername',
        password: 'mockPassword',
      });
      mockConfig.accountLockout.enabled = false;

      const result = happnerAuthProvider.providerCredsLogin(mockCredentials, 1);

      await test.chai.expect(result).to.eventually.equal('mockSession');
      test.chai.expect(mockSecurityFacade.security.generateSession).to.have.been.calledWithExactly(
        { username: 'mockUsername' },
        1,
        {
          username: 'mockUsername',
          password: 'mockPassword',
          digest: false,
          publicKey: 'mockPublicKey',
        },
        undefined,
        undefined
      );
    });
  });

  context('providerChangePassword', () => {
    it('getUser method returns null', async () => {
      let testThrowCatchError;
      const happnerAuthProvider = new HappnerAuthProvider(mockSecurityFacade, mockConfig);
      const mockCredentials = {
        username: 'mockUsername',
        password: 'mockPassword',
        digest: 'mockLearning',
        publicKey: 'mockPublicKey',
      };
      try {
        await happnerAuthProvider.providerChangePassword(mockCredentials);
      } catch (e) {
        testThrowCatchError = e;
      }
      test.expect(testThrowCatchError).to.eql('SystemError');

      mockSecurityFacade.users.getUser.returns({
        username: 'mockUsername',
        password: 'mockPassword',
        publicKey: 'mockPublicKey',
      });

      try {
        await happnerAuthProvider.providerChangePassword(mockCredentials, 'bad Options');
      } catch (e) {
        testThrowCatchError = e;
      }
      test.expect(testThrowCatchError).to.eql('SystemError');

      try {
        await happnerAuthProvider.providerChangePassword(mockCredentials, {
          oldPassword: 'wrong',
          newPassword: 'new',
        });
      } catch (e) {
        testThrowCatchError = e;
      }
      test.expect(testThrowCatchError).to.eql('SystemError');

      mockSecurityFacade.security.matchPassword.returns(true);
      let pass;
      mockSecurityFacade.users.upsertUser = async () => {
        pass = true;
        return;
      };
      await happnerAuthProvider.providerChangePassword(mockCredentials, {
        oldPassword: 'wrong',
        newPassword: 'newMockPassword',
      });
      test.expect(pass).to.eql(true);
    });
  });
});
