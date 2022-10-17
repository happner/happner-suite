const test = require('../../../__fixtures/utils/test_helper').create();
const BaseAuthProvider = require('../../../../lib/services/security/authentication/provider-base');

describe(test.testName(), function () {
  this.timeout(10e3);

  const dummyAuthProvider = test.path.resolve(
    __dirname,
    '../../../__fixtures/test/integration/security/authentication/secondAuthProvider.js'
  );

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
            getPasswordHash: test.sinon.stub(),
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
      allowAnonymousAccess: true,
      lockTokenToLoginType: null,
      disableDefaultAdminNetworkConnections: null,
    };
  });

  afterEach(() => {
    mockHappn = null;
    mockConfig = null;
  });

  context('create', () => {
    it('can create an instance, without requiredModule', () => {
      const instance = BaseAuthProvider.create(mockHappn, mockConfig);

      test.chai.expect(instance.constructor.name).to.equal('AuthProvider');
      test.chai.expect(instance).to.be.an.instanceOf(BaseAuthProvider);
      test.chai
        .expect(mockHappn.services.security.log.warn)
        .to.have.been.calledOnceWithExactly(
          'No auth provider specified, returning base auth provider with limited functionality.'
        );
    });

    it('can create an instance, with requiredModule', () => {
      const instance = BaseAuthProvider.create(mockHappn, mockConfig, dummyAuthProvider);

      test.chai.expect(instance.constructor.name).to.equal('TestAuthProvider');
      test.chai.expect(mockHappn.services.security.log.warn).to.have.callCount(0);
    });

    it('can create an instance, incorrect requiredModule', () => {
      const instance = BaseAuthProvider.create(mockHappn, mockConfig, {});

      test.chai.expect(instance.constructor.name).to.equal('AuthProvider');
      test.chai.expect(instance).to.be.an.instanceOf(BaseAuthProvider);
      test.chai.expect(mockHappn.services.security.log.warn).to.have.callCount(1);
      test.chai
        .expect(mockHappn.services.security.log.warn)
        .to.have.been.calledOnceWithExactly(
          `Could not configure auth provider [object Object], returning base auth provider with limited functionality.`
        );
    });
  });

  context('accessDenied', () => {
    it('calls callback with error', () => {
      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();

      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      instance.accessDenied('mockErrorMessage', callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('mockErrorMessage');
    });
  });

  context('invalidCredentials', () => {
    it('calls callback with error', () => {
      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();

      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      instance.invalidCredentials('mockErrorMessage', callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('mockErrorMessage');
    });
  });

  context('coerceArray', () => {
    it('possibleArray as an Array', () => {
      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const result = instance.coerceArray(['item1', 'item2', 'item3']);

      test.chai.expect(result).to.eql(['item1', 'item2', 'item3']);
    });

    it('possibleArray as a string', () => {
      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const result = instance.coerceArray('item1');

      test.chai.expect(result).to.eql(['item1', null]);
    });
  });

  context('login', () => {
    it('calls callback with error, credentials.username equal to _ANONYMOUS', () => {
      mockConfig.allowAnonymousAccess = false;
      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();
      const credentials = {
        username: '_ANONYMOUS',
        password: 'password',
        type: null,
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      instance.login(credentials, 1, 'mockRequest', callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('Anonymous access is disabled');
    });

    it('calls callback with error, credentials.username equal to _ANONYMOUS, checkIPAddressWhitelistPolicy returns false', () => {
      mockConfig.allowAnonymousAccess = true;
      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();
      const credentials = {
        username: '_ANONYMOUS',
        password: 'password',
        type: null,
      };

      mockHappn.services.security.checkIPAddressWhitelistPolicy.returns(false);
      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      instance.login(credentials, 1, 'mockRequest', callback);

      test.chai
        .expect(callback)
        .to.have.been.calledOnceWithExactly('Source address access restricted');
      test.chai
        .expect(mockHappn.services.security.checkIPAddressWhitelistPolicy)
        .to.have.been.calledOnceWithExactly(credentials, 1, 'mockRequest');
      test.chai.expect(credentials.password).to.equal('anonymous');
    });

    it('calls callback with error if username is null', () => {
      mockConfig.allowAnonymousAccess = true;

      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();
      const credentials = {
        username: 'mockUsername',
        password: null,
        type: null,
        token: null,
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      instance.login(credentials, 1, 'mockRequest', callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('Invalid credentials');
    });

    it('access denied, calls callback with error, using _ADMIN over the network', () => {
      mockConfig.allowAnonymousAccess = true;
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();
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

      instance.login(credentials, 1, request, callback);

      test.chai
        .expect(callback)
        .to.have.been.calledOnceWithExactly(
          'use of _ADMIN credentials over the network is disabled'
        );
      test.chai
        .expect(mockHappn.services.security.checkIPAddressWhitelistPolicy)
        .to.have.been.calledOnceWithExactly(credentials, 1, request);
    });

    it('calls callback with error, credentials.token is truthy, authorized is null', async () => {
      mockConfig.allowAnonymousAccess = true;
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();
      const sessionId = test.sinon.stub();
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
      mockHappn.services.security.__checkRevocations.resolves([null, 'mockReason']);
      mockHappn.services.error.AccessDeniedError.callsFake((errorMessage) => {
        return errorMessage;
      });

      instance.login(credentials, sessionId, request, callback);

      await require('node:timers/promises').setTimeout(50);

      test.chai.expect(sessionId).to.have.been.calledOnceWithExactly('mockReason');
      test.chai
        .expect(mockHappn.services.error.AccessDeniedError)
        .to.have.been.calledOnceWithExactly('mockReason');
    });

    it('accessDenied, calls callback with error, too many attempts', async () => {
      mockConfig.allowAnonymousAccess = true;
      mockConfig.disableDefaultAdminNetworkConnections = true;

      const get = test.sinon.stub();
      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns({
          attempts: 4,
        }),
      });

      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();
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

      instance.login(credentials, 1, request, callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('Account locked out');
      test.chai
        .expect(mockHappn.services.error.AccessDeniedError)
        .to.have.been.calledOnceWithExactly('Account locked out');
      test.chai.expect(get).to.have.been.calledOnceWithExactly('mockUsername');
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

      const instance = new BaseAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub();
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

      mockHappn.services.security.__checkRevocations.resolves(['mockAuthorize', 'mockReason']);
      mockHappn.services.security.decodeToken.returns(null);
      mockHappn.services.error.InvalidCredentialsError.callsFake((errorMessage) => {
        return errorMessage;
      });

      await instance.tokenLogin(credentials, 1, request, callback);

      test.chai
        .expect(callback)
        .to.have.been.calledOnceWithExactly('Invalid credentials: invalid session token');
      test.chai
        .expect(mockHappn.services.error.InvalidCredentialsError)
        .to.have.been.calledOnceWithExactly('Invalid credentials: invalid session token');
      test.chai
        .expect(mockHappn.services.security.__checkRevocations)
        .to.have.been.calledOnceWithExactly(credentials.token);
    });
  });

  context('userCredsLogin', () => {});

  context('userCredsLogin', () => {});

  context('checkDisableDefaultAdminNetworkConnections', () => {});
});
