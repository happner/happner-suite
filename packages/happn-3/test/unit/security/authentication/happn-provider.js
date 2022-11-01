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
            getPasswordHash: test.sinon.stub(),
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
      test.chai.expect(user).to.not.haveOwnProperty('password');
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

    it('checkTokenUserId throws error and calls callback with error', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');

      mockHappn.services.security.checkTokenUserId.throws(new Error('test error'));
      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      happnerAuthProvider.__providerTokenLogin(null, null, null, callback);

      test.chai.expect(callback).to.have.been.calledWithExactly('Invalid credentials');
    });
  });

  context('__digestLogin', () => {
    it('fails to login, user.publicKey is not equal to credentials.publicKey', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        username: 'mockUsername',
        token: 'token',
        publicKey: 'key',
      };

      const user = {
        username: 'mockUsername',
        password: 'mockPassword',
        publicKey: null,
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      happnerAuthProvider.__digestLogin(user, credentials, 1, callback);

      test.chai.expect(callback).to.have.been.calledWithExactly('Invalid credentials');
      test.chai.expect(get).to.have.been.calledWithExactly(credentials.username);
      test.chai.expect(set).to.have.been.calledWithExactly(
        credentials.username,
        { attempts: 1 },
        {
          ttl: mockConfig.accountLockout.retryInterval,
        }
      );
    });

    it('verifyAuthenticationDigest calls callback with error', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
      };
      const user = {
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      mockHappn.services.security.verifyAuthenticationDigest.callsFake((_, cb) => {
        cb(new Error('test error'));
      });

      happnerAuthProvider.__digestLogin(user, credentials, 1, callback);

      test.chai
        .expect(callback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
        );
    });

    it('fails to log in, valid is falsy', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
      };
      const user = {
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      mockHappn.services.security.verifyAuthenticationDigest.callsFake((_, cb) => {
        cb(null, false);
      });

      happnerAuthProvider.__digestLogin(user, credentials, 1, callback);

      test.chai.expect(callback).to.have.been.calledWithExactly('Invalid credentials');
      test.chai.expect(get).to.have.been.calledWithExactly(credentials.username);
      test.chai.expect(set).to.have.been.calledWithExactly(
        credentials.username,
        { attempts: 1 },
        {
          ttl: mockConfig.accountLockout.retryInterval,
        }
      );
    });

    it('verifyAuthenticationDigest, successfully logs user in', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();
      const remove = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
        remove,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
      };
      const user = {
        password: 'password',
        publicKey: 'key',
      };

      mockHappn.services.security.generateSession.returns('mockSession');
      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      mockHappn.services.security.verifyAuthenticationDigest.callsFake((_, cb) => {
        cb(null, true);
      });

      happnerAuthProvider.__digestLogin(user, credentials, 1, callback);

      test.chai.expect(callback).to.have.been.calledWithExactly(null, 'mockSession');
      test.chai.expect(user).to.not.haveOwnProperty('password');
      test.chai.expect(mockHappn.services.security.generateSession).to.have.been.calledWithExactly(
        {
          publicKey: 'key',
        },
        1,
        credentials,
        undefined,
        undefined
      );
    });
  });

  context('__providerCredsLogin', () => {
    it('getUser calls callback with error', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
      };

      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(new Error('test error'));
      });

      happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai
        .expect(callback)
        .to.have.been.calledOnceWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
        );
    });

    it('verifyAuthenticationDigest, fails to log in', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });
      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(null, null);
      });

      happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('Invalid credentials');
      test.chai.expect(get).to.have.callCount(1);
      test.chai.expect(set).to.have.been.calledOnceWithExactly(
        credentials.username,
        { attempts: 1 },
        {
          ttl: mockConfig.accountLockout.retryInterval,
        }
      );
    });

    it('calls __digestLogin if credentials.gidest is truthy', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
        digest: true,
      };
      const user = {
        password: 'password',
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });
      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(null, user);
        return 'mockUser';
      });

      const result = happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai.expect(result).to.equal('mockUser');
      test.chai.expect(mockHappn.services.security.verifyAuthenticationDigest).to.have.callCount(1);
    });

    it('getPasswordHash calls callback with error', async () => {
      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
        digest: false,
      };
      const user = {
        password: 'password',
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });
      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(null, user);
      });
      mockHappn.services.security.users.getPasswordHash.callsFake((_, cb) => {
        cb(new Error('test error'));
      });

      happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai
        .expect(callback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
        );
    });

    it('getPasswordHash, fails to log in', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
        digest: false,
      };
      const user = {
        password: 'password',
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });
      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(null, user);
      });
      mockHappn.services.security.users.getPasswordHash.callsFake((_, cb) => {
        cb(new Error(credentials.username + ' does not exist in the system'));
      });
      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });

      happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('Invalid credentials');
      test.chai.expect(mockHappn.services.security.users.getPasswordHash).to.have.callCount(1);
      test.chai.expect(get).to.have.callCount(1);
      test.chai.expect(set).to.have.been.calledOnceWithExactly(
        credentials.username,
        { attempts: 1 },
        {
          ttl: mockConfig.accountLockout.retryInterval,
        }
      );
    });

    it('matchPassword, calls callback with error', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
        digest: false,
      };
      const user = {
        password: 'password',
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });
      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(null, user);
      });
      mockHappn.services.security.users.getPasswordHash.callsFake((_, cb) => {
        cb(null, 'mockHash');
      });
      mockHappn.services.security.matchPassword.callsFake((_, __, cb) => {
        cb(new Error('test error'));
      });

      happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai
        .expect(callback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
        );
      test.chai.expect(mockHappn.services.security.matchPassword).to.have.callCount(1);
    });

    it('matchPassword, successfully logs in', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();
      const remove = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
        remove,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
        digest: false,
      };
      const user = {
        password: 'password',
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });
      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(null, user);
      });
      mockHappn.services.security.users.getPasswordHash.callsFake((_, cb) => {
        cb(null, 'mockHash');
      });
      mockHappn.services.security.matchPassword.callsFake((_, __, cb) => {
        cb(null, 'mockMatch');
      });
      mockHappn.services.security.generateSession.returns('mockSession');

      happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai.expect(callback).to.have.been.calledWithExactly(null, 'mockSession');
      test.chai.expect(mockHappn.services.security.matchPassword).to.have.callCount(1);
      test.chai.expect(user).to.not.haveOwnProperty('password');
      test.chai
        .expect(mockHappn.services.security.generateSession)
        .to.have.been.calledWithExactly(user, 1, credentials, undefined, undefined);
    });

    it('matchPassword, fails to log in', async () => {
      const set = test.sinon.stub();
      const get = test.sinon.stub();

      mockHappn.services.cache.getOrCreate.returns({
        get: get.returns(null),
        set,
      });

      const happnerAuthProvider = new HappnerAuthProvider(mockHappn, mockConfig);
      const callback = test.sinon.stub().returns('mockResult');
      const credentials = {
        publicKey: 'key',
        digest: false,
      };
      const user = {
        password: 'password',
        publicKey: 'key',
      };

      mockHappn.services.error.InvalidCredentialsError.callsFake((message) => {
        test.chai.expect(message).to.equal('Invalid credentials');
        return message;
      });
      mockHappn.services.security.users.getUser.callsFake((_, cb) => {
        cb(null, user);
      });
      mockHappn.services.security.users.getPasswordHash.callsFake((_, cb) => {
        cb(null, 'mockHash');
      });
      mockHappn.services.security.matchPassword.callsFake((_, __, cb) => {
        cb(null, null);
      });

      happnerAuthProvider.__providerCredsLogin(credentials, 1, callback);

      test.chai.expect(callback).to.have.been.calledOnceWithExactly('Invalid credentials');
      test.chai.expect(mockHappn.services.security.users.getPasswordHash).to.have.callCount(1);
      test.chai.expect(get).to.have.callCount(1);
      test.chai.expect(set).to.have.been.calledOnceWithExactly(
        credentials.username,
        { attempts: 1 },
        {
          ttl: mockConfig.accountLockout.retryInterval,
        }
      );
    });
  });
});
