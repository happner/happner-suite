const test = require('../../../__fixtures/utils/test_helper').create();
const BaseAuthProvider = require('../../../../lib/providers/security-base-auth-provider');
const SecurityFacadeFactory = require('../../../../lib/factories/security-facade-factory');
const utilsService = require('../../../../lib/services/utils/service').create();
const cryptoService = require('../../../../lib/services/crypto/service').create();
const cacheService = require('../../../../lib/services/cache/service').create();
const errorService = require('../../../../lib/services/error/service').create();
const systemService = require('../../../../lib/services/system/service').create();

describe(test.testName(), function () {
  this.timeout(10e3);

  const mockAuthProviderPath = test.path.resolve(
    __dirname,
    '../../../__fixtures/test/integration/security/authentication/workingAuth.js'
  );

  const mockAuthProviderFactoryPath = test.path.resolve(
    __dirname,
    '../../../__fixtures/test/integration/security/authentication/workingAuth-factory.js'
  );

  const mockAuthProviderFactory =
    require('../../../__fixtures/test/integration/security/authentication/workingAuth-factory').create();

  let mockHappn = null;
  let mockConfig = null;
  beforeEach(async () => {
    mockHappn = {
      services: {
        crypto: cryptoService,
        cache: cacheService,
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
            getPasswordHash: test.sinon.stub(),
          },
          groups: {
            upsertGroupWithoutValidation: test.sinon.stub(),
          },
          log: {
            warn: test.sinon.stub(),
          },
          authorize: test.sinon.stub(),
          generatePermissionSetKey: test.sinon.stub(),
          generateToken: test.sinon.stub(),
          generateSession: test.sinon.stub(),
          decodeToken: test.sinon.stub(),
          checkTokenUserId: test.sinon.stub(),
          checkRevocations: test.sinon.stub(),
          checkIPAddressWhitelistPolicy: test.sinon.stub().returns(true),
          checkDisableDefaultAdminNetworkConnections: test.sinon.stub().returns(false),
          verifyAuthenticationDigest: test.sinon.stub(),
          matchPassword: test.sinon.stub(),
          happn: mockHappn,
          utilsService,
          cryptoService,
          cacheService,
          errorService,
          systemService,
        },
      },
    };

    mockConfig = {
      accountLockout: {
        enabled: null,
        attempts: null,
        retryInterval: null,
      },
      allowAnonymousAccess: true,
      lockTokenToLoginType: null,
      disableDefaultAdminNetworkConnections: null,
    };
    mockHappn.services.security.cacheService.happn = mockHappn;
    await mockHappn.services.security.cacheService.initialize();
  });

  afterEach(() => {
    mockHappn = null;
    mockConfig = null;
  });

  context('create', () => {
    it('can create an instance, without requiredModule', async () => {
      mockHappn.services.security.cacheService.happn = mockHappn;
      await mockHappn.services.security.cacheService.initialize();
      const instance = BaseAuthProvider.create(
        mockAuthProviderPath,
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        mockConfig
      );

      test.chai.expect(instance.constructor.name).to.equal('TestAuthProvider');
      test.chai.expect(instance).to.be.an.instanceOf(BaseAuthProvider);
    });

    it('can create an instance, various configs', async () => {
      mockHappn.services.security.cacheService.happn = mockHappn;
      await mockHappn.services.security.cacheService.initialize();
      // test with 1st variation
      let config = {};
      BaseAuthProvider.create(
        mockAuthProviderPath,
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        config
      );

      test.chai.expect(config).to.eql({
        accountLockout: {
          enabled: true,
          attempts: 4,
          retryInterval: 60 * 1000 * 10,
        },
      });

      // test with 2nd variation
      config = {
        accountLockout: {
          enabled: false,
        },
      };

      BaseAuthProvider.create(
        mockAuthProviderPath,
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        config
      );

      test.chai.expect(config).to.eql({
        accountLockout: {
          enabled: false,
        },
      });

      // test with 3rd variation
      config = {
        accountLockout: {
          enabled: true,
          attempts: 4,
          retryInterval: 60 * 1000 * 10,
        },
      };

      BaseAuthProvider.create(
        mockAuthProviderPath,
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        config
      );

      test.chai.expect(config).to.eql({
        accountLockout: {
          enabled: true,
          attempts: 4,
          retryInterval: 60 * 1000 * 10,
        },
      });
    });

    it('can create an instance, various configs, with options', async () => {
      let config = {},
        mockOptions = { test: 1 };

      let testAuthProviderFromPath = BaseAuthProvider.create(
        { provider: mockAuthProviderPath, options: mockOptions },
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        config
      );
      test.chai.expect(testAuthProviderFromPath.options).to.eql({
        test: 2,
      });

      // check the defaults did not mutate options inputted
      test.chai.expect(mockOptions).to.eql({
        test: 1,
      });

      let testAuthProviderFromFactory = BaseAuthProvider.create(
        { provider: mockAuthProviderFactory, options: mockOptions },
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        config
      );

      test.chai.expect(testAuthProviderFromFactory.options).to.eql({
        test: 2,
      });
      // check the defaults did not mutate options inputted
      test.chai.expect(mockOptions).to.eql({
        test: 1,
      });

      let testAuthProviderFromFactoryPath = BaseAuthProvider.create(
        { provider: mockAuthProviderFactoryPath, options: mockOptions },
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        config
      );

      test.chai.expect(testAuthProviderFromFactoryPath.options).to.eql({
        test: 2,
      });
      // check the defaults did not mutate options inputted
      test.chai.expect(mockOptions).to.eql({
        test: 1,
      });
    });
  });

  context('accessDenied', () => {
    it('calls callback with error', async () => {
      mockHappn.services.security.cacheService.happn = mockHappn;
      await mockHappn.services.security.cacheService.initialize();
      mockHappn.services.security.errorService.AccessDeniedError = test.sinon.stub();
      mockHappn.services.security.errorService.AccessDeniedError.callsFake((errorMessage) => {
        return new Error(errorMessage);
      });
      const instance = BaseAuthProvider.create(
        mockAuthProviderPath,
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        mockConfig
      );
      try {
        instance.accessDenied('mockErrorMessage');
      } catch (e) {
        test.chai.expect(e.message).to.equal('mockErrorMessage');
      }
    });
  });

  context('invalidCredentials', () => {
    it('calls callback with error', async () => {
      mockHappn.services.security.cacheService.happn = mockHappn;
      await mockHappn.services.security.cacheService.initialize();
      mockHappn.services.security.errorService.InvalidCredentialsError = test.sinon.stub();
      mockHappn.services.security.errorService.InvalidCredentialsError.callsFake((errorMessage) => {
        return new Error(errorMessage);
      });
      const instance = BaseAuthProvider.create(
        mockAuthProviderPath,
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        mockConfig
      );
      try {
        instance.invalidCredentials('mockErrorMessage');
      } catch (e) {
        test.chai.expect(e.message).to.equal('mockErrorMessage');
      }
    });
  });

  context('login', () => {
    it('calls callback with error, credentials.username equal to _ANONYMOUS', async () => {
      mockConfig.allowAnonymousAccess = false;
      mockHappn.services.security.cacheService.happn = mockHappn;
      await mockHappn.services.security.cacheService.initialize();
      mockHappn.services.security.errorService.InvalidCredentialsError = test.sinon.stub();
      mockHappn.services.security.errorService.InvalidCredentialsError.callsFake((errorMessage) => {
        return new Error(errorMessage);
      });
      const instance = BaseAuthProvider.create(
        mockAuthProviderPath,
        SecurityFacadeFactory.createNewFacade(mockHappn.services.security),
        mockConfig
      );
      const credentials = {
        username: '_ANONYMOUS',
        password: 'password',
        type: null,
      };
      let eMessage;
      try {
        await instance.login(credentials, 1, 'mockRequest');
      } catch (e) {
        eMessage = e.message;
      }
      test.chai.expect(eMessage).to.equal('Anonymous access is disabled');
    });

    it('login fails, credentials.username equal to _ANONYMOUS, checkIPAddressWhitelistPolicy returns false', async () => {
      mockConfig.allowAnonymousAccess = true;
      mockHappn.services.security.checkIPAddressWhitelistPolicy = test.sinon.stub().returns(false);
      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: '_ANONYMOUS',
        password: 'password',
        type: null,
      };
      try {
        await instance.login(credentials, 1, 'mockRequest');
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.message).to.equal('Source address access restricted');
      }

      test.chai
        .expect(mockHappn.services.security.checkIPAddressWhitelistPolicy)
        .to.have.been.calledOnceWithExactly(credentials, 1, 'mockRequest');

      test.chai.expect(credentials.password).to.equal('anonymous');
    });

    it('login fails if username is null', async () => {
      mockConfig.allowAnonymousAccess = true;

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: null,
        token: null,
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.login(credentials, 1, 'mockRequest');
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.message).to.equal('Invalid credentials');
      }
    });

    it('access denied, using _ADMIN over the network', async () => {
      mockConfig.allowAnonymousAccess = true;
      mockConfig.disableDefaultAdminNetworkConnections = true;
      mockHappn.services.security.checkDisableDefaultAdminNetworkConnections = () => {
        return true;
      };
      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: '_ADMIN',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkIPAddressWhitelistPolicy.returns(true);
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.login(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai
          .expect(e.message)
          .to.equal('use of _ADMIN credentials over the network is disabled');
      }
      test.chai
        .expect(mockHappn.services.security.checkIPAddressWhitelistPolicy)
        .to.have.been.calledOnceWithExactly(credentials, 1, request);
    });

    it('calls callback with error, credentials.token is truthy, authorized is null', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = true;
      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: 'mockToken',
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkIPAddressWhitelistPolicy.returns(true);
      mockHappn.services.security.checkRevocations.resolves([null, 'mockReason']);
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.login(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.message).to.equal('mockReason');
      }
    });

    it('accessDenied, calls callback with error, too many attempts', async () => {
      const get = test.sinon.stub();
      mockHappn.services.cache.getOrCreate = test.sinon.stub().returns({
        get: get.returns({
          attempts: 4,
        }),
      });
      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkIPAddressWhitelistPolicy.returns(true);
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.login(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.message).to.equal('Account locked out');
      }
    });
  });

  context('tokenLogin', async () => {
    it('accessDenied, calls callback with error, previousSession equal to null', async () => {
      mockConfig.allowAnonymousAccess = true;
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const get = test.sinon.stub();
      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns({
          attempts: 4,
        }),
      });

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.returns(null);
      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.tokenLogin(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.message).to.equal('Invalid credentials: invalid session token');
      }
    });

    it('accessDenied, calls callback with error, previousSession.type is not equal to credentials.type', async () => {
      mockConfig.lockTokenToLoginType = true;

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.returns({
        username: 'mockUsername',
        type: 'mockType',
        origin: null,
        policy: [
          'item1',
          {
            disallowTokenLogins: null,
            lockTokenToOrigin: false,
          },
        ],
      });
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });
      try {
        await instance.tokenLogin(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai
          .expect(e.message)
          .to.equal(
            `token was created using the login type mockType, which does not match how the new token is to be created`
          );
      }
    });

    it('accessDenied, calls callback with error, checkDisableDefaultAdminNetworkConnections returns true', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = true;
      mockHappn.services.security.checkDisableDefaultAdminNetworkConnections = () => {
        return true;
      };
      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.returns({
        username: '_ADMIN',
        type: 'mockType',
        origin: null,
        policy: [
          'item1',
          {
            disallowTokenLogins: null,
            lockTokenToOrigin: false,
          },
        ],
      });

      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.tokenLogin(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai
          .expect(e.message)
          .to.equal(`use of _ADMIN credentials over the network is disabled`);
      }
    });

    it('accessDenied, calls callback with error, disallowTokenLogins is true', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);

      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.returns({
        username: '_ADMIN',
        type: 'mockType',
        origin: null,
        policy: [
          'item1',
          {
            disallowTokenLogins: true,
            lockTokenToOrigin: false,
          },
        ],
      });
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.tokenLogin(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.message).to.equal(`logins with this token are disallowed by policy`);
      }
    });

    it('accessDenied, calls callback with error, previousPolicy.lockTokenToOrigin is truthy and previousSession.origin is equal to system.name', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.returns({
        username: '_ADMIN',
        type: 'mockType',
        origin: null,
        policy: [
          'item1',
          {
            disallowTokenLogins: true,
            lockTokenToOrigin: true,
          },
        ],
      });
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.tokenLogin(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai
          .expect(e.message)
          .to.equal(`this token is locked to a different origin by policy`);
      }
    });

    it('calls providerTokenLogin, calls callback with error message', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = false;
      mockConfig.lockTokenToLoginType = true;

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);

      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 'mockType',
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.returns({
        username: '_ADMIN',
        type: 'mockType',
        origin: 'mockOrigin',
        policy: [
          'item1',
          {
            disallowTokenLogins: false,
            lockTokenToOrigin: false,
          },
        ],
      });
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.tokenLogin(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.message).to.equal(`providerTokenLogin not implemented.`);
      }
    });

    it('calls providerTokenLogin, calls callback with error message', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = false;

      const get = test.sinon.stub().returns(null);
      const set = test.sinon.stub();

      mockHappn.services.cache.getOrCreate = test.sinon.stub().returns({
        get,
        set,
      });

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);

      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      mockHappn.services.security.checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.throws(new Error('test error'));
      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      try {
        await instance.tokenLogin(credentials, 1, request);
        throw new Error('should have failed');
      } catch (e) {
        test.chai.expect(e.toString()).to.equal(`Error: test error`);
      }
    });
  });

  context('checkDisableDefaultAdminNetworkConnections', () => {
    it('returns true', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);

      const credentials = {
        username: '_ADMIN',
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      const result = instance.checkDisableDefaultAdminNetworkConnections(credentials, request);
      test.chai.expect(result).to.be.true;
    });

    it('returns false', async () => {
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);
      const credentials = {
        username: 'mockUsername',
      };
      const request = {
        data: {
          info: {
            _local: false,
          },
        },
      };

      const result = instance.checkDisableDefaultAdminNetworkConnections(credentials, request);
      test.chai.expect(result).to.be.false;
    });
  });

  context('loginOK', () => {
    it('with this.locks', async () => {
      const remove = test.sinon.stub();
      mockHappn.services.cache.getOrCreate = test.sinon.stub().returns({
        remove,
      });

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);

      const credentials = {
        username: 'mockUsername',
        password: null,
        type: 1,
        token: null,
        digest: 1,
      };

      mockHappn.services.security.generateSession.returns('mockSession');

      instance.loginOK(
        credentials,
        { password: 'mockPassword', username: 'username' },
        'mockSessionId',
        'mockTokenLogin',
        'mockAdditionalInfo'
      );

      test.chai.expect(remove).to.have.been.calledOnceWithExactly('username');
      test.chai
        .expect(mockHappn.services.security.generateSession)
        .to.have.been.calledOnceWithExactly(
          { username: 'username' },
          'mockSessionId',
          credentials,
          'mockTokenLogin',
          'mockAdditionalInfo'
        );
    });

    it('without this.locks', async () => {
      mockHappn.services.cache.getOrCreate = test.sinon.stub().returns(null);

      const securityFacade = SecurityFacadeFactory.createNewFacade(mockHappn.services.security);
      const instance = new BaseAuthProvider(securityFacade, mockConfig);

      const credentials = {
        username: 'mockUsername',
        password: null,
      };

      mockHappn.services.security.generateSession.returns('mockSession');

      instance.loginOK(
        credentials,
        { password: 'mockPassword', username: 'username' },
        'mockSessionId',
        'mockTokenLogin',
        'mockAdditionalInfo'
      );

      test.chai
        .expect(mockHappn.services.security.generateSession)
        .to.have.been.calledOnceWithExactly(
          { username: 'username' },
          'mockSessionId',
          credentials,
          'mockTokenLogin',
          'mockAdditionalInfo'
        );
    });
  });
});
