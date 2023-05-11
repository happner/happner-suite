require('../../__fixtures/utils/test_helper').describe({ timeout: 20e3 }, function (test) {
  let CheckPoint = require('../../../lib/services/security/checkpoint');
  const Groups = require('../../../lib/services/security/groups');
  const Users = require('../../../lib/services/security/users');
  const SecurityService = require('../../../lib/services/security/service');

  const happn = require('../../../lib/index');
  const Logger = require('happn-logger');
  const util = test.commons.nodeUtils;
  const _ = test.commons._;
  const sift = test.commons.sift.default;
  let CONSTANTS = require('../../../lib/index').constants;
  const commons = require('happn-commons');

  const serviceConfig = {
    services: {
      security: {
        config: {
          sessionTokenSecret: 'TESTTOKENSECRET',
          keyPair: {
            privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
            publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2',
          },
          profiles: [
            //profiles are in an array, in descending order of priority, so if you fit more than one profile, the top profile is chosen
            {
              name: 'web-session',
              session: {
                'user.username': {
                  $eq: 'WEB_SESSION',
                },
                type: {
                  $eq: 0,
                },
              },
              policy: {
                ttl: '4 seconds',
                inactivity_threshold: '2 seconds', //this is costly, as we need to store state on the server side
              },
            },
            {
              name: 'rest-device',
              session: {
                //filter by the security properties of the session - check if this session user belongs to a specific group
                'user.groups.REST_DEVICES': {
                  $exists: true,
                },
                type: {
                  $eq: 0,
                }, //token stateless
              },
              policy: {
                ttl: 2000, //stale after 2 seconds
                inactivity_threshold: '2 days', //stale after 2 days
              },
            },
            {
              name: 'trusted-device',
              session: {
                //filter by the security properties of the session, so user, groups and permissions
                'user.groups.TRUSTED_DEVICES': {
                  $exists: true,
                },
                type: {
                  $eq: 1,
                }, //stateful connected device
              },
              policy: {
                ttl: '2 seconds', //stale after 2 seconds
                permissions: {
                  //permissions that the holder of this token is limited, regardless of the underlying user
                  '/TRUSTED_DEVICES/*': {
                    actions: ['*'],
                  },
                },
              },
            },
            {
              name: 'specific-device',
              session: {
                //instance based mapping, so what kind of session is this?
                type: {
                  $in: [0, 1],
                }, //any type of session
                ip_address: {
                  $eq: '127.0.0.1',
                },
              },
              policy: {
                ttl: Infinity, //this device has this access no matter what
                inactivity_threshold: Infinity,
                permissions: {
                  //this device has read-only access to a specific item
                  '/SPECIFIC_DEVICE/*': {
                    actions: ['get', 'on'],
                  },
                },
              },
            },
            {
              name: 'non-reusable',
              session: {
                //instance based mapping, so what kind of session is this?
                'user.groups.LIMITED_REUSE': {
                  $exists: true,
                },
                type: {
                  $in: [0, 1],
                }, //stateless or stateful
              },
              policy: {
                usage_limit: 2, //you can only use this session call twice
              },
            },
            {
              name: 'default-stateful', // this is the default underlying profile for stateful sessions
              session: {
                type: {
                  $eq: 1,
                },
              },
              policy: {
                ttl: Infinity,
                inactivity_threshold: Infinity,
              },
            },
            {
              name: 'default-stateless', // this is the default underlying profile for ws sessions
              session: {
                type: {
                  $eq: 0,
                },
              },
              policy: {
                ttl: 60000 * 10, //session goes stale after 10 minutes
                inactivity_threshold: Infinity,
              },
            },
          ],
        },
      },
    },
  };

  var getService = function (config, callback) {
    happn.service.create(config, function (e, instance) {
      if (e) return callback(e);
      callback(null, instance);
    });
  };

  var stopService = function (instance, callback) {
    instance.stop(
      {
        reconnect: false,
      },
      callback
    );
  };

  var stopServices = function (happnMock, callback) {
    test.async.eachSeries(
      ['log', 'error', 'utils', 'crypto', 'cache', 'session', 'data', 'security'],
      function (serviceName, eachServiceCB) {
        if (!happnMock.services[serviceName].stop) return eachServiceCB();
        happnMock.services[serviceName].stop(eachServiceCB);
      },
      callback
    );
  };

  var mockServices = function (callback, servicesConfig, overrides = { services: {} }) {
    var testConfig = {
      secure: true,
      services: {
        log: {},
        cache: {},
        data: {},
        crypto: {},
        security: {
          secure: true,
        },
      },
    };

    var testServices = {};

    testServices.cache =
      overrides?.services?.cache || require('../../../lib/services/cache/service');
    testServices.crypto =
      overrides?.services?.crypto || require('../../../lib/services/crypto/service');
    testServices.data = overrides?.services?.data || require('../../../lib/services/data/service');
    testServices.security =
      overrides?.services?.security || require('../../../lib/services/security/service');
    testServices.session =
      overrides?.services?.session || require('../../../lib/services/session/service');
    testServices.system =
      overrides?.services?.system || require('../../../lib/services/system/service');
    testServices.utils =
      overrides?.services?.utils || require('../../../lib/services/utils/service');
    testServices.error =
      overrides?.services?.error || require('../../../lib/services/error/service');
    testServices.log = overrides?.services?.log || require('../../../lib/services/log/service');

    var checkpoint = require('../../../lib/services/security/checkpoint');

    testServices.checkpoint = new checkpoint({
      logger: Logger,
    });

    var happnMock = {
      config: {
        services: {
          security: {},
        },
      },
      services: {
        system: {
          package: require('../../../package.json'),
        },
      },
    };

    if (servicesConfig) testConfig = servicesConfig;

    test.async.eachSeries(
      ['log', 'error', 'utils', 'crypto', 'cache', 'session', 'data', 'system', 'security'],
      function (serviceName, eachServiceCB) {
        testServices[serviceName] = new testServices[serviceName]({
          logger: Logger,
        });

        testServices[serviceName].happn = happnMock;

        happnMock.services[serviceName] = testServices[serviceName];

        if (serviceName === 'error')
          happnMock.services[serviceName].handleFatal = function (message, e) {
            throw e;
          };

        if (serviceName === 'session') {
          happnMock.services[serviceName].config = {};
          return happnMock.services[serviceName].initializeCaches(eachServiceCB);
        }

        if (!happnMock.services[serviceName].initialize) return eachServiceCB();
        else
          testServices[serviceName].initialize(
            testConfig.services[serviceName] || {},
            eachServiceCB
          );
      },
      function (e) {
        if (e) return callback(e);
        callback(null, test._.merge(happnMock, overrides));
      }
    );
  };

  let serviceInstance;
  let mockHappn;
  let upsertGroupStub;
  let getUserStub;
  let upsertUserStub;
  let checkpointStub;
  let usersStub;
  let groupsStub;

  beforeEach(() => {
    mockHappn = {
      config: {
        disableDefaultAdminNetworkConnections: true,
        secure: true,
      },
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          upsert: test.sinon.stub(),
          get: test.sinon.stub(),
          pathField: 'mockPath',
        },
        crypto: test.sinon.stub(),
        session: {
          activeSessions: {
            all: test.sinon.stub(),
          },
          securityDirectoryChanged: test.sinon.stub(),
          attachSession: test.sinon.stub(),
          disconnectSessions: test.sinon.stub(),
          getSession: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
          toMilliseconds: test.sinon.stub().returns(60000),
          buildBoundProxy: test.sinon.stub(),
          stringContainsAny: test.sinon.stub(),
        },
        error: {
          InvalidCredentialsError: test.sinon.stub().returns(new Error('InvalidCredentialsError')),
          AccessDeniedError: test.sinon.stub().returns(new Error('AccessDeniedError')),
          handleFatal: test.sinon.stub().returns(new Error('handleFatalError')),
        },
        system: {
          name: 'mockName',
          getDescription: test.sinon.stub(),
        },
      },
    };
  });

  afterEach(() => {
    if (groupsStub && checkpointStub && usersStub && getUserStub && upsertUserStub) {
      groupsStub.restore();
      checkpointStub.restore();
      usersStub.restore();
      getUserStub.restore();
      upsertUserStub.restore();
      upsertGroupStub.restore();
    }
    mockHappn = null;
    serviceInstance = null;
    test.sinon.restore();
  });
  // integration test
  it('should test the session filtering capability', function (done) {
    var testSession = {
      user: {
        username: 'WEB_SESSION',
      },
      type: 0,
    };

    var testSessionNotFound = {
      user: {
        username: 'WEB_SESSION',
      },
      type: 1,
    };

    var foundItem = [testSession].filter(
      sift(serviceConfig.services.security.config.profiles[0].session)
    );

    test.expect(foundItem.length).to.be(1);

    var notFoundItem = [testSessionNotFound].filter(
      sift(serviceConfig.services.security.config.profiles[0].session)
    );

    test.expect(notFoundItem.length).to.be(0);

    var foundInGroupItem = [testSessionNotFound, testSession].filter(
      sift(serviceConfig.services.security.config.profiles[0].session)
    );

    test.expect(foundInGroupItem.length).to.be(1);

    var testSession1 = {
      user: {
        groups: {
          REST_DEVICES: {
            permissions: {},
          },
        },
      },
      type: 0,
    };

    var foundItemProfile1 = [testSession1].filter(
      sift(serviceConfig.services.security.config.profiles[1].session)
    );

    test.expect(foundItemProfile1.length).to.be(1);

    var testSession2 = {
      user: {
        groups: {
          TRUSTED_DEVICES: {
            permissions: {},
          },
        },
      },
      type: 1,
    };

    var foundItemProfile2 = [testSession2, testSession1].filter(
      sift(serviceConfig.services.security.config.profiles[2].session)
    );

    test.expect(foundItemProfile2.length).to.be(1);

    test.expect(foundItemProfile2[0].user.groups.TRUSTED_DEVICES).to.not.be(null);
    test.expect(foundItemProfile2[0].user.groups.TRUSTED_DEVICES).to.not.be(undefined);

    done();
  });

  it('should test the sign and fail to verify function of the crypto service, bad digest', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var Crypto = require('happn-util-crypto');

      var crypto = new Crypto();

      var testKeyPair = crypto.createKeyPair();

      var nonce = crypto.createHashFromString(test.commons.uuid.v4().toString());

      var verifyResult = happnMock.services.crypto.verify(
        nonce,
        'a dodgy digest',
        testKeyPair.publicKey
      );

      test.expect(verifyResult).to.be(false);

      stopServices(happnMock, done);
    });
  }).timeout(4000);

  it('should test the sign and fail to verify function of the crypto service, bad nonce', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var Crypto = require('happn-util-crypto');
      var crypto = new Crypto();

      var testKeyPair = crypto.createKeyPair();

      var nonce = crypto.createHashFromString(test.commons.uuid.v4().toString());
      var digest = crypto.sign(nonce, testKeyPair.privateKey);

      var verifyResult = happnMock.services.crypto.verify(
        'a dodgy nonce',
        digest,
        testKeyPair.publicKey
      );

      test.expect(verifyResult).to.be(false);

      stopServices(happnMock, done);
    });
  }).timeout(4000);

  it('should test the sign and verify function of the crypto service', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var Crypto = require('happn-util-crypto');
      var crypto = new Crypto();

      var testKeyPair = crypto.createKeyPair();

      var nonce = crypto.createHashFromString(test.commons.uuid.v4().toString());
      var digest = crypto.sign(nonce, testKeyPair.privateKey);

      var verifyResult = happnMock.services.crypto.verify(nonce, digest, testKeyPair.publicKey);

      test.expect(verifyResult).to.be(true);
      stopServices(happnMock, done);
    });
  }).timeout(4000);

  it('should test the sign and verify function of the crypto service, from a generated nonce', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var Crypto = require('happn-util-crypto');
      var crypto = new Crypto();

      var testKeyPair = crypto.createKeyPair();

      var nonce = happnMock.services.crypto.generateNonce();
      var digest = crypto.sign(nonce, testKeyPair.privateKey);

      var verifyResult = happnMock.services.crypto.verify(nonce, digest, testKeyPair.publicKey);
      test.expect(verifyResult).to.be(true);
      stopServices(happnMock, done);
    });
  }).timeout(4000);

  it('should test the default config settings', function (done) {
    var happn = require('../../../lib/index');
    var happn_client = happn.client;

    var clientInstance = happn_client.__instance({
      username: '_ADMIN',
      keyPair: {
        publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2',
        privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
      },
    });

    test
      .expect(clientInstance.options.publicKey)
      .to.be('AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2');
    test
      .expect(clientInstance.options.privateKey)
      .to.be('Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=');

    clientInstance = happn_client.__instance({
      username: '_ADMIN',
      publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2',
      privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
    });

    test
      .expect(clientInstance.options.publicKey)
      .to.be('AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2');
    test
      .expect(clientInstance.options.privateKey)
      .to.be('Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=');

    clientInstance = happn_client.__instance({
      username: '_ADMIN',
      password: 'happntest',
    });

    test.expect(clientInstance.options.username).to.be('_ADMIN');
    test.expect(clientInstance.options.password).to.be('happntest');

    clientInstance = happn_client.__instance({
      config: {
        username: '_ADMIN',
        password: 'happntest',
      },
    });

    test.expect(clientInstance.options.username).to.be('_ADMIN');
    test.expect(clientInstance.options.password).to.be('happntest');

    done();
  });

  it('should test the __prepareLogin method, password', function (done) {
    var happn = require('../../../lib/index');
    var happn_client = happn.client;

    var clientInstance = happn_client.__instance({
      username: '_ADMIN',
      password: 'happnTestPWD',
    });

    clientInstance.serverInfo = {};

    var loginParameters = {
      username: clientInstance.options.username,
      password: 'happnTestPWD',
    };

    clientInstance.performRequest = function (path, action, data, options, cb) {
      cb(new Error('this wasnt meant to happn'));
    };

    //loginParameters, callback
    clientInstance.__prepareLogin(loginParameters, function (e, prepared) {
      if (e) return done(e);

      test.expect(prepared.username).to.be(clientInstance.options.username);
      test.expect(prepared.password).to.be('happnTestPWD');

      done();
    });
  });

  it('should test the __prepareLogin method, digest', function (done) {
    var happn = require('../../../lib/index');
    var happn_client = happn.client;

    var Crypto = require('happn-util-crypto');
    var crypto = new Crypto();

    var nonce;

    var clientInstance = happn_client.__instance({
      username: '_ADMIN',
      keyPair: crypto.createKeyPair(),
    });

    clientInstance.serverInfo = {};

    var loginParameters = {
      username: clientInstance.options.username,
      publicKey: clientInstance.options.publicKey,
      loginType: 'digest',
    };

    clientInstance.__performSystemRequest = function (action, data, options, cb) {
      var nonce_requests = {};

      if (!options) options = {};

      if (action === 'request-nonce') {
        nonce = crypto.generateNonce();

        var request = {
          nonce: nonce,
          publicKey: data.publicKey,
        };

        nonce_requests[nonce] = request;

        cb(null, {
          nonce: nonce,
        });
      }
    };

    clientInstance.__ensureCryptoLibrary(function (e) {
      if (e) return done(e);

      //loginParameters, callback
      clientInstance.__prepareLogin(loginParameters, function (e, prepared) {
        if (e) return done(e);

        var verificationResult = crypto.verify(
          nonce,
          prepared.digest,
          clientInstance.options.publicKey
        );

        test.expect(verificationResult).to.be(true);

        done();
      });
    });
  });

  it('tests the security services __profileSession method, default profiles', function (done) {
    var session = {
      user: {
        username: 'WEB_SESSION',
      },
    };

    mockServices(function (e, happnMock) {
      if (e) return done(e);

      happnMock.services.security.profileSession(session);

      test.expect(session.policy[0].ttl).to.be(0);
      test.expect(session.policy[1].ttl).to.be(0);

      test.expect(session.policy[0].inactivity_threshold).to.be(Infinity);
      test.expect(session.policy[1].inactivity_threshold).to.be(Infinity);

      stopServices(happnMock, done);
    });
  });

  it('tests the security services authorize method', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        type: 0,
        user: {
          username: 'BLAH',
          groups: {},
        },
        policy: {
          1: {
            ttl: 2000,
          },
          0: {
            ttl: 4000,
          },
        },
      };

      happnMock.services.security.__checkRevocations = function (session, cb) {
        cb(null, true);
      };

      happnMock.services.security.checkpoint._authorizeUser = function (
        session,
        path,
        action,
        callback
      ) {
        callback(null, false);
      };

      happnMock.services.security.authorize(session, null, null, function (e, authorized) {
        if (e) return done(e);
        test.expect(authorized).to.be(false);
        session.bypassAuthUser = true;
        happnMock.services.security.authorize(session, null, null, function (e, authorized) {
          if (e) return done(e);
          test.expect(authorized).to.be(true);
          done();
        });
      });
    });
  });

  it('tests the security checkpoints _authorizeSession ttl', function (done) {
    this.timeout(20000);

    var checkpoint = new CheckPoint({
      logger: require('happn-logger'),
    });

    var CacheService = require('../../../lib/services/cache/service');
    var cacheService = new CacheService();

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    cacheService.happn = {
      services: {
        utils: utils,
      },
    };

    cacheService.initialize({}, function (e) {
      if (e) return done(e);

      var securityService = {
        happn: {
          services: {
            utils: utils,
          },
        },
        cacheService: cacheService,
        onDataChanged: function () {},
      };

      var testSession = {
        id: 99,
        type: 1,
        timestamp: Date.now(),
        policy: {
          1: {
            ttl: 2000,
          },
          0: {
            ttl: 4000,
          },
        },
      };

      var SessionService = require('../../../lib/services/session/service');
      var sessionInstance = new SessionService({
        logger: require('happn-logger'),
      });

      sessionInstance.happn = {
        services: {
          utils: utils,
        },
      };

      checkpoint.happn = {
        services: {
          utils: utils,
          cache: cacheService,
          session: sessionInstance,
        },
      };

      checkpoint.initialize({}, securityService, function (e) {
        if (e) return done(e);

        checkpoint._authorizeSession(testSession, '/test/blah', 'on', function (e) {
          if (e) return done(e);

          setTimeout(function () {
            checkpoint._authorizeSession(
              testSession,
              '/test/blah',
              'on',
              function (e, authorized, reason) {
                test.expect(authorized).to.be(false);
                test.expect(reason).to.be('expired session token');

                testSession.type = 0;

                //we have a more permissive ttl for stateless sessions
                checkpoint._authorizeSession(
                  testSession,
                  '/test/blah',
                  'on',
                  function (e, authorized) {
                    test.expect(authorized).to.be(true);

                    done();
                  }
                );
              }
            );
          }, 2500);
        });
      });
    });
  });

  it('tests the security checkpoints _authorizeSession inactivity_threshold timed out', function (done) {
    this.timeout(20000);

    var checkpoint = new CheckPoint({
      logger: require('happn-logger'),
    });

    var CacheService = require('../../../lib/services/cache/service');
    var cacheService = new CacheService();

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    cacheService.happn = {
      services: {
        utils: utils,
      },
    };

    cacheService.initialize({}, function (e) {
      if (e) return done(e);

      var securityService = {
        happn: {
          services: {
            utils: utils,
          },
        },
        cacheService: cacheService,
        onDataChanged: function () {},
      };

      var testSession = {
        id: 99,
        type: 1,
        timestamp: Date.now(),
        policy: {
          1: {
            ttl: 6000,
            inactivity_threshold: 1000,
          },
          0: {
            ttl: 5000,
            inactivity_threshold: 10000,
          },
        },
      };

      var SessionService = require('../../../lib/services/session/service');
      var sessionInstance = new SessionService({
        logger: require('happn-logger'),
      });

      sessionInstance.happn = {
        services: {
          utils: utils,
        },
      };

      checkpoint.happn = {
        services: {
          utils: utils,
          cache: cacheService,
          session: sessionInstance,
        },
      };

      checkpoint.initialize({}, securityService, function (e) {
        if (e) return done(e);

        setTimeout(function () {
          checkpoint._authorizeSession(
            testSession,
            '/test/blah',
            'on',
            function (e, authorized, reason) {
              if (e) return done(e);

              test.expect(authorized).to.be(false);
              test.expect(reason).to.be('session inactivity threshold reached');

              testSession.type = 0; //should be fine - plenty of time

              checkpoint._authorizeSession(
                testSession,
                '/test/blah',
                'on',
                function (e, authorized) {
                  test.expect(authorized).to.be(true);
                  checkpoint.stop();
                  done();
                }
              );
            }
          );
        }, 1500);
      });
    });
  });

  it('tests the security checkpoints _authorizeSession inactivity_threshold active then timed out', function (done) {
    this.timeout(20000);

    var checkpoint = new CheckPoint({
      logger: require('happn-logger'),
    });

    var CacheService = require('../../../lib/services/cache/service');
    var cacheService = new CacheService();

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    cacheService.happn = {
      services: {
        utils: utils,
      },
    };

    cacheService.initialize({}, function (e) {
      if (e) return done(e);

      var securityService = {
        happn: {
          services: {
            utils: utils,
          },
        },
        cacheService: cacheService,
        onDataChanged: function () {},
      };

      var testSession = {
        id: 99,
        type: 1,
        timestamp: Date.now(),
        policy: {
          1: {
            ttl: 6000,
            inactivity_threshold: 1000,
          },
          0: {
            ttl: 5000,
            inactivity_threshold: 10000,
          },
        },
      };

      var SessionService = require('../../../lib/services/session/service');
      var sessionInstance = new SessionService({
        logger: require('happn-logger'),
      });

      sessionInstance.happn = {
        services: {
          utils: utils,
        },
      };

      checkpoint.happn = {
        services: {
          utils: utils,
          cache: cacheService,
          session: sessionInstance,
        },
      };

      checkpoint.initialize({}, securityService, function (e) {
        if (e) return done(e);

        checkpoint._authorizeSession(testSession, '/test/blah', 'on', function (e, authorized) {
          if (e) return done(e);

          test.expect(authorized).to.be(true);

          setTimeout(function () {
            checkpoint._authorizeSession(
              testSession,
              '/test/blah',
              'on',
              function (e, authorized, reason) {
                test.expect(authorized).to.be(false);
                test.expect(reason).to.be('session inactivity threshold reached');

                checkpoint.stop();
                done();
              }
            );
          }, 1500);
        });
      });
    });
  });

  it('tests the security checkpoints _authorizeSession inactivity_threshold keep-alive', function (done) {
    this.timeout(20000);

    var checkpoint = new CheckPoint({
      logger: require('happn-logger'),
    });

    var CacheService = require('../../../lib/services/cache/service');
    var cacheService = new CacheService();

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    cacheService.happn = {
      services: {
        utils: utils,
      },
    };

    cacheService.initialize({}, function (e) {
      if (e) return done(e);

      var securityService = {
        happn: {
          services: {
            utils: utils,
          },
        },
        cacheService: cacheService,
        onDataChanged: function () {},
      };

      var testSession = {
        id: 99,
        type: 1,
        timestamp: Date.now(),
        policy: {
          1: {
            inactivity_threshold: 2000,
          },
          0: {
            inactivity_threshold: 2000,
          },
        },
      };

      var SessionService = require('../../../lib/services/session/service');
      var sessionInstance = new SessionService({
        logger: require('happn-logger'),
      });

      sessionInstance.happn = {
        services: {
          utils: utils,
        },
      };

      checkpoint.happn = {
        services: {
          utils: utils,
          cache: cacheService,
          session: sessionInstance,
        },
      };

      checkpoint.initialize({}, securityService, function (e) {
        if (e) return done(e);

        var counter = 0;

        var checkSessionIsAlive = function () {
          checkpoint._authorizeSession(testSession, '/test/blah', 'on', function (e, authorized) {
            test.expect(authorized).to.be(true);

            if (counter < 3) {
              counter++;

              setTimeout(function () {
                checkSessionIsAlive();
              }, 1200);
            } else {
              testSession.type = 0;

              setTimeout(function () {
                return checkpoint._authorizeSession(
                  testSession,
                  '/test/blah',
                  'on',
                  function (e, authorized, reason) {
                    test.expect(authorized).to.be(false);
                    test.expect(reason).to.be('session inactivity threshold reached');

                    checkpoint.stop();
                    done();
                  }
                );
              }, 2100);
            }
          });
        };

        checkSessionIsAlive();
      });
    });
  });

  it('tests the security checkpoints _authorizeSession inactivity_threshold', function (done) {
    this.timeout(20000);

    var checkpoint = new CheckPoint({
      logger: require('happn-logger'),
    });

    var CacheService = require('../../../lib/services/cache/service');
    var cacheService = new CacheService();

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    cacheService.happn = {
      services: {
        utils: utils,
      },
    };

    var testSession = {
      id: 99,
      type: 1,
      timestamp: Date.now(),
      policy: {
        1: {
          inactivity_threshold: 2000,
        },
        0: {
          inactivity_threshold: 2000,
        },
      },
    };

    var securityService = {
      happn: {
        services: {
          utils: utils,
        },
      },
      cacheService: cacheService,
      onDataChanged: function () {},
    };

    var SessionService = require('../../../lib/services/session/service');
    var sessionInstance = new SessionService({
      logger: require('happn-logger'),
    });

    sessionInstance.happn = {
      services: {
        utils: utils,
      },
    };

    checkpoint.happn = {
      services: {
        utils: utils,
        cache: cacheService,
        security: securityService,
        session: sessionInstance,
      },
    };

    cacheService.initialize({}, function (e) {
      if (e) return done(e);

      checkpoint.initialize({}, securityService, function (e) {
        if (e) return done(e);

        checkpoint._authorizeSession(testSession, '/test/blah', 'on', function (e, authorized) {
          test.expect(authorized).to.be(true);

          setTimeout(function () {
            checkpoint._authorizeSession(
              testSession,
              '/test/blah',
              'on',
              function (e, authorized, reason) {
                test.expect(authorized).to.be(false);
                test.expect(reason).to.be('session inactivity threshold reached');

                checkpoint.stop();
                done();
              }
            );
          }, 2100);
        });
      });
    });
  });

  it('tests the security checkpoints _authorizeSession permissions passthrough', function (done) {
    this.timeout(20000);

    var checkpoint = new CheckPoint({
      logger: require('happn-logger'),
    });

    var CacheService = require('../../../lib/services/cache/service');
    var cacheService = new CacheService();

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    cacheService.happn = {
      services: {
        utils: utils,
      },
    };

    var testSession = {
      id: 99,
      type: 0,
      timestamp: Date.now(),
      policy: {
        1: {
          ttl: 6000,
          inactivity_threshold: 1000,
        },
        0: {
          ttl: 15000,
          inactivity_threshold: 2000,
          permissions: {
            '/test/permission/*': {
              actions: ['*'],
            },
          },
        },
      },
    };

    var securityService = {
      happn: {
        services: {
          utils: utils,
        },
      },
      cacheService: cacheService,
      onDataChanged: function () {},
    };

    var SessionService = require('../../../lib/services/session/service');
    var sessionInstance = new SessionService({
      logger: require('happn-logger'),
    });

    sessionInstance.happn = {
      services: {
        utils: utils,
      },
    };

    checkpoint.happn = {
      services: {
        utils: utils,
        cache: cacheService,
        security: securityService,
        session: sessionInstance,
      },
    };

    cacheService.initialize({}, function (e) {
      if (e) return done(e);

      checkpoint.initialize({}, securityService, function (e) {
        if (e) return done(e);

        checkpoint._authorizeSession(
          testSession,
          '/test/permission/24',
          'on',
          function (e, authorized, reason, passthrough1) {
            if (e) return done(e);

            test.expect(passthrough1).to.be(true);

            checkpoint._authorizeSession(
              testSession,
              '/test1/permission/24',
              'on',
              function (e, authorized, reason, passthrough2) {
                if (e) return done(e);

                test.expect(passthrough2).to.be(undefined);
                test.expect(authorized).to.be(false);

                checkpoint.stop();
                done();
              }
            );
          }
        );
      });
    });
  });

  it('tests the security checkpoints token usage limit', function (done) {
    this.timeout(20000);

    var checkpoint = new CheckPoint({
      logger: require('happn-logger'),
    });

    var CacheService = require('../../../lib/services/cache/service');
    var cacheService = new CacheService();

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    cacheService.happn = {
      services: {
        utils: utils,
      },
    };

    var testSession = {
      id: 99,
      type: 0,
      timestamp: Date.now(),
      policy: {
        1: {
          usage_limit: 2,
          ttl: 2000,
        },
        0: {
          usage_limit: 1,
          ttl: 2000,
        },
      },
    };
    var securityService = {
      happn: {
        services: {
          utils: utils,
        },
      },
      cacheService,
      onDataChanged: function () {},
    };

    var SessionService = require('../../../lib/services/session/service');
    var sessionInstance = new SessionService({
      logger: require('happn-logger'),
    });

    sessionInstance.happn = {
      services: {
        utils: utils,
      },
    };

    checkpoint.happn = {
      services: {
        utils: utils,
        cache: cacheService,
        security: securityService,
        session: sessionInstance,
      },
    };
    cacheService.initialize({}, function (e) {
      if (e) return done(e);
      checkpoint.initialize({}, securityService, function (e) {
        if (e) return done(e);
        test.expect(checkpoint.__checkUsageLimit(testSession, testSession.policy[1])).to.be(true);
        test.expect(checkpoint.__checkUsageLimit(testSession, testSession.policy[1])).to.be(true);
        test.expect(checkpoint.__checkUsageLimit(testSession, testSession.policy[1])).to.be(false);
        checkpoint.stop();
        done();
      });
    });
  });

  it('tests the security services generateToken and decodeToken methods', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        id: 1,
        isToken: true,
        username: 'TEST',
        timestamp: Date.now(),
        ttl: 3000,
        permissions: {},
      };

      var token = happnMock.services.security.generateToken(session);
      var decoded = happnMock.services.security.decodeToken(token);

      for (var propertyName in session) {
        test
          .expect(JSON.stringify(session[propertyName]))
          .to.be(JSON.stringify(decoded[propertyName]));
      }

      stopServices(happnMock, done);
    });
  });

  it('tests the security services createAuthenticationNonce and verifyAuthenticationDigest methods', function (done) {
    this.timeout(5000);
    var Crypto = require('happn-util-crypto');
    var crypto = new Crypto();
    let keyPair = crypto.createKeyPair();

    var happn = require('../../../lib/index');
    var happn_client = happn.client;

    var clientInstance = happn_client.__instance({
      username: '_ADMIN',
      keyPair,
    });

    clientInstance.__ensureCryptoLibrary(function (e) {
      if (e) return done(e);

      mockServices(function (e, happnMock) {
        var mockSession = {
          publicKey: keyPair.publicKey,
        };

        test.expect(happnMock.services.security.config.defaultNonceTTL).to.be(60000);

        const nonce = happnMock.services.security.createAuthenticationNonce(mockSession);
        mockSession.digest = clientInstance.__signNonce(nonce);

        happnMock.services.security.verifyAuthenticationDigest(mockSession, function (e, verified) {
          if (e) return done(e);
          test.expect(verified).to.be(true);
          stopServices(happnMock, done);
        });
      });
    });
  });

  it('tests the security services createAuthenticationNonce method, timing out', function (done) {
    this.timeout(5000);
    var Crypto = require('happn-util-crypto');
    var crypto = new Crypto();
    let keyPair = crypto.createKeyPair();

    var happn = require('../../../lib/index');
    var happn_client = happn.client;

    var clientInstance = happn_client.__instance({
      username: '_ADMIN',
      keyPair,
    });

    clientInstance.__ensureCryptoLibrary(function (e) {
      if (e) return done(e);

      mockServices(function (e, happnMock) {
        var mockSession = {
          publicKey: keyPair.publicKey,
        };

        test.expect(happnMock.services.security.config.defaultNonceTTL).to.be(60000);

        happnMock.services.security.config.defaultNonceTTL = 500; //set it to something small
        const nonce = happnMock.services.security.createAuthenticationNonce(mockSession);
        mockSession.digest = clientInstance.__signNonce(nonce);
        setTimeout(function () {
          happnMock.services.security.verifyAuthenticationDigest(mockSession, function (e) {
            test.expect(e.toString()).to.be('Error: nonce expired or public key invalid');
            stopServices(happnMock, done);
          });
        }, 1000);
      });
    });
  });

  it('should create a user with a public key, then login using a signature', function (done) {
    this.timeout(20000);
    var Crypto = require('happn-util-crypto');
    var crypto = new Crypto();
    let keyPair = crypto.createKeyPair();

    var config = {
      secure: true,
      sessionTokenSecret:
        'absolutely necessary if you want tokens to carry on working after a restart',
      profiles: [
        {
          name: 'web-session',
          session: {
            user: {
              username: {
                $eq: 'WEB_SESSION',
              },
            },
            type: {
              $eq: 0,
            },
          },
          policy: {
            ttl: 4000,
            inactivity_threshold: 2000, //this is costly, as we need to store state on the server side
          },
        },
      ],
    };

    getService(config, function (e, instance) {
      if (e) return done(e);

      var testGroup = {
        name: 'CONNECTED_DEVICES',
        permissions: {
          '/CONNECTED_DEVICES/*': {
            actions: ['*'],
          },
        },
      };

      var testUser = {
        username: 'WEB_SESSION',
        publicKey: keyPair.publicKey,
      };

      var addedTestGroup;
      var addedTestuser;

      var serviceInstance = instance;

      serviceInstance.services.security.users.upsertGroup(
        testGroup,
        {
          overwrite: false,
        },
        function (e, result) {
          if (e) return done(e);
          addedTestGroup = result;

          serviceInstance.services.security.users.upsertUser(
            testUser,
            {
              overwrite: false,
            },
            function (e, result) {
              if (e) return done(e);
              addedTestuser = result;

              serviceInstance.services.security.users.linkGroup(
                addedTestGroup,
                addedTestuser,
                function (e) {
                  if (e) return done(e);

                  happn.client
                    .create({
                      username: testUser.username,
                      loginType: 'digest',
                      ...keyPair,
                    })

                    .then(function (clientInstance) {
                      clientInstance.disconnect(function (e) {
                        //eslint-disable-next-line no-console
                        if (e) console.warn('couldnt disconnect client:::', e);
                        serviceInstance.stop(done);
                      });
                    })

                    .catch(function (e) {
                      done(e);
                    });
                }
              );
            }
          );
        }
      );
    });
  });

  it('should create a user with a public key, then fail login to a using a signature - bad public key', function (done) {
    this.timeout(20000);

    var config = {
      secure: true,
      sessionTokenSecret:
        'absolutely necessary if you want tokens to carry on working after a restart',
      profiles: [
        {
          name: 'web-session',
          session: {
            user: {
              username: {
                $eq: 'WEB_SESSION',
              },
            },
            type: {
              $eq: 0,
            },
          },
          policy: {
            ttl: 4000,
            inactivity_threshold: 2000, //this is costly, as we need to store state on the server side
          },
        },
      ],
    };

    var CryptoService = require('../../../lib/services/crypto/service');
    var crypto = new CryptoService({
      logger: Logger,
    });
    crypto.initialize({}, function (e) {
      let keyPair = crypto.createKeyPair();
      if (e) return done(e);

      getService(config, function (e, instance) {
        if (e) return done(e);

        var testGroup = {
          name: 'CONNECTED_DEVICES',
          permissions: {
            '/CONNECTED_DEVICES/*': {
              actions: ['*'],
            },
          },
        };

        var testUser = {
          username: 'WEB_SESSION',
          publicKey: keyPair.publicKey,
        };

        var addedTestGroup;
        var addedTestuser;

        var serviceInstance = instance;

        serviceInstance.services.security.users.upsertGroup(
          testGroup,
          {
            overwrite: false,
          },
          function (e, result) {
            if (e) return done(e);
            addedTestGroup = result;

            serviceInstance.services.security.users.upsertUser(
              testUser,
              {
                overwrite: false,
              },
              function (e, result) {
                if (e) return done(e);
                addedTestuser = result;

                serviceInstance.services.security.users.linkGroup(
                  addedTestGroup,
                  addedTestuser,
                  function (e) {
                    if (e) return done(e);

                    var newKeypair = crypto.createKeyPair();

                    var creds = {
                      username: testUser.username,
                      publicKey: newKeypair.publicKey,
                      privateKey: newKeypair.privateKey,
                    };

                    happn.client
                      .create(creds)

                      .then(function () {
                        done(new Error('this was not meant to happn'));
                      })

                      .catch(function (e) {
                        test.expect(e.toString()).to.be('AccessDenied: Invalid credentials');
                        serviceInstance.stop(done);
                      });
                  }
                );
              }
            );
          }
        );
      });
    });
  });

  it('should test the policy ms settings', function () {
    var Utils = require('../../../lib/services/utils/service.js');
    var utils = new Utils({
      logger: require('happn-logger'),
    });
    const configuredConfig =
      require('../../../lib/configurators/security-profiles-configurator').configure(
        serviceConfig.services.security.config,
        utils
      );
    test.expect(configuredConfig.profiles[0].policy.ttl).to.be(4000);
    test.expect(configuredConfig.profiles[0].policy.inactivity_threshold).to.be(2000);
    test.expect(configuredConfig.profiles[1].policy.inactivity_threshold).to.be(60000 * 60 * 48);
  });

  it('should create a user and login, getting a token - then should be able to use the token to log in again', function (done) {
    this.timeout(20000);

    var config = {
      secure: true,
      sessionTokenSecret:
        'absolutely necessary if you want tokens to carry on working after a restart',
      profiles: [
        {
          name: 'web-session',
          session: {
            user: {
              username: {
                $eq: 'WEB_SESSION',
              },
            },
            type: {
              $eq: 0,
            },
          },
          policy: {
            ttl: 4000,
            inactivity_threshold: 2000, //this is costly, as we need to store state on the server side
          },
        },
      ],
    };

    getService(config, function (e, instance) {
      if (e) return done(e);

      var testGroup = {
        name: 'CONNECTED_DEVICES',
        permissions: {
          '/CONNECTED_DEVICES/*': {
            actions: ['*'],
          },
          '/test/data': {
            actions: ['*'],
          },
        },
      };

      var testUser = {
        username: 'WEB_SESSION',
        password: 'test',
      };

      var addedTestGroup;
      var addedTestuser;

      var serviceInstance = instance;

      serviceInstance.services.security.users.upsertGroup(
        testGroup,
        {
          overwrite: false,
        },
        function (e, result) {
          if (e) return done(e);
          addedTestGroup = result;

          serviceInstance.services.security.users.upsertUser(
            testUser,
            {
              overwrite: false,
            },
            function (e, result) {
              if (e) return done(e);
              addedTestuser = result;

              serviceInstance.services.security.users.linkGroup(
                addedTestGroup,
                addedTestuser,
                function (e) {
                  if (e) return done(e);

                  var creds = {
                    username: testUser.username,
                    password: testUser.password,
                  };

                  happn.client
                    .create(creds)

                    .then(function (clientInstance) {
                      var tokenCreds = {
                        username: testUser.username,
                        token: clientInstance.session.token,
                      };

                      happn.client
                        .create(tokenCreds)

                        .then(function (tokenClientInstance) {
                          tokenClientInstance.set(
                            '/test/data',
                            {
                              test: 'data',
                            },
                            function (e) {
                              if (e) return done(e);
                              tokenClientInstance.disconnect();
                              clientInstance.disconnect();
                              serviceInstance.stop(done);
                            }
                          );
                        })
                        .catch(function (e) {
                          done(e);
                        });
                    })
                    .catch(function (e) {
                      done(e);
                    });
                }
              );
            }
          );
        }
      );
    });
  });

  it('tests the processLogin method, session dropped while logging in', function (done) {
    getService(
      {
        secure: true,
      },
      function (e, instance) {
        if (e) return done(e);

        instance.services.security.processLogin = util.promisify(
          instance.services.security.processLogin
        );

        instance.services.security
          .processLogin({
            session: {
              id: 1,
            },
            request: {
              data: {
                username: '_ADMIN',
                password: 'happn',
              },
            },
          })
          .then(function () {
            done(new Error('untest.expected success'));
          })
          .catch(function (e) {
            test.expect(e.toString()).to.be('Error: session with id 1 dropped while logging in');
            stopService(instance, done);
          });
      }
    );
  }).timeout(15000);

  it('tests resetSessionPermissions method - link-group', function (done) {
    this.timeout(5000);

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {},
              },
              protocol: 1,
            },
          },
        };

        instance.services.security
          .resetSessionPermissions('link-group', {
            _meta: {
              path: '/_SYSTEM/_SECURITY/_USER/test-user-1/_USER_GROUP/test-group',
            },
          })
          .then(function (effectedSessions) {
            test.expect(effectedSessions).to.eql([
              {
                id: 1,
                username: 'test-user-1',
                isToken: false,
                previousPermissionSetKey: undefined,
                permissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                happn: undefined,
                user: {
                  username: 'test-user-1',
                  groups: {
                    'test-group': {
                      _meta: {
                        path: '/_SYSTEM/_SECURITY/_USER/test-user-1/_USER_GROUP/test-group',
                      },
                    },
                  },
                },
                protocol: 1,
                causeSubscriptionsRefresh: true,
              },
            ]);
            stopService(instance, done);
          });
      }
    );
  });

  it('tests resetSessionPermissions method - unlink-group', function (done) {
    this.timeout(5000);

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        if (e) return done(e);

        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {
                  'test-group': {},
                },
              },
              protocol: 1,
            },
          },
        };

        instance.services.security
          .resetSessionPermissions('unlink-group', {
            path: '/_SYSTEM/_SECURITY/_USER/test-user-1/_USER_GROUP/test-group',
          })
          .then(function (effectedSessions) {
            test.expect(effectedSessions).to.eql([
              {
                id: 1,
                username: 'test-user-1',
                isToken: false,
                previousPermissionSetKey: undefined,
                permissionSetKey: '2jmj7l5rSw0yVb/vlWAYkK/YBwk=',
                protocol: 1,
                happn: undefined,
                user: {
                  username: 'test-user-1',
                  groups: {},
                },
                causeSubscriptionsRefresh: true,
              },
            ]);
            stopService(instance, done);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });

  it('tests resetSessionPermissions method - delete-user', function (done) {
    this.timeout(5000);

    var ended = false;

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            ended = true;
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {
                  'test-group': {},
                },
              },
              protocol: 1,
            },
          },
        };

        instance.services.security
          .resetSessionPermissions('delete-user', {
            obj: {
              _meta: {
                path: '/_SYSTEM/_SECURITY/_USER/test-user-1',
              },
            },
          })
          .then(function (effectedSessions) {
            setTimeout(function () {
              test.expect(effectedSessions.length).to.eql(1);
              test.expect(ended).to.be(true);
              stopService(instance, done);
            }, 1000);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });

  it('tests resetSessionPermissions method - delete-group', function (done) {
    this.timeout(5000);

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {
                  'test-group': {},
                },
              },
              protocol: 1,
            },
          },
        };

        instance.services.security
          .resetSessionPermissions('delete-group', {
            obj: {
              name: 'test-group',
            },
          })
          .then(function (effectedSessions) {
            test.expect(effectedSessions).to.eql([
              {
                id: 1,
                username: 'test-user-1',
                isToken: false,
                previousPermissionSetKey: undefined,
                permissionSetKey: '2jmj7l5rSw0yVb/vlWAYkK/YBwk=',
                protocol: 1,
                happn: undefined,
                user: {
                  username: 'test-user-1',
                  groups: {},
                },
                causeSubscriptionsRefresh: true,
              },
            ]);
            stopService(instance, done);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });

  it('tests resetSessionPermissions method - upsert-group', function (done) {
    this.timeout(5000);

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {
                  'test-group': {},
                },
              },
              protocol: 1,
            },
          },
        };

        instance.services.session.__sessions['1'].data.permissionSetKey =
          instance.services.security.generatePermissionSetKey(
            instance.services.session.__sessions['1'].data.user
          );

        instance.services.security
          .resetSessionPermissions('upsert-group', {
            name: 'test-group',
          })
          .then(function (effectedSessions) {
            test.expect(effectedSessions).to.eql([
              {
                id: 1,
                username: 'test-user-1',
                isToken: false,
                previousPermissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                permissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                protocol: 1,
                happn: undefined,
                user: {
                  username: 'test-user-1',
                  groups: {
                    'test-group': {},
                  },
                },
                causeSubscriptionsRefresh: false,
              },
            ]);
            stopService(instance, done);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });

  it('tests resetSessionPermissions method - permission-removed', function (done) {
    this.timeout(5000);

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {
                  'test-group': {},
                },
              },
              protocol: 1,
            },
          },
        };

        instance.services.session.__sessions['1'].data.permissionSetKey =
          instance.services.security.generatePermissionSetKey(
            instance.services.session.__sessions['1'].data.user
          );

        instance.services.security
          .resetSessionPermissions('permission-removed', {
            groupName: 'test-group',
          })
          .then(function (effectedSessions) {
            test.expect(effectedSessions).to.eql([
              {
                id: 1,
                username: 'test-user-1',
                isToken: false,
                previousPermissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                permissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                protocol: 1,
                happn: undefined,
                user: {
                  username: 'test-user-1',
                  groups: {
                    'test-group': {},
                  },
                },
                causeSubscriptionsRefresh: true,
              },
            ]);
            stopService(instance, done);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });

  it('tests resetSessionPermissions method - permission-upserted', function (done) {
    this.timeout(5000);

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {
                  'test-group': {},
                },
              },
              protocol: 1,
            },
          },
        };

        instance.services.session.__sessions['1'].data.permissionSetKey =
          instance.services.security.generatePermissionSetKey(
            instance.services.session.__sessions['1'].data.user
          );

        instance.services.security
          .resetSessionPermissions('permission-upserted', {
            groupName: 'test-group',
          })
          .then(function (effectedSessions) {
            test.expect(effectedSessions).to.eql([
              {
                id: 1,
                username: 'test-user-1',
                isToken: false,
                previousPermissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                permissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                protocol: 1,
                happn: undefined,
                user: {
                  username: 'test-user-1',
                  groups: {
                    'test-group': {},
                  },
                },
                causeSubscriptionsRefresh: true,
              },
            ]);
            stopService(instance, done);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });

  it('tests resetSessionPermissions method - upsert-user', function (done) {
    this.timeout(5000);

    getService(
      {
        secure: true,
      },
      function (e, instance) {
        var client = {
          sessionId: '1',
          once: function (evt, handler) {
            if (evt === 'end') this.__handler = handler;
          }.bind(client),
          end: function () {
            this.__handler();
          }.bind(client),
        };

        instance.services.session.__sessions = {
          1: {
            client: client,
            data: {
              id: 1,
              user: {
                username: 'test-user-1',
                groups: {
                  'test-group': {},
                },
              },
              protocol: 1,
            },
          },
        };

        instance.services.session.__sessions['1'].data.permissionSetKey =
          instance.services.security.generatePermissionSetKey(
            instance.services.session.__sessions['1'].data.user
          );

        instance.services.security.users.getUser = function (username, callback) {
          callback(null, {
            username: username,
          });
        };

        instance.services.security
          .resetSessionPermissions('upsert-user', {
            username: 'test-user-1',
          })
          .then(function (effectedSessions) {
            test.expect(effectedSessions).to.eql([
              {
                id: 1,
                username: 'test-user-1',
                isToken: false,
                previousPermissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                permissionSetKey: '5xfClf+YJ9/4BdiLw/kvXH2uvh0=',
                protocol: 1,
                happn: undefined,
                user: {
                  username: 'test-user-1',
                },
                causeSubscriptionsRefresh: true,
              },
            ]);
            stopService(instance, done);
          })
          .catch(function (e) {
            done(e);
          });
      }
    );
  });

  it('should be able to work with configured pbkdf2Iterations', function (done) {
    mockServices(
      async (e, happnMock) => {
        if (e) return done(e);
        test.expect(happnMock.services.security.config.pbkdf2Iterations).to.be(100);
        const prepared = await happnMock.services.security.users.__prepareUserForUpsert({
          username: 'test-user',
          password: 'test',
        });
        var split = prepared.password.split('$');
        test.expect(split[0]).to.be('pbkdf2');
        test.expect(split[1]).to.be('100');
        stopServices(happnMock, done);
      },
      {
        services: {
          security: {
            pbkdf2Iterations: 100,
          },
        },
      }
    );
  });

  it('should be able to work with default pbkdf2Iterations', function (done) {
    mockServices(async (e, happnMock) => {
      if (e) return done(e);
      test.expect(happnMock.services.security.config.pbkdf2Iterations).to.be(10000);
      const prepared = await happnMock.services.security.users.__prepareUserForUpsert({
        username: 'test-user',
        password: 'test',
      });
      var split = prepared.password.split('$');
      test.expect(split[0]).to.be('pbkdf2');
      test.expect(split[1]).to.be('10000');
      stopServices(happnMock, done);
    });
  });

  it('tests the authorizeOnBehalfOf method, authorized ok', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        user: {
          username: '_ADMIN',
        },
      };

      var path = '/some/test/path';
      var action = 'SET';
      var onBehalfOf = 'test-user';

      happnMock.services.security.users.getUser = function (username, callback) {
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.getOnBehalfOfSession = function (
        _username,
        _onBehalfOf,
        _sessionType,
        getOnBehalfOfCallback
      ) {
        getOnBehalfOfCallback(null, {
          id: 'test-session-id',
          user: {
            username: 'test-user',
            groups: {},
          },
          policy: {
            1: {},
          },
          type: '1',
        });
      };

      var callback = function (err, authorized) {
        test.expect(authorized).to.be(true);
        done();
      };

      happnMock.services.security.checkpoint._authorizeSession = function (
        session,
        path,
        action,
        authorizeSessionCallback
      ) {
        authorizeSessionCallback(null, true);
      };

      happnMock.services.security.checkpoint._authorizeUser = function (
        session,
        path,
        action,
        authorizeUserCallback
      ) {
        authorizeUserCallback(null, true);
      };

      happnMock.services.security.authorizeOnBehalfOf(session, path, action, onBehalfOf, callback);
    });
  });

  it('tests the authorizeOnBehalfOf method, _authorizeSession false', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        user: {
          username: '_ADMIN',
        },
      };

      var path = '/some/test/path';
      var action = 'SET';
      var onBehalfOf = 'test-user';

      happnMock.services.security.users.getUser = function (username, callback) {
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.getOnBehalfOfSession = function (
        _username,
        _onBehalfOf,
        _sessionType,
        getOnBehalfOfCallback
      ) {
        getOnBehalfOfCallback(null, {
          id: 'test-session-id',
          user: {
            username: 'test-user',
            groups: {},
          },
          policy: {
            1: {},
          },
          type: '1',
        });
      };

      var callback = function (err, authorized) {
        test.expect(authorized).to.be(false);
        done();
      };

      happnMock.services.security.checkpoint._authorizeSession = function (
        session,
        path,
        action,
        authorizeSessionCallback
      ) {
        authorizeSessionCallback(null, false);
      };

      happnMock.services.security.checkpoint._authorizeUser = function (
        session,
        path,
        action,
        authorizeUserCallback
      ) {
        authorizeUserCallback(null, true);
      };

      happnMock.services.security.authorizeOnBehalfOf(session, path, action, onBehalfOf, callback);
    });
  });

  it('tests the authorizeOnBehalfOf method, _authorizeUser false', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        user: {
          username: '_ADMIN',
        },
      };

      var path = '/some/test/path';
      var action = 'SET';
      var onBehalfOf = 'test-user';

      happnMock.services.security.users.getUser = function (username, callback) {
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.getOnBehalfOfSession = function (
        _username,
        _onBehalfOf,
        _sessionType,
        getOnBehalfOfCallback
      ) {
        getOnBehalfOfCallback(null, {
          id: 'test-session-id',
          user: {
            username: 'test-user',
            groups: {},
          },
          policy: {
            1: {},
          },
          type: '1',
        });
      };

      var callback = function (err, authorized) {
        test.expect(authorized).to.be(false);
        done();
      };

      happnMock.services.security.checkpoint._authorizeSession = function (
        session,
        path,
        action,
        authorizeSessionCallback
      ) {
        authorizeSessionCallback(null, true);
      };

      happnMock.services.security.checkpoint._authorizeUser = function (
        session,
        path,
        action,
        authorizeUserCallback
      ) {
        authorizeUserCallback(null, false);
      };

      happnMock.services.security.authorizeOnBehalfOf(session, path, action, onBehalfOf, callback);
    });
  }).timeout(4000);

  it('tests the authorizeOnBehalfOf method, onBehalfOf not found', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        user: {
          username: '_ADMIN',
        },
      };

      var path = '/some/test/path';
      var action = 'SET';
      var onBehalfOf = 'test-user';

      happnMock.services.security.users.getUser = function (username, callback) {
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.getOnBehalfOfSession = function (
        _username,
        _onBehalfOf,
        _sessionType,
        getOnBehalfOfCallback
      ) {
        getOnBehalfOfCallback(null, null);
      };

      var callback = function (err, authorized, reason) {
        test.expect(authorized).to.be(false);
        test.expect(reason).to.be('on behalf of user does not exist');
        done();
      };

      happnMock.services.security.checkpoint._authorizeSession = function (
        session,
        path,
        action,
        authorizeSessionCallback
      ) {
        authorizeSessionCallback(null, true);
      };

      happnMock.services.security.checkpoint._authorizeUser = function (
        session,
        path,
        action,
        authorizeUserCallback
      ) {
        authorizeUserCallback(null, true);
      };

      happnMock.services.security.authorizeOnBehalfOf(session, path, action, onBehalfOf, callback);
    });
  });

  it('tests the authorizeOnBehalfOf method, onBehalfOf not _ADMIN user', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        user: {
          username: 'illuminaughty',
        },
      };

      var path = '/some/test/path';
      var action = 'SET';
      var onBehalfOf = 'test-user';

      happnMock.services.security.users.getUser = function (username, callback) {
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.getOnBehalfOfSession = function (
        _username,
        _onBehalfOf,
        _sessionType,
        getOnBehalfOfCallback
      ) {
        getOnBehalfOfCallback(null, {
          id: 'test-session-id',
          user: {
            username: 'test-user',
            groups: {},
          },
          policy: {
            1: {},
          },
          type: '1',
        });
      };

      var callback = function (err, authorized, reason) {
        test.expect(authorized).to.be(false);
        test.expect(reason).to.be('session attempting to act on behalf of is not authorized');
        done();
      };

      happnMock.services.security.checkpoint._authorizeSession = function (
        session,
        path,
        action,
        authorizeSessionCallback
      ) {
        authorizeSessionCallback(null, true);
      };

      happnMock.services.security.checkpoint._authorizeUser = function (
        session,
        path,
        action,
        authorizeUserCallback
      ) {
        authorizeUserCallback(null, true);
      };

      happnMock.services.security.authorizeOnBehalfOf(session, path, action, onBehalfOf, callback);
    });
  });

  it('tests the getOnBehalfOfSession method - uncached', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        user: {
          username: 'illuminaughty',
        },
        happn: {
          happn: 'info',
        },
      };

      var onBehalfOf = 'test-user';
      let fetchedUserFromDb = false;

      happnMock.services.security.users.getUser = function (username, callback) {
        fetchedUserFromDb = true;
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.getOnBehalfOfSession(session, onBehalfOf, 0, (e, onBehalfOf) => {
        if (e) return done(e);
        test.expect(fetchedUserFromDb).to.be(true);
        test.expect(onBehalfOf.user).to.eql({
          username: 'test-user',
          groups: {},
        });
        test.expect(onBehalfOf.happn.secure).to.eql(false);
        test.expect(typeof onBehalfOf.happn.name).to.be('string');
        test.expect(onBehalfOf.type).to.eql(0);

        const found = happnMock.services.security.cache_session_on_behalf_of.get('test-user:0');

        test.expect(found.user).to.eql({
          username: 'test-user',
          groups: {},
        });
        done();
      });
    });
  }).timeout(5000);

  it('tests the getOnBehalfOfSession method - cached', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      let session = {
        user: {
          username: 'illuminaughty',
        },
      };
      let onBehalfOf = 'test-user';

      happnMock.services.security.users.getUser = test.sinon.stub().callsArgWith(1, null, {
        username: 'test-user',
        groups: {},
      });
      happnMock.services.security.getOnBehalfOfSession(session, onBehalfOf, 1, (e) => {
        if (e) return done(e);
        happnMock.services.security.getOnBehalfOfSession(session, onBehalfOf, 1, (e) => {
          if (e) return done(e);
          test.expect(happnMock.services.security.users.getUser.callCount).to.be(1);
          done();
        });
      });
    });
  });

  it('tests the sessionFromRequest method', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);
      let warningHappened = false;
      happnMock.services.security.log = {
        warn: (message) => {
          test.expect(message.indexOf('failed decoding session token from request')).to.be(0);
          warningHappened = true;
        },
      };
      happnMock.services.security.decodeToken = (token) => {
        return JSON.parse(JSON.stringify(token));
      };
      happnMock.services.system = {
        getDescription: () => {
          return {
            name: 'test-description',
          };
        },
      };
      test
        .expect(
          happnMock.services.security.sessionFromRequest(
            {
              connection: {},
              headers: {},
              happn_session: {
                test: 'session',
              },
            },
            {}
          )
        )
        .to.eql({
          test: 'session',
        });
      happnMock.services.security.decodeToken = (token) => {
        return { token };
      };
      test
        .expect(
          happnMock.services.security.sessionFromRequest(
            {
              connection: {},
              headers: {},
              cookies: {
                get: () => {
                  return 'TEST-TOKEN';
                },
              },
            },
            {}
          )
        )
        .to.eql({
          token: 'TEST-TOKEN',
          type: 0,
          happn: {
            name: 'test-description',
          },
        });

      test.expect(warningHappened).to.be(false);

      happnMock.services.system = {
        getDescription: () => {
          throw new Error('test error');
        },
      };

      try {
        happnMock.services.security.sessionFromRequest(
          {
            connection: {},
            headers: {},
            cookies: {
              get: (cookieName) => {
                return {
                  token: 'TEST-TOKEN',
                  cookieName,
                };
              },
            },
          },
          {}
        );
      } catch (e) {
        test.expect(e.message).to.be('test error');
        done();
      }
    });
  });

  it('tests the initializeSessionTokenSecret method, found secret', async () => {
    let config = {
      secure: true,
      services: {
        security: {
          config: {
            sessionTokenSecret: undefined,
          },
        },
      },
    };
    const securityService = await initializeWithMocks(config, {
      services: {
        data: {
          get: test.utils.maybePromisify(function (path, options, callback) {
            if (typeof options === 'function') {
              callback = options;
              options = {};
            }
            if (path === '/_SYSTEM/_SECURITY/_GROUP/_ADMIN') {
              return callback(null, { data: { name: '_ADMIN' }, _meta: {} });
            }
            if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_ADMIN/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN') {
              return callback(null, { data: { username: '_ADMIN', _meta: {} } });
            }
            if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/_ADMIN/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN/_USER_GROUP/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET') {
              return callback(null, { data: { secret: 'SESSION-TOKEN-SECRET' } });
            }
            return callback(null, null);
          }),
          upsert: test.utils.maybePromisify(function (path, data, options, callback) {
            if (typeof options === 'function') {
              callback = options;
              options = {};
            }
            if (callback) callback(null, { data });
          }),
        },
      },
    });
    test.expect(securityService.config.sessionTokenSecret).to.be('SESSION-TOKEN-SECRET');
  });

  it('tests the initializeSessionTokenSecret method, unfound secret', async () => {
    let upserted,
      config = {
        secure: true,
        services: {
          security: {
            config: {
              sessionTokenSecret: 'SESSION-TOKEN-SECRET',
            },
          },
        },
      };
    await initializeWithMocks(config, {
      services: {
        data: {
          get: test.utils.maybePromisify(function (path, options, callback) {
            if (typeof options === 'function') {
              callback = options;
              options = {};
            }
            if (path === '/_SYSTEM/_SECURITY/_GROUP/_ADMIN') {
              return callback(null, { data: { name: '_ADMIN' }, _meta: {} });
            }
            if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_ADMIN/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN') {
              return callback(null, { data: { username: '_ADMIN', _meta: {} } });
            }
            if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/_ADMIN/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN/_USER_GROUP/*') {
              return callback(null, []);
            }
            // if (path === '/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET') {
            //   return callback(null, { data: { value: config.sessionTokenSecret } });
            // }
            return callback(null, null);
          }),
          upsert: test.utils.maybePromisify(function (path, data, options, callback) {
            if (typeof options === 'function') {
              callback = options;
              options = {};
            }
            if (path === '/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET') {
              upserted = data.secret;
            }
            if (callback) callback(null, { data });
          }),
        },
      },
    });
    test.expect(upserted != null).to.be(true);
    test.expect(config.services.security.config.sessionTokenSecret).to.be(upserted);
  });

  it('tests the initializeSessionTokenSecret method, error on get', async () => {
    let config = {
      secure: true,
      services: {
        security: {
          config: {
            sessionTokenSecret: undefined,
          },
        },
      },
    };
    let errorMessage;
    try {
      await initializeWithMocks(config, {
        services: {
          data: {
            get: test.utils.maybePromisify(function (path, options, callback) {
              if (typeof options === 'function') {
                callback = options;
                options = {};
              }
              if (path === '/_SYSTEM/_SECURITY/_GROUP/_ADMIN') {
                return callback(null, { data: { name: '_ADMIN' }, _meta: {} });
              }
              if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_ADMIN/*') {
                return callback(null, []);
              }
              if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN') {
                return callback(null, { data: { username: '_ADMIN', _meta: {} } });
              }
              if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/_ADMIN/*') {
                return callback(null, []);
              }
              if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN/_USER_GROUP/*') {
                return callback(null, []);
              }
              if (path === '/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET') {
                return callback(new Error('test-error'));
              }
              return callback(null, null);
            }),
            upsert: test.utils.maybePromisify(function (path, data, options, callback) {
              if (typeof options === 'function') {
                callback = options;
                options = {};
              }
              if (callback) callback(null, { data });
            }),
          },
        },
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('test-error');
  });

  it('tests the initializeSessionTokenSecret method, error on upsert', async () => {
    let config = {
      secure: true,
      services: {
        security: {
          config: {
            sessionTokenSecret: undefined,
          },
        },
      },
    };
    let errorMessage;
    try {
      await initializeWithMocks(config, {
        services: {
          data: {
            get: test.utils.maybePromisify(function (path, options, callback) {
              if (typeof options === 'function') {
                callback = options;
                options = {};
              }
              if (path === '/_SYSTEM/_SECURITY/_GROUP/_ADMIN') {
                return callback(null, { data: { name: '_ADMIN' }, _meta: {} });
              }
              if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_ADMIN/*') {
                return callback(null, []);
              }
              if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN') {
                return callback(null, { data: { username: '_ADMIN', _meta: {} } });
              }
              if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/_ADMIN/*') {
                return callback(null, []);
              }
              if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN/_USER_GROUP/*') {
                return callback(null, []);
              }
              return callback(null, null);
            }),
            upsert: test.utils.maybePromisify(function (path, data, options, callback) {
              if (typeof options === 'function') {
                callback = options;
                options = {};
              }
              if (path === '/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET') {
                return callback(new Error('test-error'));
              }
              if (callback) callback(null, { data });
            }),
          },
        },
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('test-error');
  });

  it('tests the processAuthorize method, will return an error early if no message.request.path', (done) => {
    const SecurityService = require('../../../lib/services/security/service');
    const ErrorService = require('../../../lib/services/error/service');

    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const errorServiceInst = new ErrorService({
      logger: Logger,
    });
    _.set(serviceInst, 'happn.services.error', errorServiceInst);
    let message = { request: { noPath: {}, action: 'on' } };
    serviceInst.processAuthorize(message, (e, r) => {
      test.expect(e.toString()).to.be('AccessDenied: invalid path');
      test.expect(r).to.be(undefined);
      done();
    });
  });

  it('tests the processAuthorize method, will return an error early if nullish (empty string) message.request.path', (done) => {
    const SecurityService = require('../../../lib/services/security/service');
    const ErrorService = require('../../../lib/services/error/service');

    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const errorServiceInst = new ErrorService({
      logger: Logger,
    });
    _.set(serviceInst, 'happn.services.error', errorServiceInst);
    let message = { request: { path: '', action: 'on' } };
    serviceInst.processAuthorize(message, (e, r) => {
      test.expect(e.toString()).to.be('AccessDenied: invalid path');
      test.expect(r).to.be(undefined);
      done();
    });
  });

  it('tests ensureAdminUser, user not exists', async () => {
    let upserted,
      config = {
        secure: true,
        services: {
          security: {
            config: {
              sessionTokenSecret: 'SESSION-TOKEN-SECRET',
            },
          },
        },
      };
    let callCount = 0;
    await initializeWithMocks(config, {
      services: {
        data: {
          get: test.utils.maybePromisify(function (path, options, callback) {
            if (typeof options === 'function') {
              callback = options;
              options = {};
            }
            if (path === '/_SYSTEM/_SECURITY/_GROUP/_ADMIN') {
              return callback(null, { data: { name: '_ADMIN' }, _meta: {} });
            }
            if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_ADMIN/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN') {
              callCount++;
              return callback(
                null,
                callCount === 1 ? null : { data: { username: '_ADMIN' }, _meta: {} }
              );
            }
            if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN/_USER_GROUP/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/_ADMIN/*') {
              return callback(null, []);
            }
            if (path === '/_SYSTEM/_SECURITY/_USER/_ADMIN/_USER_GROUP/*') {
              return callback(null, []);
            }
            return callback(null, null);
          }),
          upsert: test.utils.maybePromisify(function (path, data, options, callback) {
            if (typeof options === 'function') {
              callback = options;
              options = {};
            }
            if (path === '/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET') {
              upserted = data.secret;
            }
            if (callback) callback(null, { data });
          }),
        },
      },
    });
    test.expect(upserted != null).to.be(true);
    test.expect(config.services.security.config.sessionTokenSecret).to.be(upserted);
  });

  it('tests initialize - sets config.disableDefaultAdminNetworkConnections equal to true', async () => {
    const mockCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {};

    serviceInst.happn = {
      config: {
        disableDefaultAdminNetworkConnections: true,
      },
    };

    serviceInst.initialize(mockConfig, mockCallback);

    test.chai.expect(mockConfig.disableDefaultAdminNetworkConnections).to.be.true;
  });

  it('tests initialize - sets config.defaultNonceTTL and config.sessionActivityTTL to equal 60000', async () => {
    const milliSeconds = test.sinon.stub().returns(60000);
    const mockCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {
      defaultNonceTTL: 500,
      sessionActivityTTL: 500,
      updateSubscriptionsOnSecurityDirectoryChanged: true,
      logSessionActivity: true,
      lockTokenToLoginType: true,
    };

    serviceInst.happn = {
      config: {
        disableDefaultAdminNetworkConnections: true,
      },
      services: {
        data: 'mockData',
        cache: 'mockCache',
        crypto: 'mockCrypto',
        session: 'mockSession',
        utils: { toMilliseconds: milliSeconds },
        error: 'mockError',
      },
      dataService: { pathField: 'mockPathField' },
    };

    serviceInst.initialize(mockConfig, mockCallback);

    test.chai.expect(mockConfig.defaultNonceTTL).to.equal(60000);
    test.chai.expect(mockConfig.sessionActivityTTL).to.equal(60000);
  });

  it('tests processUnsecureLogin - it returns callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      session: { id: 1 },
      info: 'mockInfo',
      request: { data: { info: 'mockInfo' } },
    };
    const mockCallback = test.sinon.stub().returns('test callback');

    serviceInst.happn = {
      services: {
        session: {
          attachSession: test.sinon.stub().returns('mock'),
        },
      },
    };

    const result = serviceInst.processUnsecureLogin(mockMessage, mockCallback);

    test.chai.expect(result).to.equal('test callback');
    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
      session: { id: 1 },
      info: 'mockInfo',
      request: { data: { info: 'mockInfo' } },
      response: { data: 'mock' },
    });
  });

  it('tests processLogin - #matchAuthProvider is called and callback is called with error.', async () => {
    const callback = test.sinon.stub();
    const mockMessage = { request: { data: { token: null, authType: 'mockAuthType' } } };

    initializer({ allowUserChooseAuthProvider: false }, mockHappn, true);

    await require('node:timers/promises').setTimeout(50);

    serviceInstance.processLogin(mockMessage, callback);

    test.chai.expect(callback).to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('tests login - #matchAuthProvider is called and callback is called with error.', async () => {
    const mockCredentials = {
      token: null,
      authType: null,
      username: 'mockUsername',
    };
    const mockSessionId = 1;
    const mockRequest = {};
    const callback = test.sinon.stub();

    await initializer({}, mockHappn, true);
    getUserStub.onCall(1).callsFake((_, cb) => cb(new Error('mockError')));

    serviceInstance.login(mockCredentials, mockSessionId, mockRequest, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
  });

  it('tests processAuthorizeUnsecure', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('tests');

    const result = serviceInst.processAuthorizeUnsecure('mockMessage', mockCallback);

    test.chai.expect(result).to.equal('tests');
    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mockMessage');
  });

  it('tests processAuthorize - return this.authorizeOnBehalfOf, calls callback with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
    };

    serviceInst.authorizeOnBehalfOf = test.sinon.stub().callsFake((_, __, ___, ____, callback) => {
      callback('mockError', null, null, null);
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
  });

  it('tests processAuthorize - return this.authorizeOnBehalfOf, authorized and reason is null and returns callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
    };

    serviceInst.happn = {
      services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
    };

    serviceInst.authorizeOnBehalfOf = test.sinon.stub().callsFake((_, __, ___, ____, callback) => {
      callback(null, null, null, null);
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('test');
  });

  it('tests processAuthorize - return this.authorizeOnBehalfOf, authorized is not null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
    };

    serviceInst.authorizeOnBehalfOf = test.sinon.stub().callsFake((_, __, ___, ____, callback) => {
      callback(null, 'mockAuthorised', null, 'mockOnBehalfOfSession');
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
      session: 'mockOnBehalfOfSession',
    });
  });

  it('tests processAuthorize - return this.authorizeOnBehalfOf, authorized and reason is not null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
    };

    serviceInst.happn = {
      services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
    };

    serviceInst.authorizeOnBehalfOf = test.sinon.stub().callsFake((_, __, ___, ____, callback) => {
      callback(null, null, 'mockReason', null);
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly('test');
    test.chai
      .expect(serviceInst.happn.services.error.AccessDeniedError)
      .to.have.been.calledWithExactly(
        'unauthorized',
        'mockReason request on behalf of unauthorised user: mock'
      );
  });

  it('tests processAuthorize - return this.authorize, calls calback with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: '_ADMIN' } },
    };

    serviceInst.happn = {
      services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
    };

    serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
      callback('mockError', null, null);
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
  });

  it('tests processAuthorize - return this.authorize, authorized is null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: '_ADMIN' } },
    };

    serviceInst.happn = {
      services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
    };

    serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
      callback(null, null, null);
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('test');
  });

  it('tests processAuthorize - return this.authorize, authorized is not null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: '_ADMIN' } },
    };

    serviceInst.happn = {
      services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
    };

    serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
      callback(null, 'mockAuthorized', 'mockReason');
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
      request: { path: 'mockPath', action: 'get', options: { onBehalfOf: '_ADMIN' } },
    });
  });

  it('tests processNonceRequest - throws error if there is no request.publicKey', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      response: {},
      request: { data: 'mockData' },
    };

    serviceInst.processNonceRequest(mockMessage, mockCallback);

    test.chai.expect(mockCallback.lastCall.args[0].message).to.equal('no public key with request');
  });

  it('tests AccessDeniedError', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    serviceInst.happn = {
      services: {
        error: {
          AccessDeniedError: test.sinon.stub().returns('test'),
        },
      },
    };

    const result = serviceInst.AccessDeniedError('mockMessage', 'mockReason');

    test.chai.expect(result).to.equal('test');
  });

  it('tests get sessionManagementActive - returns this.#sessionManagementActive', async () => {
    initializer({}, mockHappn, true);

    await require('node:timers/promises').setTimeout(50);

    const result = serviceInstance.sessionManagementActive;

    test.chai.expect(result).to.be.undefined;
  });

  it('tests #ensureAdminUser - return if foundUser is truthy.', async () => {
    initializer(
      { allowAnonymousAccess: true, adminGroup: {}, adminUser: { password: 'mockPassword' } },
      mockHappn,
      true
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(getUserStub).to.have.been.calledWithExactly('_ADMIN');
    test.chai
      .expect(upsertGroupStub)
      .to.have.been.calledWithExactly(
        { name: '_ADMIN', permissions: { '*': { actions: ['*'] } } },
        {}
      );
  });

  it('tests #ensureAdminUser - foundUser is falsy.', async () => {
    const linkGroupStub = test.sinon.stub(Groups.prototype, 'linkGroup');
    initializer(
      { allowAnonymousAccess: true, adminGroup: {}, adminUser: { password: 'mockPassword' } },
      mockHappn
    );
    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(upsertUserStub)
      .to.have.been.calledWithExactly({ password: 'mockPassword', username: '_ADMIN' }, {});
    test.chai
      .expect(linkGroupStub)
      .to.have.been.calledWithExactly('mockUpsertedUser', 'mockUpsertUser');

    linkGroupStub.restore();
  });

  it('tests #ensureAnonymousUser returns anonymousUser', async () => {
    initializer({ allowAnonymousAccess: true }, mockHappn, true);
    getUserStub.onSecondCall().returns('anonymousUser');
    await require('node:timers/promises').setTimeout(50);

    const result = serviceInstance.anonymousUser;

    test.chai.expect(getUserStub).to.have.been.calledWithExactly('_ANONYMOUS');
    test.chai.expect(result).to.equal('anonymousUser');
  });

  it('tests #ensureAnonymousUser - returns this.users.upsertUserWithoutValidation', async () => {
    const linkGroupStub = test.sinon.stub(Groups.prototype, 'linkGroup');
    initializer({ allowAnonymousAccess: true }, mockHappn, false);

    await require('node:timers/promises').setTimeout(50);
    getUserStub.returns(null);
    const result = serviceInstance.anonymousUser;

    test.chai.expect(upsertUserStub).to.have.been.calledWithExactly({
      username: '_ANONYMOUS',
      password: 'anonymous',
    });
    test.chai.expect(result).to.equal('mockUpsertUser');

    linkGroupStub.restore();
  });

  it('test linkAnonymousGroup - throws new error when config.allowAnonymousAccess is falsy', async () => {
    initializer({ allowAnonymousAccess: false }, mockHappn, true);

    await require('node:timers/promises').setTimeout(50);

    const result = serviceInstance.linkAnonymousGroup({});
    await test.chai
      .expect(result)
      .to.eventually.be.rejectedWith('Anonymous access is not configured');
  });

  it('test linkAnonymousGroup - returns groups.linkGroup when config.allowAnonymousAccess is true', async () => {
    initializer({ allowAnonymousAccess: true }, mockHappn, true);

    const linkGroupStub = test.sinon.stub(Groups.prototype, 'linkGroup').returns('mockLinkGroup');

    const result = serviceInstance.linkAnonymousGroup({});

    await require('node:timers/promises').setTimeout(50);

    await test.chai.expect(result).to.eventually.equal('mockLinkGroup');

    linkGroupStub.restore();
  });

  it('test unlinkAnonymousGroup - throws new error when config.allowAnonymousAccess is falsy', async () => {
    await initializer({ allowAnonymousAccess: false }, mockHappn, true);
    await test.chai
      .expect(serviceInstance.unlinkAnonymousGroup({}))
      .to.eventually.be.rejectedWith('Anonymous access is not configured');
  });

  it('test unlinkAnonymousGroup - returns groups.unlinkGroup when config.allowAnonymousAccess is true', async () => {
    const unlinkGroupStub = test.sinon
      .stub(Groups.prototype, 'unlinkGroup')
      .returns('mockUnlinkGroup');

    initializer({ allowAnonymousAccess: true }, mockHappn, true);

    const result = serviceInstance.unlinkAnonymousGroup({});

    await require('node:timers/promises').setTimeout(50);

    await test.chai.expect(result).to.eventually.equal('mockUnlinkGroup');

    unlinkGroupStub.restore();
  });

  it('tests #initializeCheckPoint - promise is rejected', async () => {
    initializer(
      { disableDefaultAdminNetworkConnections: false, sessionTokenSecret: 'mockToken' },
      mockHappn,
      true,
      { checkpointCallsFakeRejected: true }
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(checkpointStub).to.have.been.calledWithExactly(
      {
        accountLockout: { enabled: false },
        disableDefaultAdminNetworkConnections: true,
        updateSubscriptionsOnSecurityDirectoryChanged: true,
        defaultNonceTTL: 60000,
        logSessionActivity: false,
        sessionActivityTTL: 60000,
        pbkdf2Iterations: 10000,
        lockTokenToLoginType: true,
        cookieName: 'happn_token',
        secure: false,
        sessionTokenSecret: 'mockToken',
        authProviders: {},
        allowAnonymousAccess: false,
        activateSessionManagement: false,
        adminUser: null,
        adminGroup: null,
        allowUserChooseAuthProvider: undefined,
        httpsCookie: null,
        cookieDomain: null,
        allowLogoutOverHttp: false,
        allowTTL0Revocations: true,
      },
      test.sinon.match.instanceOf(Object),
      test.sinon.match.func
    );
  });

  it('tests #initializeUsers - promise is rejected', async () => {
    initializer(
      { disableDefaultAdminNetworkConnections: false, sessionTokenSecret: 'mockToken' },
      mockHappn,
      true,
      { usersCallsFakeRejected: true }
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(usersStub).to.have.been.calledWithExactly(
      {
        accountLockout: { enabled: false },
        updateSubscriptionsOnSecurityDirectoryChanged: true,
        disableDefaultAdminNetworkConnections: true,
        defaultNonceTTL: 60000,
        logSessionActivity: false,
        sessionActivityTTL: 60000,
        pbkdf2Iterations: 10000,
        lockTokenToLoginType: true,
        cookieName: 'happn_token',
        secure: false,
        sessionTokenSecret: 'mockToken',
        authProviders: {},
        allowAnonymousAccess: false,
        activateSessionManagement: false,
        adminUser: null,
        adminGroup: null,
        allowUserChooseAuthProvider: undefined,
        httpsCookie: null,
        cookieDomain: null,
        allowLogoutOverHttp: false,
        allowTTL0Revocations: true,
      },
      test.sinon.match.instanceOf(Object),
      test.sinon.match.func
    );
  });

  it('tests #initializeSessionTokenSecret - returns dataService.upsert when it is called. ', async () => {
    initializer(
      { disableDefaultAdminNetworkConnections: false, sessionTokenSecret: 'mockToken' },
      mockHappn,
      true
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(serviceInstance.happn.services.data.upsert)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET', {
        secret: 'mockToken',
      });
  });

  it('tests #initializeSessionTokenSecret - return if this.dataService.get returns data.secret.', async () => {
    initializer(
      { disableDefaultAdminNetworkConnections: false, sessionTokenSecret: null },
      mockHappn,
      true
    );

    serviceInstance.happn.services.data.get.returns({
      data: {
        secret: 'mockSecret',
      },
    });

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(serviceInstance.happn.services.data.get)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/SESSION_TOKEN_SECRET');
  });

  it('tests #initializeGroups - promise is rejected', async () => {
    initializer(
      { disableDefaultAdminNetworkConnections: false, sessionTokenSecret: 'mockToken' },
      mockHappn,
      true,
      { groupCallsFakeRejected: true }
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(groupsStub).to.have.been.calledWithExactly(
      {
        accountLockout: { enabled: false },
        disableDefaultAdminNetworkConnections: true,
        updateSubscriptionsOnSecurityDirectoryChanged: true,
        defaultNonceTTL: 60000,
        logSessionActivity: false,
        sessionActivityTTL: 60000,
        pbkdf2Iterations: 10000,
        lockTokenToLoginType: true,
        cookieName: 'happn_token',
        secure: false,
        sessionTokenSecret: 'mockToken',
        authProviders: {},
        allowAnonymousAccess: false,
        activateSessionManagement: false,
        adminUser: null,
        adminGroup: null,
        allowUserChooseAuthProvider: undefined,
        httpsCookie: null,
        cookieDomain: null,
        allowLogoutOverHttp: false,
        allowTTL0Revocations: true,
      },
      test.sinon.match.instanceOf(Object),
      test.sinon.match.func
    );
  });

  it('tests #initializeSessionManagement - this.loadRevokedTokens is called and promise is resolved', async () => {
    initializer(
      {
        disableDefaultAdminNetworkConnections: false,
        sessionTokenSecret: 'mockToken',
        secure: true,
      },
      mockHappn,
      true
    );

    const result = serviceInstance.happn.services.cache.create
      .onFirstCall()
      .returns({ sync: test.sinon.stub().callsFake((cb) => cb()) });

    const revokedTokensSpy = test.sinon.spy(serviceInstance, 'loadRevokedTokens');

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(result).to.have.been.calledWithExactly('cache_revoked_tokens', {
      type: 'persist',
      cache: {
        dataStore: {
          upsert: test.sinon.match.func,
          get: test.sinon.match.func,
          pathField: 'mockPath',
        },
      },
      overwrite: true,
    });
    test.chai.expect(revokedTokensSpy).to.have.been.calledWithExactly(test.sinon.match.func);
  });

  it('tests #initializeSessionManagement - this.loadRevokedTokens is called and promise is rejected', async () => {
    initializer(
      {
        disableDefaultAdminNetworkConnections: false,
        sessionTokenSecret: 'mockToken',
        secure: true,
      },
      mockHappn,
      true
    );

    const result = serviceInstance.happn.services.cache.create
      .onFirstCall()
      .returns({ sync: test.sinon.stub().callsFake((cb) => cb(new Error('mockError'))) });

    const revokedTokensSpy = test.sinon.spy(serviceInstance, 'loadRevokedTokens');

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(result).to.have.been.calledWithExactly('cache_revoked_tokens', {
      type: 'persist',
      cache: {
        dataStore: {
          upsert: test.sinon.match.func,
          get: test.sinon.match.func,
          pathField: 'mockPath',
        },
      },
      overwrite: true,
    });
    test.chai.expect(revokedTokensSpy).to.have.been.calledWithExactly(test.sinon.match.func);
  });

  it('tests #initializeSessionManagement - calls this.activateSessionManagement and callback called is rejected', async () => {
    initializer(
      {
        disableDefaultAdminNetworkConnections: false,
        sessionTokenSecret: 'mockToken',
        secure: true,
        activateSessionManagement: true,
      },
      mockHappn,
      true
    );

    serviceInstance.happn.services.cache.create
      .onFirstCall()
      .returns({ sync: test.sinon.stub().callsFake((cb) => cb(new Error('mockError'))) });

    const revokedTokensSpy = test.sinon.spy(serviceInstance, 'activateSessionManagement');

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(revokedTokensSpy).to.have.been.calledWithExactly(false, test.sinon.match.func);
  });

  it('tests #initializeSessionManagement - calls this.activateSessionManagement and callback called is resolved', async () => {
    initializer(
      {
        disableDefaultAdminNetworkConnections: false,
        sessionTokenSecret: 'mockToken',
        secure: true,
        activateSessionManagement: true,
      },
      mockHappn,
      true
    );

    serviceInstance.happn.services.cache.create
      .onFirstCall()
      .returns({ sync: test.sinon.stub().callsFake((cb) => cb()) });

    const revokedTokensSpy = test.sinon.spy(serviceInstance, 'activateSessionManagement');

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(revokedTokensSpy).to.have.been.calledWithExactly(false, test.sinon.match.func);
  });

  it('tests #initializeAuthProviders - loops over authProviders and returns if authProvider has key that is happn.', async () => {
    initializer(
      {
        disableDefaultAdminNetworkConnections: false,
        sessionTokenSecret: 'mockToken',
        authProviders: { happn: {} },
      },
      mockHappn,
      true
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(serviceInstance.authProviders).to.eql({ happn: {}, default: {} });
  });

  it('tests #initializeAuthProviders - loops over authProviders and calls BaseAuthProvider.create.', async () => {
    initializer(
      {
        disableDefaultAdminNetworkConnections: false,
        sessionTokenSecret: 'mockToken',
        accountLockout: { enabled: false },
        authProviders: { BaseAuthProvidder: '../../lib/providers/security-base-auth-provider' },
      },
      mockHappn,
      true
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(serviceInstance.authProviders)
      .to.be.eql({ happn: {}, BaseAuthProvidder: {}, default: {} });
  });

  it('tests activateSessionActivity - returns #loadSessionActivity.', async () => {
    const mockCallback = test.sinon.stub();
    initializer(
      {
        secure: true,
        logSessionActivity: true,
        activateSessionManagement: true,
      },
      mockHappn,
      true
    );
    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub().callsFake((cb) => cb()),
    });

    await require('node:timers/promises').setTimeout(50);

    const result = serviceInstance.activateSessionActivity(mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(1);
    test.chai.expect(result).to.be.undefined;
  });

  it('tests activateSessionManagement - returns callback with new Error ', async () => {
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = test.sinon.stub();
    initializer({}, mockHappn, true);

    await require('node:timers/promises').setTimeout(50);

    serviceInstance.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(0);
    test.chai
      .expect(mockLogSessionActivity)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'session management must run off a secure instance'))
      );
  });

  it('tests activateSessionManagement - calls this.loadRevokedTokens and returns callback with error.', async () => {
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = false;
    initializer({ secure: true }, mockHappn, true);

    await require('node:timers/promises').setTimeout(50);

    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub().callsFake((cb) => cb(new Error('mockError'))),
    });

    serviceInstance.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
  });

  it('tests activateSessionManagement - calls this.loadRevokedTokens and returns callback if logSessionActivity is falsy', async () => {
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = false;
    initializer({ secure: true }, mockHappn, true);

    await require('node:timers/promises').setTimeout(50);

    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub().callsFake((cb) => cb()),
    });

    serviceInstance.activateSessionManagement(mockLogSessionActivity, mockCallback);
    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests activateSessionManagement - calls this.loadRevokedTokens and calls this.#loadSessionActivity', async () => {
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = true;
    initializer({ secure: true }, mockHappn, true);
    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub().callsFake((cb) => cb()),
    });

    await require('node:timers/promises').setTimeout(50);

    serviceInstance.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests deactivateSessionManagement - this.config.secure is false and returns callback with new Error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = test.sinon.stub();

    serviceInst.config = { secure: false };
    serviceInst.deactivateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(0);
    test.chai
      .expect(mockLogSessionActivity)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('tests deactivateSessionManagement - logSessionActivity is true returns callback with new Error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = true;

    serviceInst.config = { secure: true };
    test.sinon.spy(serviceInst, 'deactivateSessionActivity');

    serviceInst.deactivateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai
      .expect(serviceInst.deactivateSessionActivity)
      .to.have.been.calledWithExactly(true, test.sinon.match.func);
  });

  it('tests deactivateSessionManagement - logSessionActivity is false and returns callback ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = false;

    serviceInst.config = { secure: true };
    test.sinon.spy(serviceInst, 'deactivateSessionActivity');

    serviceInst.deactivateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests deactivateSessionActivity - sets callback to equal clear and calls callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockClear = test.sinon.stub();

    serviceInst.cache_session_activity = {};
    serviceInst.config = {};

    serviceInst.deactivateSessionActivity(mockClear, mockCallback);

    test.chai.expect(mockClear).to.have.callCount(1);
  });

  it('tests deactivateSessionActivity - return this.cache_session_activity.clear', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockClear = true;

    serviceInst.cache_session_activity = { clear: test.sinon.stub() };
    serviceInst.config = {};

    serviceInst.deactivateSessionActivity(mockClear, mockCallback);

    test.chai
      .expect(serviceInst.cache_session_activity.clear)
      .to.have.been.calledWithExactly(test.sinon.match.func);
  });

  context('token management', () => {
    it('tests revokeToken - checks if token is null and returns callback with new Error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      const mockToken = null;
      const mockReason = test.sinon.stub();
      const mockCallback = test.sinon.stub();

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai
        .expect(mockReason)
        .to.have.been.calledWithExactly(
          test.sinon.match
            .instanceOf(Error)
            .and(test.sinon.match.has('message', 'token not defined'))
        );
    });

    it('tests revokeToken - checks if decoded is null and returns callback with new Error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();

      serviceInst.config = {
        sessionTokenSecret: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpacked = test.sinon.stub(require('jsonpack'), 'unpack').returns(null);

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(decode).to.have.been.calledWithExactly('mockToken', true);
      test.chai.expect(unpacked).to.have.been.calledWithExactly('test decode');
      test.chai
        .expect(mockCallback)
        .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
      test.chai.expect(mockCallback.args[0][0].message).to.equal('invalid token');

      decode.restore();
      unpacked.restore();
    });

    it('tests revokeToken - checks if ttl is 0 , calls set method and calls callback if error exists', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      serviceInst.authProviders = {
        default: 'mockDefault',
      };
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();

      serviceInst.config = {
        sessionTokenSecret: true,
        allowTTL0Revocations: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpack = test.sinon
        .stub(require('jsonpack'), 'unpack')
        .returns({ info: { _browser: 'mock_browser' }, policy: [{ ttl: 0 }, { ttl: 0 }] });
      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);

      serviceInst.cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback('mockError');
      });
      serviceInst.log = {
        warn: test.sinon.stub(),
      };

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai
        .expect(serviceInst.log.warn)
        .to.have.been.calledWithExactly(
          'revoking a token without a ttl means it stays in the revocation list forever'
        );
      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
      test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
        'mockToken',
        {
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 0,
        },
        { ttl: 0 },
        test.sinon.match.func
      );
      stubDateNow.restore();
      decode.restore();
      unpack.restore();
    });

    it('tests revokeToken - calls set method and calls this.dataChanged if error is falsy and decoded.parentId is truthy', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      serviceInst.authProviders = {
        default: 'mockDefault',
      };
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();
      const CONSTANTS = require('../../../lib/index').constants;

      serviceInst.config = {
        sessionTokenSecret: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpack = test.sinon.stub(require('jsonpack'), 'unpack').returns({
        info: { _browser: 'mock_browser' },
        policy: [{ ttl: 0 }, { ttl: 1 }],
        parentId: 1,
        id: 1,
      });

      serviceInst.cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.stub(serviceInst, 'dataChanged').resolves();

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
        'mockToken',
        {
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 1,
        },
        { ttl: 1 },
        test.sinon.match.func
      );
      test.chai.expect(serviceInst.dataChanged).to.have.been.calledWithExactly(
        CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
        {
          customRevocation: false,
          token: 'mockToken',
          session: {
            info: { _browser: 'mock_browser' },
            policy: [{ ttl: 0 }, { ttl: 1 }],
            parentId: 1,
            id: 1,
          },
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 1,
        },
        'token for session with id 1  and origin 1 revoked'
      );

      stubDateNow.restore();
      decode.restore();
      unpack.restore();
    });

    it('tests revokeToken - checks if decoded.type is not equal to null ,calls set method, calls this.dataChanged if error is falsy and checks if decoded.parentId is falsy', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      serviceInst.authProviders = {
        default: 'mockDefault',
      };
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();
      const CONSTANTS = require('../../../lib/index').constants;

      serviceInst.config = {
        lockTokenToLoginType: {},
        sessionTokenSecret: true,
        allowTTL0Revocations: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpack = test.sinon.stub(require('jsonpack'), 'unpack').returns({
        info: {},
        policy: [{ ttl: 0 }, { ttl: 1 }],
        id: 1,
        type: 0,
      });

      serviceInst.cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });
      serviceInst.log = {
        warn: test.sinon.stub(),
      };

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.stub(serviceInst, 'dataChanged').resolves();

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai
        .expect(serviceInst.log.warn)
        .to.have.been.calledWithExactly(
          'revoking a token without a ttl means it stays in the revocation list forever'
        );
      test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
        'mockToken',
        {
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 0,
        },
        { ttl: 0 },
        test.sinon.match.func
      );
      test.chai.expect(serviceInst.dataChanged).to.have.been.calledWithExactly(
        CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
        {
          customRevocation: false,
          token: 'mockToken',
          session: {
            info: {},
            policy: [{ ttl: 0 }, { ttl: 1 }],
            id: 1,
            type: 0,
          },
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 0,
        },
        'token for session with id 1  and origin 1 revoked'
      );
      stubDateNow.restore();
      decode.restore();
      unpack.restore();
    });

    it('tests revokeToken - checks if decoded.policy[0].ttl decoded.policy[1].ttl is truthy. Checks if decoded.policy[0] is greater and equal to decoded.policy[1] ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      serviceInst.authProviders = {
        default: 'mockDefault',
      };
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();
      const CONSTANTS = require('../../../lib/index').constants;

      serviceInst.config = {
        lockTokenToLoginType: {},
        sessionTokenSecret: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpack = test.sinon.stub(require('jsonpack'), 'unpack').returns({
        info: {},
        policy: [{ ttl: 1 }, { ttl: 1 }],
        id: 1,
      });

      serviceInst.cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.stub(serviceInst, 'dataChanged').resolves();

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
        'mockToken',
        {
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 1,
        },
        { ttl: 1 },
        test.sinon.match.func
      );
      test.chai.expect(serviceInst.dataChanged).to.have.been.calledWithExactly(
        CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
        {
          customRevocation: false,
          token: 'mockToken',
          session: {
            info: {},
            policy: [{ ttl: 1 }, { ttl: 1 }],
            id: 1,
          },
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 1,
        },
        'token for session with id 1  and origin 1 revoked'
      );
      stubDateNow.restore();
      decode.restore();
      unpack.restore();
    });

    it('tests revokeToken - checks if decoded.policy[0].ttl and decoded.policy[1].ttl is truthy and not equal to Infinity and sets ttl equal to decoded.policy[1].ttl', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      serviceInst.authProviders = {
        default: 'mockDefault',
      };
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();
      const CONSTANTS = require('../../../lib/index').constants;

      serviceInst.config = {
        lockTokenToLoginType: {},
        sessionTokenSecret: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpack = test.sinon.stub(require('jsonpack'), 'unpack').returns({
        info: {},
        policy: [{ ttl: 1 }, { ttl: 2 }],
        id: 1,
      });

      serviceInst.cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.stub(serviceInst, 'dataChanged').resolves();

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
        'mockToken',
        {
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 2,
        },
        { ttl: 2 },
        test.sinon.match.func
      );
      test.chai.expect(serviceInst.dataChanged).to.have.been.calledWithExactly(
        CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
        {
          customRevocation: false,
          token: 'mockToken',
          session: {
            info: {},
            policy: [{ ttl: 1 }, { ttl: 2 }],
            id: 1,
          },
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 2,
        },
        'token for session with id 1  and origin 1 revoked'
      );
      stubDateNow.restore();
      decode.restore();
      unpack.restore();
    });

    it('tests revokeToken - decoded.policy[0].ttl and decoded.policy[1].ttl equal to Infinity', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      serviceInst.happn = mockHappn;
      serviceInst.authProviders = {
        default: 'mockDefault',
      };
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();
      const CONSTANTS = require('../../../lib/index').constants;

      serviceInst.config = {
        lockTokenToLoginType: {},
        sessionTokenSecret: true,
        allowTTL0Revocations: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpack = test.sinon.stub(require('jsonpack'), 'unpack').returns({
        info: {},
        policy: [{ ttl: Infinity }, { ttl: Infinity }],
        id: 1,
      });

      serviceInst.cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.stub(serviceInst, 'dataChanged').resolves();

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
        'mockToken',
        {
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 0,
        },
        { ttl: 0 },
        test.sinon.match.func
      );
      test.chai.expect(serviceInst.dataChanged).to.have.been.calledWithExactly(
        CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
        {
          customRevocation: false,
          token: 'mockToken',
          session: {
            info: {},
            policy: [{ ttl: Infinity }, { ttl: Infinity }],
            id: 1,
          },
          reason: 'mockReason',
          timestamp: 18000,
          ttl: 0,
        },
        'token for session with id 1  and origin 1 revoked'
      );
      stubDateNow.restore();
      decode.restore();
      unpack.restore();
    });

    it('tests revokeToken - #matchAuthProvider is called and callback is called with an error.', async () => {
      const decodeStub = test.sinon.stub(require('jwt-simple'), 'decode').returns('mockDecoded');
      const unpackStub = test.sinon
        .stub(require('jsonpack'), 'unpack')
        .returns({ token: null, authType: null, username: 'mockUsername' });
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();

      await initializer({ sessionTokenSecret: 'sessionTokenSecret' }, mockHappn, true);

      getUserStub.onSecondCall().callsFake((_, cb) => cb(new Error('mockError'), null));

      serviceInstance.revokeToken(mockToken, mockReason, mockCallback);

      test.chai
        .expect(mockCallback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
        );
      test.chai
        .expect(decodeStub)
        .to.have.been.calledWithExactly('mockToken', 'sessionTokenSecret');
      test.chai.expect(unpackStub).to.have.been.calledWithExactly('mockDecoded');

      decodeStub.restore();
      unpackStub.restore();
    });
  });

  it('tests getCookieName ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    serviceInst.authProviders = {
      default: 'mockDefault',
    };
    const mockHeaders = {};
    const mockConnectionData = {};
    const mockOptions = { cookieName: 'mockCookieName' };

    serviceInst.config = {
      httpsCookie: true,
    };

    const result = serviceInst.getCookieName(mockHeaders, mockConnectionData, mockOptions);

    test.chai.expect(result).to.equal('mockCookieName');
  });

  it('tests getCookieName - checks if headers[x-forwarded-proto] is strictly equals https', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockHeaders = { 'x-forwarded-proto': 'https' };
    const mockConnectionData = {};
    const mockOptions = { cookieName: 'mockCookieName' };

    serviceInst.config = {
      httpsCookie: true,
    };

    const result = serviceInst.getCookieName(mockHeaders, mockConnectionData, mockOptions);

    test.chai.expect(result).to.equal('mockCookieName_https');
  });

  it('tests getCookieName - checks if headers[x-forwarded-proto] is strictly equals wss', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockHeaders = { 'x-forwarded-proto': 'wss' };
    const mockConnectionData = {};
    const mockOptions = { cookieName: 'mockCookieName' };

    serviceInst.config = {
      httpsCookie: true,
    };

    const result = serviceInst.getCookieName(mockHeaders, mockConnectionData, mockOptions);

    test.chai.expect(result).to.equal('mockCookieName_https');
  });

  it('tests getCookieName - checks if connectionData.encrypted is true ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockHeaders = [];
    const mockConnectionData = { encrypted: true };
    const mockOptions = { cookieName: 'mockCookieName' };

    serviceInst.config = {
      httpsCookie: true,
    };

    const result = serviceInst.getCookieName(mockHeaders, mockConnectionData, mockOptions);

    test.chai.expect(result).to.equal('mockCookieName_https');
  });

  it('tests tokenFromRequest - sets options.tokenName to equal happn_token and returns token', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockReq = {
      cookies: { get: test.sinon.stub().returns(true) },
      headers: 'mockHeaders',
      connection: 'mockConnection',
    };
    const mockOptions = null;

    serviceInst.config = {
      cookieName: 'mockCookieName',
    };

    const stubGetCookieName = test.sinon.stub(serviceInst, 'getCookieName');

    const result = serviceInst.tokenFromRequest(mockReq, mockOptions);

    test.chai.expect(result).to.be.true;
    test.chai
      .expect(stubGetCookieName)
      .to.have.been.calledWithExactly('mockHeaders', 'mockConnection', {
        tokenName: 'happn_token',
      });

    stubGetCookieName.restore();
  });

  it('tests tokenFromRequest - calls getcookieName, calls req.cookies.get with cookieName and returns token', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockGet = test.sinon.stub();
    const mockReq = {
      cookies: { get: mockGet },
      headers: 'mockHeaders',
      connection: 'mockConnection',
    };
    const mockOptions = { tokenName: 'mockTokenName', cookieName: 'mockCookieName' };

    mockGet.withArgs('mockCookieName').returns(true);
    serviceInst.config = {
      cookieName: 'mockCookieName',
    };

    const stubGetCookieName = test.sinon.stub(serviceInst, 'getCookieName');

    const result = serviceInst.tokenFromRequest(mockReq, mockOptions);

    test.chai.expect(result).to.be.true;
    test.chai
      .expect(stubGetCookieName)
      .to.have.been.calledWithExactly('mockHeaders', 'mockConnection', {
        tokenName: 'mockTokenName',
        cookieName: 'mockCookieName',
      });

    stubGetCookieName.restore();
  });

  it('tests tokenFromRequest - parses url and returns token', () => {
    const url = require('url');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockReq = {
      url: 'mockUrl',
      cookies: { get: test.sinon.stub() },
      headers: 'mockHeaders',
      connection: 'mockConnection',
    };
    const mockOptions = { tokenName: 'tokenName', cookieName: 'mockCookieName' };

    serviceInst.config = {
      cookieName: 'mockCookieName',
    };

    const stubParse = test.sinon.stub(url, 'parse').returns({
      query: { tokenName: 'mockTokeName' },
    });

    const result = serviceInst.tokenFromRequest(mockReq, mockOptions);

    test.chai.expect(result).to.equal('mockTokeName');
    test.chai.expect(stubParse).to.have.been.calledWithExactly('mockUrl', true);

    stubParse.restore();
  });

  it('tests tokenFromRequest - checks i req.headers.authorization is not equal to null and returns token', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockReq = {
      url: 'mockUrl',
      cookies: { get: test.sinon.stub() },
      headers: { authorization: 'mockAuthorization' },
      connection: 'mockConnection',
    };
    const mockOptions = { tokenName: 'tokenName' };

    serviceInst.config = {
      cookieName: 'mockCookieName',
    };

    const result = serviceInst.tokenFromRequest(mockReq, mockOptions);

    test.chai.expect(result).to.be.undefined;
    test.chai.expect(mockReq.cookies.get).to.have.been.calledWithExactly('mockCookieName');
  });

  it('tests tokenFromRequest - checks if authHeader[0] equals bearer and returns token', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockReq = {
      url: 'mockUrl',
      cookies: { get: test.sinon.stub() },
      headers: { authorization: 'bearer mockAuthorization' },
      connection: 'mockConnection',
    };
    const mockOptions = { tokenName: 'tokenName' };

    serviceInst.config = {
      cookieName: 'mockCookieName',
    };

    const result = serviceInst.tokenFromRequest(mockReq, mockOptions);

    test.chai.expect(result).to.equal('mockAuthorization');
    test.chai.expect(mockReq.cookies.get).to.have.been.calledWithExactly('mockCookieName');
  });

  it('tests sessionFromRequest returns null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockReq = {
      url: 'mockUrl',
      cookies: { get: test.sinon.stub() },
      headers: {},
      connection: 'mockConnection',
    };
    const mockOptions = { tokenName: 'tokenName' };

    serviceInst.config = {
      cookieName: 'mockCookieName',
    };
    const result = serviceInst.sessionFromRequest(mockReq, mockOptions);

    test.chai.expect(result).to.be.null;
  });

  it('tests sessionFromRequest returns null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockReq = {
      url: 'mockUrl',
      cookies: { get: test.sinon.stub() },
      headers: { authorization: 'bearer mockAuthorization' },
      connection: 'mockConnection',
    };
    const mockOptions = { tokenName: 'tokenName' };
    const stubDecodeToken = test.sinon.stub(serviceInst, 'decodeToken').returns(null);

    serviceInst.config = {
      cookieName: 'mockCookieName',
    };
    serviceInst.log = {
      warn: test.sinon.stub(),
    };

    const result = serviceInst.sessionFromRequest(mockReq, mockOptions);

    test.chai.expect(result).to.be.null;
    test.chai
      .expect(serviceInst.log.warn)
      .to.have.been.calledWithExactly('failed decoding session token from request');

    stubDecodeToken.restore();
  });

  it('tests restoreToken -  callback called with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockToken = 'mockToken';
    const mockCallback = test.sinon.stub();

    serviceInst.cache_revoked_tokens = {
      remove: test.sinon.stub(),
    };
    serviceInst.cache_revoked_tokens.remove.callsFake((_, callback) => {
      callback('mockError');
    });

    serviceInst.restoreToken(mockToken, mockCallback);
    test.chai
      .expect(serviceInst.cache_revoked_tokens.remove)
      .to.have.been.calledWithExactly('mockToken', test.sinon.match.func);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
  });

  it('tests restoreToken - callback called with error equal to null ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockToken = 'mockToken';
    const mockCallback = test.sinon.stub();

    serviceInst.cache_revoked_tokens = {
      remove: test.sinon.stub(),
    };
    serviceInst.cache_revoked_tokens.remove.callsFake((_, callback) => {
      callback(null);
    });
    test.sinon.stub(serviceInst, 'dataChanged').resolves();

    serviceInst.restoreToken(mockToken, mockCallback);

    test.chai
      .expect(serviceInst.cache_revoked_tokens.remove)
      .to.have.been.calledWithExactly('mockToken', test.sinon.match.func);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null);
  });

  it('tests listSessionActivity - pushed new error onto callbackArgs and calls callbackArgs', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockCallback = test.sinon.stub();
    const mockFilter = 'mockFilter';

    serviceInst.config = {
      logSessionActivity: false,
    };

    serviceInst.listSessionActivity(mockFilter, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'session activity logging not activated'))
      );
  });

  it('tests listSessionActivity - throws new error and calls callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockCallback = test.sinon.stub();
    const mockFilter = test.sinon.stub();

    serviceInst.config = {
      logSessionActivity: true,
    };

    serviceInst.listSessionActivity(mockFilter, mockCallback);

    test.chai
      .expect(mockFilter)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has('message', `cache with namecache_session_activity does not exist`)
          )
      );
  });

  it('tests __listCache - returns  this[cacheName].all(filter)', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockCallback = test.sinon.stub();
    const mockFilter = 'mockFilter';

    serviceInst.cache_session_activity = {
      all: test.sinon.stub().returns('test'),
    };
    serviceInst.config = {
      logSessionActivity: {},
    };

    serviceInst.listSessionActivity(mockFilter, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'test');
    test.chai
      .expect(serviceInst.cache_session_activity.all)
      .to.have.been.calledWithExactly('mockFilter');
  });

  it('tests listActiveSessions - checks if filter is type of function and if this.#sessionManagementActive equals true, it pushes new error into callbackArgs.', async () => {
    const mockFilter = test.sinon.stub();
    const mockCallback = test.sinon.stub();

    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: false },
      mockHappn,
      true
    );

    await require('timers/promises').setTimeout(50);

    serviceInstance.listActiveSessions(mockFilter, mockCallback);

    test.chai
      .expect(mockFilter)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'session management not activated'))
      );
  });

  it('tests listActiveSessions - checks if this.#sessionManagementActive equals true and finally calls callback with spreaded callbackArgs.', async () => {
    const mockFilter = {};
    const mockCallback = test.sinon.stub();

    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: true },
      mockHappn,
      true
    );

    const stubAll = serviceInstance.happn.services.session.activeSessions.all.returns('mockAll');

    await require('timers/promises').setTimeout(50);

    serviceInstance.listActiveSessions(mockFilter, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mockAll');
    test.chai.expect(stubAll).to.have.been.calledWithExactly({});
  });

  it('tests listActiveSessions - checks if this.#sessionManagementActive equals true and activeSessions.all throws error.', async () => {
    const mockFilter = {};
    const mockCallback = test.sinon.stub();

    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: true },
      mockHappn,
      true
    );
    serviceInstance.happn.services.session.activeSessions.all.throws(new Error('mockError'));

    await require('timers/promises').setTimeout(50);

    serviceInstance.listActiveSessions(mockFilter, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
  });

  it('tests listRevokedTokens - checks if filter is a function and if #sessionManagementActive equals false.', async () => {
    const mockFilter = test.sinon.stub();
    const mockCallback = test.sinon.stub();

    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: false },
      mockHappn,
      true
    );

    await require('timers/promises').setTimeout(50);

    serviceInstance.listRevokedTokens(mockFilter, mockCallback);

    test.chai
      .expect(mockFilter)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'session management not activated'))
      );
  });

  it('tests listRevokedTokens - checks if #sessionManagementActive equals true and calls callback.', async () => {
    const mockFilter = {};
    const mockCallback = test.sinon.stub();
    const stubAll = test.sinon.stub().returns('mockRevokedList');

    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: true },
      mockHappn,
      true
    );

    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      all: stubAll,
    });

    await require('timers/promises').setTimeout(50);

    serviceInstance.listRevokedTokens(mockFilter, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mockRevokedList');
    test.chai.expect(stubAll).to.have.been.calledWithExactly({});
  });

  it('tests listRevokedTokens - checks if #sessionManagementActive is true and cache_revoked_tokens.all throws error.', async () => {
    const mockFilter = {};
    const mockCallback = test.sinon.stub();
    const stubAll = test.sinon.stub().throws(new Error('mockError'));

    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: true },
      mockHappn,
      true
    );

    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      all: stubAll,
    });

    await require('timers/promises').setTimeout(50);

    serviceInstance.listRevokedTokens(mockFilter, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
  });

  it('tests offDataChanged - deletes index from #dataHooks', async () => {
    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: true },
      mockHappn,
      true
    );

    await require('timers/promises').setTimeout(50);

    serviceInstance.offDataChanged('mockData');
  });

  it('tests onDataChanged - returns length of #dataHooks - 1', async () => {
    initializer(
      { allowAnonymousAccess: true, secure: true, activateSessionManagement: true },
      mockHappn,
      true
    );

    await require('timers/promises').setTimeout(50);

    const result = serviceInstance.onDataChanged({});

    test.chai.expect(result).to.equal(0);
  });

  it(' tests resetSessionPermissions - checks if this.sessionService.disconnectSessions was called and if this.errorService.handleSystem was called , promise resolved', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED;
    const mockChangedData = {
      session: {
        id: 1,
        isToken: 'mockToken',
        previousPermissionSetKey: 0,
        permissionSetKey: 1,
        user: null,
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        parentId: 1,
      },
      token: 'token',
    };

    serviceInst.errorService = {
      handleSystem: test.sinon.stub(),
    };
    serviceInst.sessionService = { disconnectSessionsWithToken: test.sinon.stub() };
    serviceInst.sessionService.disconnectSessionsWithToken.callsFake((_, __, callback) => {
      callback('mockError');
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    test.chai
      .expect(serviceInst.sessionService.disconnectSessionsWithToken)
      .to.have.been.calledWithExactly(
        'token',
        {
          reason: CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
        },
        test.sinon.match.func
      );
    test.chai
      .expect(serviceInst.errorService.handleSystem)
      .to.have.been.calledWithExactly('mockError', 'SecurityService');
    await test.chai.expect(result).to.eventually.eql([
      {
        id: 1,
        username: 'unknown',
        isToken: 'mockToken',
        previousPermissionSetKey: 0,
        permissionSetKey: 1,
        user: null,
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        causeSubscriptionsRefresh: true,
      },
    ]);
  });

  it(' tests resetSessionPermissions - calls sessionService.disconnectSessions, calls callback with no error and resolves promise', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED;
    const mockChangedData = {
      session: {
        id: 1,
        isToken: 'mockToken',
        previousPermissionSetKey: 0,
        permissionSetKey: 1,
        user: { username: 'mockUsername' },
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        parentId: 1,
      },
      token: 'token',
    };

    serviceInst.sessionService = { disconnectSessionsWithToken: test.sinon.stub() };
    serviceInst.sessionService.disconnectSessionsWithToken.callsFake((_, __, callback) => {
      callback(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    test.chai
      .expect(serviceInst.sessionService.disconnectSessionsWithToken)
      .to.have.been.calledWithExactly(
        'token',
        {
          reason: CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED,
        },
        test.sinon.match.func
      );
    await test.chai.expect(result).to.eventually.eql([
      {
        id: 1,
        username: 'mockUsername',
        isToken: 'mockToken',
        previousPermissionSetKey: 0,
        permissionSetKey: 1,
        user: { username: 'mockUsername' },
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        causeSubscriptionsRefresh: true,
      },
    ]);
  });

  it('tests resetSessionPermissions - returns this.cache_revoked_tokens.set, promise resolved', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED;
    const mockChangedData = {
      replicated: true,
      token: 'mockToken',
      id: 1,
      session: {
        id: 1,
        isToken: 'mockToken',
        previousPermissionSetKey: 0,
        permissionSetKey: 1,
        user: { username: 'mockUsername' },
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        parentId: 1,
      },
      reason: 'mockReason',
      ttl: true,
    };

    serviceInst.sessionService = { disconnectSessionsWithToken: test.sinon.stub() };
    serviceInst.sessionService.disconnectSessionsWithToken.callsFake((_, __, callback) => {
      callback(null);
    });

    serviceInst.cache_revoked_tokens = {
      set: test.sinon.stub(),
    };
    serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
      callback();
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([
      {
        id: 1,
        username: 'mockUsername',
        isToken: 'mockToken',
        previousPermissionSetKey: 0,
        permissionSetKey: 1,
        user: { username: 'mockUsername' },
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        causeSubscriptionsRefresh: true,
      },
    ]);
    test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
      'mockToken',
      {
        reason: 'mockReason',
        id: 1,
      },
      {
        noPersist: true,
        ttl: true,
      },
      test.sinon.match.func
    );
  });

  it('tests resetSessionPermissions - returns this.cache_revoked_tokens.set, promise rejected', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_REVOKED;
    const mockChangedData = {
      replicated: true,
      token: 'mockToken',
      id: 1,
      session: {
        id: 1,
        isToken: 'mockToken',
        previousPermissionSetKey: 0,
        permissionSetKey: 1,
        user: { username: 'mockUsername' },
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        parentId: 1,
      },
      reason: 'mockReason',
      ttl: true,
    };

    serviceInst.sessionService = { disconnectSessionsWithToken: test.sinon.stub() };
    serviceInst.sessionService.disconnectSessionsWithToken.callsFake((_, __, callback) => {
      callback(null);
    });

    serviceInst.cache_revoked_tokens = {
      set: test.sinon.stub(),
    };
    serviceInst.cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
      callback('mockError');
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.have.been.rejectedWith('mockError');
    test.chai.expect(serviceInst.cache_revoked_tokens.set).to.have.been.calledWithExactly(
      'mockToken',
      {
        reason: 'mockReason',
        id: 1,
      },
      {
        noPersist: true,
        ttl: true,
      },
      test.sinon.match.func
    );
  });

  it('tests resetSessionPermissions - returns this.cache_revoked_tokens.remove, promise resolved', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_RESTORED;
    const mockChangedData = {
      replicated: true,
      token: 'mockToken',
    };

    serviceInst.cache_revoked_tokens = {
      remove: test.sinon.stub(),
    };
    serviceInst.cache_revoked_tokens.remove.callsFake((_, __, callback) => {
      callback(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai.expect(serviceInst.cache_revoked_tokens.remove).to.have.been.calledWithExactly(
      'mockToken',
      {
        noPersist: true,
      },
      test.sinon.match.func
    );
  });

  it('tests resetSessionPermissions - returns this.cache_revoked_tokens.remove, promise rejceted', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_RESTORED;
    const mockChangedData = {
      replicated: true,
      token: 'mockToken',
    };

    serviceInst.cache_revoked_tokens = {
      remove: test.sinon.stub(),
    };
    serviceInst.cache_revoked_tokens.remove.callsFake((_, __, callback) => {
      callback('mockError');
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.have.been.rejectedWith('mockError');
    test.chai.expect(serviceInst.cache_revoked_tokens.remove).to.have.been.calledWithExactly(
      'mockToken',
      {
        noPersist: true,
      },
      test.sinon.match.func
    );
  });

  it('tests resetSessionPermissions - calls this.sessionService.each and returns sessionCallback , promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = null;
    const mockChangedData = {
      replicated: true,
      token: 'mockToken',
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          user: null,
          permissionSetKey: 1,
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - calls this.sessionService.each and checks if changedData.username is equal to sessionData.user.username , promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.PERMISSION_REMOVED;
    const mockChangedData = {
      username: 'mockUsername',
      replicated: true,
      token: 'mockToken',
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: { username: 'mockUsername', groups: { mockGroup: null } },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([
      {
        id: 1,
        username: 'mockUsername',
        isToken: false,
        previousPermissionSetKey: 1,
        permissionSetKey: 1,
        user: { username: 'mockUsername', groups: { mockGroup: null } },
        happn: 'mockHappn',
        protocol: 'mockProtocol',
        causeSubscriptionsRefresh: true,
      },
    ]);

    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - calls this.sessionService.each and checks if changedData.username is not equal to sessionData.user.username , promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.PERMISSION_REMOVED;
    const mockChangedData = {
      username: null,
      replicated: true,
      token: 'mockToken',
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: { username: 'mockUsername', groups: { mockGroup: null } },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);

    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - checks if  whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_TABLE_CHANGED , promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_TABLE_CHANGED;
    const mockChangedData = {
      username: null,
      replicated: true,
      token: 'mockToken',
      groups: { includes: test.sinon.stub().returns(true) },
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([
      {
        causeSubscriptionsRefresh: true,
        happn: 'mockHappn',
        id: 1,
        isToken: false,
        permissionSetKey: 1,
        previousPermissionSetKey: 1,
        protocol: 'mockProtocol',
        user: {
          groups: {
            mockGroup: 'mockGroup',
          },
          username: 'mockUsername',
        },
        username: 'mockUsername',
      },
    ]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - changedData.group is not included in sessionData.user.groups, promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_TABLE_CHANGED;
    const mockChangedData = {
      username: null,
      replicated: true,
      token: 'mockToken',
      groups: { includes: test.sinon.stub().returns(false) },
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - checks if changedData.group is included in Object.keys(sessionData.user.groups).  promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_PERMISSION_CHANGED;
    const mockChangedData = {
      username: null,
      replicated: true,
      token: 'mockToken',
      group: 'mockGroup',
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([
      {
        causeSubscriptionsRefresh: true,
        happn: 'mockHappn',
        id: 1,
        isToken: false,
        permissionSetKey: 1,
        previousPermissionSetKey: 1,
        protocol: 'mockProtocol',
        user: {
          groups: {
            mockGroup: 'mockGroup',
          },
          username: 'mockUsername',
        },
        username: 'mockUsername',
      },
    ]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_PERMISSION_CHANGED, promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_PERMISSION_CHANGED;
    const mockChangedData = {
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_GROUP , Promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_GROUP;
    const mockChangedData = {
      name: 'name',
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: { mock: 'mock' },
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup', name: 'mockName' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([
      {
        causeSubscriptionsRefresh: true,
        happn: 'mockHappn',
        id: 1,
        isToken: false,
        permissionSetKey: 1,
        previousPermissionSetKey: 1,
        protocol: 'mockProtocol',
        user: {
          groups: {
            mockGroup: 'mockGroup',
            name: 'mockName',
          },
          username: 'mockUsername',
        },
        username: 'mockUsername',
      },
    ]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - checks if whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_PERMISSION_CHANGED. Promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_GROUP;
    const mockChangedData = {
      name: 'name',
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup', name: 'mockName' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([
      {
        causeSubscriptionsRefresh: false,
        happn: 'mockHappn',
        id: 1,
        isToken: false,
        permissionSetKey: 1,
        previousPermissionSetKey: 1,
        protocol: 'mockProtocol',
        user: {
          groups: {
            mockGroup: 'mockGroup',
            name: 'mockName',
          },
          username: 'mockUsername',
        },
        username: 'mockUsername',
      },
    ]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.LOOKUP_PERMISSION_CHANGED. changeData.permissions array is greater then 0, promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_GROUP;
    const mockChangedData = {
      name: 'name',
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: { mock: 'mock' },
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup', name: 'mockName' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([
      {
        causeSubscriptionsRefresh: true,
        happn: 'mockHappn',
        id: 1,
        isToken: false,
        permissionSetKey: 1,
        previousPermissionSetKey: 1,
        protocol: 'mockProtocol',
        user: {
          groups: {
            mockGroup: 'mockGroup',
            name: 'mockName',
          },
          username: 'mockUsername',
        },
        username: 'mockUsername',
      },
    ]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - checks if whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.UNLINK_GROUP , promise resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UNLINK_GROUP;
    const mockChangedData = {
      name: 'name',
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
      path: 'mockPath',
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup', name: 'mockName' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions -  checks if whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.DELETE_USER .Promise is resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.DELETE_USER;
    const mockChangedData = {
      name: 'name',
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
      obj: { _meta: { path: '/_SYSTEM/_SECURITY/_USER/' } },
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
      disconnectSession: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup', name: 'mockName' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - checks if whatHappnd is strictly equal to CONSTANTS.SECURITY_DIRECTORY_EVENTS.DELETE_GROUP . Promise is resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.DELETE_GROUP;
    const mockChangedData = {
      name: 'name',
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
      obj: { name: 'name' },
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
      disconnectSession: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - calls this.sessionService.each , sessionData.user.username is not equal to changedData.username. Promise is resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_USER;
    const mockChangedData = {
      name: 'name',
      username: null,
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
      disconnectSession: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - calls this.sessionService.each .Callback returns sessionCallback with error . Promise is resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_USER;
    const mockChangedData = {
      name: 'name',
      username: 'mockUsername',
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
      disconnectSession: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });
    serviceInst.users = {
      getUser: test.sinon.stub(),
    };
    serviceInst.users.getUser.callsFake((_, callback) => {
      callback('mockError', null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - calls this.sessionService.each .Callback returns sessionCallback . Promise is resolved', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_USER;
    const mockChangedData = {
      name: 'name',
      username: 'mockUsername',
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
      disconnectSession: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2(null);
    });
    serviceInst.users = {
      getUser: test.sinon.stub(),
    };
    serviceInst.users.getUser.callsFake((_, callback) => {
      callback(null, null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.eql([]);
    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests resetSessionPermissions - calls this.sessionService.each Promise is rejected', async () => {
    const mockSessionCallback = test.sinon.stub();
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.UPSERT_USER;
    const mockChangedData = {
      name: 'name',
      username: 'mockUsername',
      replicated: true,
      token: 'mockToken',
      group: null,
      permissions: {},
    };

    serviceInst.sessionService = {
      each: test.sinon.stub(),
    };
    serviceInst.sessionService.each.callsFake((callback1, callback2) => {
      callback1(
        {
          id: 1,
          groupName: 'mockGroup',
          user: {
            username: 'mockUsername',
            groups: { mockGroup: 'mockGroup' },
          },
          permissionSetKey: 1,
          happn: 'mockHappn',
          protocol: 'mockProtocol',
        },
        mockSessionCallback
      );

      callback2('mockError');
    });
    serviceInst.users = {
      getUser: test.sinon.stub(),
    };
    serviceInst.users.getUser.callsFake((_, callback) => {
      callback(null, null);
    });

    const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

    await test.chai.expect(result).to.eventually.rejectedWith('mockError');
    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai
      .expect(serviceInst.sessionService.each)
      .to.have.been.calledWithExactly(test.sinon.match.func, test.sinon.match.func);
  });

  it('tests emitChanges - calls #dataHooks.every and returns hook.apply. Promised is resolved ', async () => {
    initializer({ allowAnonymousAccess: true, secure: true }, mockHappn, true);

    await require('timers/promises').setTimeout(50);

    const spyEmit = test.sinon.spy(serviceInstance, 'emit');

    serviceInstance.onDataChanged(test.sinon.stub());
    const result = serviceInstance.emitChanges({}, {}, {}, {});

    await test.chai.expect(result).to.eventually.equal(undefined);
    test.chai.expect(spyEmit).to.have.been.calledWithExactly('security-data-changed', {
      whatHappnd: {},
      changedData: {},
      effectedSessions: {},
      additionalInfo: {},
    });
  });

  it('tests emitChanges - calls #dataHooks.every and throws error. Promised is rejected with e ', async () => {
    initializer({ allowAnonymousAccess: true, secure: true }, mockHappn, true);

    await require('timers/promises').setTimeout(50);

    serviceInstance.onDataChanged({});
    const result = serviceInstance.emitChanges({}, {}, null);

    await test.chai
      .expect(result)
      .to.have.eventually.been.rejectedWith('hook.apply is not a function');
  });

  it('tests __dataChangedInternal - returns callback ', () => {
    const async = require('happn-commons').async;
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {};
    const mockCallback = test.sinon.stub();
    const stubQue = test.sinon.stub(async, 'queue');
    stubQue.callsFake((callback) => {
      const task = {
        whatHappnd: null,
        changedData: null,
        additionalInfo: null,
      };
      callback(task, null);
    });
    const stubResetSessionPermissions = test.sinon
      .stub(serviceInst, 'resetSessionPermissions')
      .resolves('mock test');

    serviceInst.checkpoint = {
      clearCaches: test.sinon.stub(),
    };
    serviceInst.users = {
      clearCaches: test.sinon.stub(),
    };
    serviceInst.groups = {
      clearCaches: test.sinon.stub(),
    };
    serviceInst.happn = {
      services: {
        cache: 'mockCache',
        data: 'mockData',
        session: null,
      },
      config: {
        disableDefaultAdminNetworkConnections: false,
      },
    };

    serviceInst.initialize(mockConfig, mockCallback);

    test.chai.expect(stubQue).to.have.been.calledWithExactly(test.sinon.match.func, 1);

    stubResetSessionPermissions.restore();
    stubQue.restore();
  });

  it('tests __dataChangedInternal - calls this.resetSessionPermissions and resolves promises ', async () => {
    const async = require('happn-commons').async;
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {};
    const callback = test.sinon.stub();
    const stubQue = test.sinon.stub(async, 'queue');
    const mockCallback = null;

    stubQue.callsFake((callback) => {
      const task = {
        whatHappnd: 'link-group',
        changedData: null,
        additionalInfo: null,
      };
      callback(task, mockCallback);
    });
    const stubResetSessionPermissions = test.sinon
      .stub(serviceInst, 'resetSessionPermissions')
      .resolves('mock test');

    serviceInst.checkpoint = {
      clearCaches: test.sinon.stub(),
    };
    serviceInst.users = {
      clearCaches: test.sinon.stub(),
    };
    serviceInst.groups = {
      clearCaches: test.sinon.stub(),
    };
    serviceInst.happn = {
      services: {
        cache: 'mockCache',
        data: 'mockData',
        session: null,
      },
      config: {
        disableDefaultAdminNetworkConnections: false,
      },
    };

    serviceInst.initialize(mockConfig, callback);

    test.chai.expect(mockCallback).to.be.null;
    test.chai
      .expect(stubResetSessionPermissions)
      .to.have.been.calledWithExactly('link-group', null, null);

    stubResetSessionPermissions.restore();
    stubQue.restore();
  });

  it('tests decodeToken - token is null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    serviceInst.log = {
      warn: test.sinon.stub(),
    };
    const result = serviceInst.decodeToken(null);

    test.chai
      .expect(serviceInst.log.warn)
      .to.have.been.calledWithExactly('invalid session token: missing session token');
    test.chai.expect(result).to.be.null;
  });

  it('tests checkTokenUserId - callback function called with error and it returns callback with error ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockToken = { username: 'mockUsername', userId: 1 };
    const mockCallback = test.sinon.stub();

    serviceInst.config = {
      lockTokenToUserId: true,
    };
    serviceInst.users = {
      getUser: test.sinon.stub(),
    };
    serviceInst.users.getUser.callsFake((_, callback) => {
      callback('mockError', null);
    });

    serviceInst.checkTokenUserId(mockToken, mockCallback);

    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
  });

  it('tests checkTokenUserId - callback function called, user is null and returns callback called with null and true ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockToken = { username: 'mockUsername', userId: 1 };
    const mockCallback = test.sinon.stub();

    serviceInst.config = {
      lockTokenToUserId: true,
    };
    serviceInst.users = {
      getUser: test.sinon.stub(),
    };
    serviceInst.users.getUser.callsFake((_, callback) => {
      callback(null, null);
    });

    serviceInst.checkTokenUserId(mockToken, mockCallback);

    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, true);
  });

  it('tests checkTokenUserId - callback function called, user.userId is null and returns callback called with null and true ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockToken = { username: 'mockUsername', userid: 1 };
    const mockCallback = test.sinon.stub();

    serviceInst.config = {
      lockTokenToUserId: true,
    };
    serviceInst.users = {
      getUser: test.sinon.stub(),
    };
    serviceInst.users.getUser.callsFake((_, callback) => {
      callback(null, {
        userid: null,
      });
    });

    serviceInst.checkTokenUserId(mockToken, mockCallback);

    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, true);
  });

  it('tests checkTokenUserId - callback function called and calls callback with null and user.userid is equal to token.userid', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockToken = { username: 'mockUsername', userid: 1 };
    const mockCallback = test.sinon.stub();

    serviceInst.config = {
      lockTokenToUserId: true,
    };
    serviceInst.users = {
      getUser: test.sinon.stub(),
    };
    serviceInst.users.getUser.callsFake((_, callback) => {
      callback(null, {
        userid: 1,
      });
    });

    serviceInst.checkTokenUserId(mockToken, mockCallback);

    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, true);
  });

  it('tests __profileSession - throws error ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockUser = 'mockUser';
    const sessionId = 1;
    const credentials = { info: {} };
    const tokenLogin = {
      session: {
        id: 1,
      },
    };
    const additionalInfo = {};

    serviceInst.config = {
      httpsCookie: true,
    };
    serviceInst.happn = {
      services: {
        system: {
          name: 'mockName',
        },
        utils: {
          clone: test.sinon.stub().returns({
            type: 'mockType',
          }),
        },
      },
    };

    serviceInst.cache_profiles = [
      {
        session: 1,
        policy: 'mockPolicy',
      },
    ];

    const result = () => {
      serviceInst.generateSession(mockUser, sessionId, credentials, tokenLogin, additionalInfo);
    };

    test.chai.expect(result).to.throw('unable to match session with a profile');
  });

  it('tests login method - return authProvider.instance.login when promise is resolved and callback is called.', async () => {
    const callback = test.sinon.stub();
    const mockCredentials = { token: null, authType: 'BaseAuthProvidder', username: null };
    const mockSessionId = 1;
    const mockRequest = {};
    const BaseAuthProvider = require('../../../lib/providers/security-base-auth-provider');
    const loginStub = test.sinon
      .stub(BaseAuthProvider.prototype, 'login')
      .resolves({ session: 'mockSession' });
    await initializer(
      {
        accountLockout: { enabled: false },
        authProviders: { BaseAuthProvidder: '../../lib/providers/security-base-auth-provider' },
      },
      mockHappn,
      true
    );

    await require('node:timers/promises').setTimeout(50);
    const result = serviceInstance.login(mockCredentials, mockSessionId, mockRequest, callback);
    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(result).to.be.undefined;
    test.chai.expect(callback).to.have.been.calledWithExactly(null, { session: 'mockSession' });
    test.chai.expect(callback).to.have.callCount(1);

    loginStub.restore();
  });

  it('tests login method - return authProvider.instance.login when promise is rejected and callback is called with an error.', async () => {
    const callback = test.sinon.stub();
    const mockCredentials = { token: null, authType: 'BaseAuthProvidder', username: null };
    const mockSessionId = 1;
    const mockRequest = {};
    const BaseAuthProvider = require('../../../lib/providers/security-base-auth-provider');
    const loginStub = test.sinon.stub(BaseAuthProvider.prototype, 'login').rejects('mockError');

    await initializer(
      {
        accountLockout: { enabled: false },
        authProviders: { BaseAuthProvidder: '../../lib/providers/security-base-auth-provider' },
      },
      mockHappn,
      true
    );

    await require('node:timers/promises').setTimeout(50);
    const result = serviceInstance.login(mockCredentials, mockSessionId, mockRequest, callback);
    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(result).to.be.undefined;
    test.chai.expect(callback).to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
    test.chai.expect(callback).to.have.callCount(1);

    loginStub.restore();
  });

  it('tests adminLogin - calls this.users.getUser and returns callback with error.', async () => {
    const mockSessionId = 1;
    const callback = test.sinon.stub();

    await initializer({}, mockHappn, true);

    getUserStub.onSecondCall().callsFake((_, callback) => {
      callback(new Error('mockError'));
    });

    serviceInstance.adminLogin(mockSessionId, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai.expect(getUserStub).to.have.been.calledWithExactly('_ADMIN', test.sinon.match.func);
  });

  it('tests adminLogin - calls this.users.getUser and then calls callback when this.#locks is falsy. ', async () => {
    const mockSessionId = 1;
    const callback = test.sinon.stub();
    const mockAdminUser = {
      password: 'mockPassword',
      username: 'mockUsername',
      permissions: {},
      groups: {},
    };
    await initializer({}, mockHappn, true);

    serviceInstance.happn.services.utils.clone.returns({});

    getUserStub.onSecondCall().callsFake((_, callback) => {
      callback(null, mockAdminUser);
    });

    serviceInstance.adminLogin(mockSessionId, callback);

    test.chai.expect(callback).to.have.been.calledWithExactly(null, test.sinon.match.object);
    test.chai
      .expect(mockAdminUser)
      .to.eql({ username: 'mockUsername', permissions: {}, groups: {} });
  });

  it('tests checkIPAddressWhitelistPolicy - checks if mongoFilter array length is zero', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCredentials = {};
    const mockSessionId = 1;
    const mockRequest = {};
    let mockCallback;
    serviceInst.cache_profiles = {
      every: test.sinon.stub().callsFake((callback) => {
        const profile = {
          policy: {
            sourceIPWhitelist: [{}],
          },
          session: 'mockSession',
        };
        mockCallback = callback(profile);
      }),
    };

    const stubMangoFilter = test.sinon.stub(commons, 'mongoFilter').returns([]);

    serviceInst.checkIPAddressWhitelistPolicy(mockCredentials, mockSessionId, mockRequest);

    test.chai.expect(mockCallback).to.be.true;
    test.chai.expect(stubMangoFilter).to.have.been.calledWithExactly('mockSession', {
      user: {},
    });
    stubMangoFilter.restore();
  });

  it('tests checkIPAddressWhitelistPolicy - calls get sessionService.getSession and returns false', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCredentials = {};
    const mockSessionId = 1;
    const mockRequest = {};
    let mockCallback;

    serviceInst.cache_profiles = {
      every: test.sinon.stub().callsFake((callback) => {
        const profile = {
          policy: {
            sourceIPWhitelist: [{}],
          },
          session: 'mockSession',
        };
        mockCallback = callback(profile);
      }),
    };

    serviceInst.sessionService = { getSession: test.sinon.stub().returns(null) };

    const stubMangoFilter = test.sinon.stub(commons, 'mongoFilter').returns([{}]);

    serviceInst.checkIPAddressWhitelistPolicy(mockCredentials, mockSessionId, mockRequest);

    test.chai.expect(mockCallback).to.be.false;
    test.chai.expect(serviceInst.sessionService.getSession).to.have.been.calledWithExactly(1);

    stubMangoFilter.restore();
  });

  it('tests checkIPAddressWhitelistPolicy - calls get sessionService.getSession and returns true', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCredentials = {};
    const mockSessionId = 1;
    const mockRequest = {
      address: {
        ip: 1,
      },
    };
    let mockCallback;

    serviceInst.cache_profiles = {
      every: test.sinon.stub().callsFake((callback) => {
        const profile = {
          policy: {
            sourceIPWhitelist: [1],
          },
          session: 'mockSession',
        };
        mockCallback = callback(profile);
      }),
    };

    serviceInst.sessionService = {
      getSession: test.sinon.stub().returns({ address: { ip: 1 } }),
    };

    const stubMangoFilter = test.sinon.stub(commons, 'mongoFilter').returns([{}]);

    serviceInst.checkIPAddressWhitelistPolicy(mockCredentials, mockSessionId, mockRequest);

    test.chai.expect(mockCallback).to.be.true;
    test.chai.expect(serviceInst.sessionService.getSession).to.have.been.calledWithExactly(1);

    stubMangoFilter.restore();
  });

  it('tests checkIPAddressWhitelistPolicy - sessionId is null and  returns false', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCredentials = {};
    const mockSessionId = null;
    const mockRequest = {
      address: {
        ip: 1,
      },
    };
    let mockCallback;

    serviceInst.cache_profiles = {
      every: test.sinon.stub().callsFake((callback) => {
        const profile = {
          policy: {
            sourceIPWhitelist: [1],
          },
          session: 'mockSession',
        };
        mockCallback = callback(profile);
      }),
    };

    const stubMangoFilter = test.sinon.stub(commons, 'mongoFilter').returns([{}]);

    serviceInst.checkIPAddressWhitelistPolicy(mockCredentials, mockSessionId, mockRequest);

    test.chai.expect(mockCallback).to.be.true;

    stubMangoFilter.restore();
  });

  it('tests checkDisableDefaultAdminNetworkConnections', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockCredentials = { username: '_ADMIN' };
    const mockRequest = { data: { info: { _local: false } } };

    serviceInst.config = {
      disableDefaultAdminNetworkConnections: true,
    };

    const result = serviceInst.checkDisableDefaultAdminNetworkConnections(
      mockCredentials,
      mockRequest
    );

    test.chai.expect(result).to.be.true;
  });

  it('tests verifyAuthenticationDigest - request.publicKey is null and push new error to callbackArgs array', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockRequest = { publicKey: null };
    const mockCallback = test.sinon.stub();

    serviceInst.verifyAuthenticationDigest(mockRequest, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'no publicKey in request'))
      );
  });

  it('tests verifyAuthenticationDigest - request.digest is null and push new error to callbackArgs array', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockRequest = { publicKey: 'mockKey', digest: null };
    const mockCallback = test.sinon.stub();

    serviceInst.verifyAuthenticationDigest(mockRequest, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'no digest in request'))
      );
  });

  it('tests verifyAuthenticationDigest - nonce is null and push new error to callbackArgs array', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockRequest = { publicKey: 'mockKey', digest: 'mockDigest' };
    const mockCallback = test.sinon.stub();

    serviceInst.cache_security_authentication_nonce = {
      get: test.sinon.stub().returns(null),
    };

    serviceInst.verifyAuthenticationDigest(mockRequest, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'nonce expired or public key invalid'))
      );
  });

  it('tests verifyAuthenticationDigest - verify throws new error and push error into callbackArgs array', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockRequest = { publicKey: 'mockKey', digest: 'mockDigest' };
    const mockCallback = test.sinon.stub();

    serviceInst.cache_security_authentication_nonce = {
      get: test.sinon.stub().returns('mockNonce'),
    };
    serviceInst.cryptoService = {
      verify: test.sinon.stub().throws(new Error('mockError')),
    };
    serviceInst.verifyAuthenticationDigest(mockRequest, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );

    test.chai
      .expect(serviceInst.cryptoService.verify)
      .to.have.been.calledWithExactly('mockNonce', 'mockDigest', 'mockKey');
  });

  it('tests authorize - calls completeCall function if authorized is false. ', async () => {
    const mockSession = { id: 1, token: null };
    const mockPath = 'mockPath';
    const mockAction = {};
    const mockCallback = test.sinon.stub();
    const getStub = test.sinon.stub().callsFake((_, cb) => cb(null, {}));
    const setStub = test.sinon.stub().callsFake((_, __, cb) => cb(null));

    initializer({ sessionTokenSecret: 'mock' }, mockHappn, true);
    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      get: getStub,
      set: setStub,
    });

    await require('timers/promises').setTimeout(50);

    serviceInstance.loadRevokedTokens(test.sinon.stub());
    serviceInstance.activateSessionActivity(test.sinon.stub());
    serviceInstance.authorize(mockSession, mockPath, mockAction, mockCallback);

    test.chai.expect(getStub).to.have.been.calledWithExactly(null, test.sinon.match.func);
    test.chai.expect(setStub).to.have.been.calledWithExactly(
      1,
      {
        path: 'mockPath',
        action: {},
        id: 1,
        error: '',
        authorized: false,
        reason: 'token has been revoked',
      },
      test.sinon.match.func
    );
  });

  it('tests authorize - calls completeCall function if authorized is false and this.log.warn is called if this.logSessionActivity callback function is called with a error.  ', async () => {
    const mockSession = { id: 1, token: null };
    const mockPath = 'mockPath';
    const mockAction = {};
    const mockCallback = test.sinon.stub();
    const getStub = test.sinon.stub().callsFake((_, cb) => cb(null, {}));
    const setStub = test.sinon.stub().callsFake((_, __, cb) => cb(new Error('mockError')));

    initializer({ sessionTokenSecret: 'mock' }, mockHappn, true);
    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      get: getStub,
      set: setStub,
    });
    const warnStub = test.sinon.stub(serviceInstance.log, 'warn');

    await require('timers/promises').setTimeout(50);

    serviceInstance.loadRevokedTokens(test.sinon.stub());
    serviceInstance.activateSessionActivity(test.sinon.stub());
    serviceInstance.authorize(mockSession, mockPath, mockAction, mockCallback);

    test.chai
      .expect(warnStub)
      .to.have.been.calledWithExactly('unable to log session activity: Error: mockError');

    warnStub.restore();
  });

  it('tests checkRevocations - callback is called if this.cache_revoked_tokens is falsy.', async () => {
    const setStub = test.sinon.stub().callsFake((_, __, cb) => cb(null));
    const mockSession = { id: 1, token: null, authType: null, username: 'mockUsername' };
    const mockCallback = test.sinon.stub();

    await initializer({ sessionTokenSecret: true }, mockHappn, true);

    getUserStub.onSecondCall().callsFake((_, cb) => cb(null, null));
    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      set: setStub,
    });

    serviceInstance.checkRevocations(mockSession, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, true);
    test.chai
      .expect(getUserStub)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
  });

  it('tests checkRevocations - this.cache_revoked_tokens.get gets called and callback is called with an error.', async () => {
    const setStub = test.sinon.stub().callsFake((_, __, cb) => cb(null));
    const getStub = test.sinon.stub().callsFake((_, cb) => cb(new Error('mockError')));
    const mockSession = { id: 1, token: null, authType: null, username: 'mockUsername' };
    const mockCallback = test.sinon.stub();

    await initializer({ sessionTokenSecret: true }, mockHappn, true);

    getUserStub.onSecondCall().callsFake((_, cb) => cb(null, null));
    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      set: setStub,
      get: getStub,
    });

    serviceInstance.loadRevokedTokens(test.sinon.stub());
    serviceInstance.checkRevocations(mockSession, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
    test.chai
      .expect(getUserStub)
      .to.have.been.calledWithExactly('mockUsername', test.sinon.match.func);
    test.chai.expect(getStub).to.have.been.calledWithExactly(null, test.sinon.match.func);
  });

  it('tests generateSession method returns null if sessionInfo is null.', async () => {
    const mockUser = { permissions: {}, groups: {} };
    const mockSessionId = 1;
    const mockCredentials = { info: 'mockInfo' };
    const mockTokenLogin = { session: { type: 1, id: 1 }, token: 'mockToken' };

    await initializer(
      {
        sessionTokenSecret: 'mockSessionTokenSecret',
        cookieName: 'mockCookieName',
        httpsCookie: 'httpsCookie',
      },
      mockHappn,
      true
    );

    const stubGetSession = serviceInstance.happn.services.session.getSession.returns(null);
    const cloneStub = serviceInstance.happn.services.utils.clone.returns({});
    const stubDateNow = test.sinon.stub(Date, 'now').returns(5000);

    const result = serviceInstance.generateSession(
      mockUser,
      mockSessionId,
      mockCredentials,
      mockTokenLogin
    );

    test.chai.expect(result).to.be.null;
    test.chai.expect(stubGetSession).to.have.been.calledWithExactly(1);
    test.chai.expect(cloneStub).to.have.been.calledWithExactly({
      id: 1,
      httpsCookie: 'httpsCookie',
      info: 'mockInfo',
      user: { permissions: {}, groups: {} },
      timestamp: 5000,
      origin: 'mockName',
      type: 1,
      parentId: 1,
      policy: {
        0: { ttl: 0, inactivity_threshold: 60000 },
        1: { ttl: 0, inactivity_threshold: 60000 },
      },
      permissionSetKey: '2jmj7l5rSw0yVb/vlWAYkK/YBwk=',
      token: 'mockToken',
      cookieName: 'mockCookieName',
    });

    stubDateNow.restore();
  });

  it('tests generateSession method returns session and checks if sessionInfo.encrypted is truthy.', async () => {
    const mockUser = { permissions: {}, groups: {} };
    const mockSessionId = 1;
    const mockCredentials = { info: 'mockInfo' };
    const mockTokenLogin = { session: { type: 1, id: 1 }, token: 'mockToken' };

    await initializer(
      {
        sessionTokenSecret: 'mockSessionTokenSecret',
        cookieName: 'mockCookieName',
        httpsCookie: 'httpsCookie',
        cookieDomain: 'mockCookieDomain',
      },
      mockHappn,
      true
    );

    serviceInstance.happn.services.session.getSession.returns({
      headers: {},
      encrypted: 'mockEncrypted',
    });

    serviceInstance.happn.services.utils.clone.returns({});
    const stubDateNow = test.sinon.stub(Date, 'now').returns(5000);

    const result = serviceInstance.generateSession(
      mockUser,
      mockSessionId,
      mockCredentials,
      mockTokenLogin
    );

    test.chai.expect(result).to.eql({
      cookieDomain: 'mockCookieDomain',
      cookieName: 'mockCookieName_https',
      httpsCookie: 'httpsCookie',
      id: 1,
      info: 'mockInfo',
      origin: 'mockName',
      parentId: 1,
      permissionSetKey: '2jmj7l5rSw0yVb/vlWAYkK/YBwk=',
      policy: {
        0: {
          inactivity_threshold: 60000,
          ttl: 0,
        },
        1: {
          inactivity_threshold: 60000,
          ttl: 0,
        },
      },
      timestamp: 5000,
      token: 'mockToken',
      type: 1,
      user: {
        groups: {},
        permissions: {},
      },
    });

    stubDateNow.restore();
  });

  it('tests generateSession method returns session and checks if sessionInfo.encrypted is falsy.', async () => {
    const mockUser = { permissions: {}, groups: {} };
    const mockSessionId = 1;
    const mockCredentials = { info: 'mockInfo' };
    const mockTokenLogin = { session: { type: 1, id: 1 }, token: 'mockToken' };

    await initializer(
      {
        sessionTokenSecret: 'mockSessionTokenSecret',
        cookieName: 'mockCookieName',
        httpsCookie: 'httpsCookie',
        cookieDomain: 'mockCookieDomain',
      },
      mockHappn,
      true
    );

    serviceInstance.happn.services.session.getSession.returns({
      headers: {},
      encrypted: null,
    });

    serviceInstance.happn.services.utils.clone.returns({});
    const stubDateNow = test.sinon.stub(Date, 'now').returns(5000);

    const result = serviceInstance.generateSession(
      mockUser,
      mockSessionId,
      mockCredentials,
      mockTokenLogin
    );

    test.chai.expect(result).to.eql({
      cookieDomain: 'mockCookieDomain',
      cookieName: 'mockCookieName',
      httpsCookie: 'httpsCookie',
      id: 1,
      info: 'mockInfo',
      origin: 'mockName',
      parentId: 1,
      permissionSetKey: '2jmj7l5rSw0yVb/vlWAYkK/YBwk=',
      policy: {
        0: {
          inactivity_threshold: 60000,
          ttl: 0,
        },
        1: {
          inactivity_threshold: 60000,
          ttl: 0,
        },
      },
      timestamp: 5000,
      token: 'mockToken',
      type: 1,
      user: {
        groups: {},
        permissions: {},
      },
    });

    stubDateNow.restore();
  });

  it('tests authorize - this.checkRevocations is called and returns callback with error.', async () => {
    const mockSession = { id: 1, token: 'mockToken' };
    const mockPath = 'mockPath';
    const mockAction = {};
    const mockCallback = test.sinon.stub();
    const getStub = test.sinon.stub().callsFake((_, cb) => cb(null, {}));
    const setStub = test.sinon.stub().callsFake((_, __, cb) => cb(null));

    initializer({ sessionTokenSecret: 'mockSessionTokenSecret' }, mockHappn, true);
    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      get: getStub,
      set: setStub,
    });

    await require('timers/promises').setTimeout(50);

    serviceInstance.loadRevokedTokens(test.sinon.stub());
    serviceInstance.activateSessionActivity(test.sinon.stub());
    serviceInstance.authorize(mockSession, mockPath, mockAction, mockCallback);

    test.chai
      .expect(serviceInstance.happn.services.error.InvalidCredentialsError)
      .to.have.been.calledWithExactly('Invalid credentials: invalid session token');
    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('tests authorize - this.checkpoint._authorizeSession is called and callback is called with error. ', async () => {
    const mockSession = { id: 1, token: null };
    const mockPath = 'mockPath';
    const mockAction = {};
    const mockCallback = test.sinon.stub();
    const getStub = test.sinon.stub().callsFake((_, cb) => cb(null, null));
    const _authorizeSessionStub = test.sinon
      .stub(CheckPoint.prototype, '_authorizeSession')
      .callsFake((_, __, ___, cb) => cb(new Error('mockError')));

    initializer({ sessionTokenSecret: 'mock' }, mockHappn, true);

    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub(),
      get: getStub,
    });
    serviceInstance.happn.services.utils.buildBoundProxy.returns({});

    await require('timers/promises').setTimeout(50);

    serviceInstance.loadRevokedTokens(test.sinon.stub());
    serviceInstance.activateSessionActivity(test.sinon.stub());
    serviceInstance.authorize(mockSession, mockPath, mockAction, mockCallback);

    test.chai.expect(getStub).to.have.been.calledWithExactly(null, test.sinon.match.func);
    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai
      .expect(_authorizeSessionStub)
      .to.have.been.calledWithExactly(
        { id: 1, token: null },
        'mockPath',
        {},
        test.sinon.match.func
      );

    _authorizeSessionStub.restore();
  });

  it('tests authorizeOnBehalfOf - calls getOnBehalfOfSession and calls callback function with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockSession = {
      id: 1,
      token: 1,
      user: {
        username: '_ADMIN',
      },
    };
    const mockPath = 'mockPath';
    const mockAction = 'mockAction';
    const mockOnBehalfOf = {};
    const mockCallback = test.sinon.stub();

    serviceInst.config = {
      logSessionActivity: true,
    };
    serviceInst.cache_session_on_behalf_of = {
      get: test.sinon.stub().returns(null),
    };
    serviceInst.users = {
      getUser: test.sinon.stub().callsFake((_, callback) => {
        callback('mockError');
      }),
    };
    serviceInst.cache_session_activity = {
      set: test.sinon.stub().callsFake((_, __, callback) => {
        callback();
      }),
    };

    serviceInst.authorizeOnBehalfOf(
      mockSession,
      mockPath,
      mockAction,
      mockOnBehalfOf,
      mockCallback
    );

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        'mockError',
        false,
        'failed to get on behalf of session',
        undefined
      );
    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly({}, test.sinon.match.func);
    test.chai.expect(serviceInst.cache_session_activity.set).to.have.been.calledWithExactly(
      1,
      {
        path: 'mockPath',
        action: 'mockAction',
        id: 1,
        error: 'mockError',
        authorized: false,
        reason: 'failed to get on behalf of session',
      },
      test.sinon.match.func
    );
  });

  it('tests authorizeOnBehalfOf - calls authorize and calls callback function with error', async () => {
    initializer({ secure: true }, mockHappn, true);

    const getStub = test.sinon.stub().returns({ token: {} });
    const mockSession = {
      id: 1,
      token: {},
      user: {
        username: '_ADMIN',
      },
    };
    const mockPath = 'mockPath';
    const mockAction = 'mockAction';
    const mockOnBehalfOf = 'mockOnBehalfOf';
    const mockCallback = test.sinon.stub();
    const warnStub = test.sinon.stub(serviceInstance.log, 'warn');

    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub().callsFake((cb) => {
        cb();
      }),
      get: getStub,
      set: test.sinon.stub().callsFake((_, __, cb) => cb(new Error('mockError'))),
    });

    await require('node:timers/promises').setTimeout(50);

    serviceInstance.activateSessionActivity(test.sinon.stub());
    serviceInstance.authorizeOnBehalfOf(
      mockSession,
      mockPath,
      mockAction,
      mockOnBehalfOf,
      mockCallback
    );
    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error),
        false,
        undefined,
        undefined
      );
    test.chai.expect(getStub).to.have.been.calledWithExactly('mockOnBehalfOf:1', {
      clone: false,
    });
    test.chai
      .expect(warnStub)
      .to.have.been.calledWithExactly('unable to log session activity: Error: mockError');
    warnStub.restore();
  });

  it('tests authorizeOnBehalfOf - userIsDelegate calls callback function with error', async () => {
    await initializer({ secure: true }, mockHappn, true);

    const callback = test.sinon.stub();
    const mockSession = {
      id: 1,
      token: 1,
      user: {
        username: null,
      },
    };

    await require('node:timers/promises').setTimeout(50);

    const usersStub = test.sinon
      .stub(Users.prototype, 'userBelongsToGroups')
      .callsFake((_, __, cb) => {
        cb(new Error('test error'));
      });

    serviceInstance.authorizeOnBehalfOf(mockSession, null, null, null, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );

    usersStub.restore();
  });

  it('tests __getOnBehalfOfSession - calls this.users.getUser . Calls callback function and returns callback with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockMessage = {
      request: {
        options: {
          onBehalfOf: 'mockOnBehalfOf',
        },
      },
      session: {},
    };
    const mockCallback = test.sinon.stub();

    serviceInst.cache_session_on_behalf_of = {
      get: test.sinon.stub().returns(null),
    };
    serviceInst.users = {
      getUser: test.sinon.stub().callsFake((_, callback) => {
        callback('mockError');
      }),
    };

    serviceInst.getCorrectSession(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockOnBehalfOf', test.sinon.match.func);
  });

  it('tests getCorrectSession - returns __getOnBehalfOfSession', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockMessage = {
      request: {
        options: {
          onBehalfOf: 'mockOnBehalfOf',
        },
      },
      session: {},
    };
    const mockCallback = test.sinon.stub();

    serviceInst.cache_session_on_behalf_of = {
      get: test.sinon.stub().returns(null),
    };
    serviceInst.users = {
      getUser: test.sinon.stub().callsFake((_, callback) => {
        callback(null, null);
      }),
    };

    serviceInst.getCorrectSession(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, null);
    test.chai
      .expect(serviceInst.users.getUser)
      .to.have.been.calledWithExactly('mockOnBehalfOf', test.sinon.match.func);
  });

  it('tests getCorrectSession - returns callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockMessage = {
      request: {
        options: {
          onBehalfOf: '_ADMIN',
        },
      },
      session: {},
    };
    const mockCallback = test.sinon.stub();

    serviceInst.getCorrectSession(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {});
  });

  it('tests getRelevantPaths - calls this.getCorrectSession and calls callback function with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = { request: { path: 'mockPath', action: 'mockAction' } };
    const mockCallback = test.sinon.stub();

    serviceInst.getCorrectSession = test.sinon.stub((_, callback) => {
      callback('mockError', null);
    });
    serviceInst.checkpoint = {
      listRelevantPermissions: test.sinon.stub(),
    };

    serviceInst.getRelevantPaths(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
    test.chai
      .expect(serviceInst.checkpoint.listRelevantPermissions)
      .to.have.been.calledWithExactly(null, 'mockPath', 'mockAction', test.sinon.match.func);
  });

  it('tests getRelevantPaths', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = { request: { path: 'mockPath', action: 'mockAction' } };
    const mockCallback = test.sinon.stub();

    serviceInst.getCorrectSession = test.sinon.stub((_, callback) => {
      callback(null, null);
    });
    serviceInst.checkpoint = {
      listRelevantPermissions: test.sinon.stub(),
    };

    serviceInst.getRelevantPaths(mockMessage, mockCallback);

    test.chai
      .expect(serviceInst.checkpoint.listRelevantPermissions)
      .to.have.been.calledWithExactly(null, 'mockPath', 'mockAction', test.sinon.match.func);
  });

  it('tests stop method - this.cache_session_activity.stop is called if this.cache_session_activity is true.', async () => {
    const mockOptions = {};
    const mockCallback = test.sinon.stub();
    const stopStub = test.sinon.stub();
    await initializer({}, mockHappn, true);
    test.sinon.stub(serviceInstance.checkpoint, 'stop');

    serviceInstance.happn.services.cache.create.returns({
      sync: test.sinon.stub().callsFake((cb) => cb()),
      stop: stopStub,
    });

    serviceInstance.activateSessionActivity(test.sinon.stub());
    serviceInstance.stop(mockOptions, mockCallback);

    test.chai.expect(stopStub).to.have.callCount(1);
  });

  it('tests validateName - throws error when name is falsy', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockName = null;
    const mockValidationType = null;

    serviceInst.errorService = {
      ValidationError: Error,
    };
    serviceInst.utilsService = {
      stringContainsAny: test.sinon.stub().returns(true),
    };

    test.chai
      .expect(() => serviceInst.validateName(mockName, mockValidationType))
      .to.throw('names cannot be empty');
  });

  it('tests validateName - throws error when this.utilsService.stringContainsAny returns truthy value', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockName = 'mockName';
    const mockValidationType = null;

    serviceInst.errorService = {
      ValidationError: Error,
    };
    serviceInst.utilsService = {
      stringContainsAny: test.sinon.stub().returns(true),
    };

    test.chai
      .expect(() => serviceInst.validateName(mockName, mockValidationType))
      .to.throw(
        'validation error: null names cannot contain the special _SYSTEM, _GROUP, _PERMISSION, _USER_GROUP, _ADMIN, _ANONYMOUS segment or a forward slash /'
      );
  });

  it('tests checkOverwrite - options.overwrite is true and calls callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockValidationType = {};
    const mockObj = { name: 'mockName' };
    const mockPath = 'mockPath';
    const mockName = null;
    const mockOptions = { overwrite: true };
    const mockCallback = test.sinon.stub();

    serviceInst.checkOverwrite(
      mockValidationType,
      mockObj,
      mockPath,
      mockName,
      mockOptions,
      mockCallback
    );

    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests checkOverwrite - options.overwrite is false and calls this.dataService.get. Callback function called with error.', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockValidationType = {};
    const mockObj = { name: 'mockName' };
    const mockPath = 'mockPath';
    const mockName = null;
    const mockOptions = { overwrite: false };
    const mockCallback = test.sinon.stub();

    serviceInst.dataService = {
      get: test.sinon.stub().callsFake((_, __, callback) => {
        callback('mockError', null);
      }),
    };

    serviceInst.checkOverwrite(
      mockValidationType,
      mockObj,
      mockPath,
      mockName,
      mockOptions,
      mockCallback
    );

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
    test.chai
      .expect(serviceInst.dataService.get)
      .to.have.been.calledWithExactly('mockPath', {}, test.sinon.match.func);
  });

  it('tests checkOverwrite - options.overwrite is false and calls this.dataService.get. Callback function called with result and error is null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockValidationType = 'Error';
    const mockObj = { name: 'mockName' };
    const mockPath = 'mockPath';
    const mockName = null;
    const mockOptions = { overwrite: false };
    const mockCallback = test.sinon.stub();

    serviceInst.dataService = {
      get: test.sinon.stub().callsFake((_, __, callback) => {
        callback(null, 'mockResult');
      }),
    };

    serviceInst.checkOverwrite(
      mockValidationType,
      mockObj,
      mockPath,
      mockName,
      mockOptions,
      mockCallback
    );

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              'validation failure: Error by the name mockName already exists'
            )
          )
      );
    test.chai
      .expect(serviceInst.dataService.get)
      .to.have.been.calledWithExactly('mockPath', {}, test.sinon.match.func);
  });

  it('tests checkOverwrite - options.overwrite is false and calls this.dataService.get. Callback function called ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockValidationType = {};
    const mockObj = { name: 'mockName' };
    const mockPath = 'mockPath';
    const mockName = null;
    const mockOptions = { overwrite: false };
    const mockCallback = test.sinon.stub();

    serviceInst.dataService = {
      get: test.sinon.stub().callsFake((_, __, callback) => {
        callback(null, null);
      }),
    };

    serviceInst.checkOverwrite(
      mockValidationType,
      mockObj,
      mockPath,
      mockName,
      mockOptions,
      mockCallback
    );

    test.chai.expect(mockCallback).to.have.callCount(1);
    test.chai
      .expect(serviceInst.dataService.get)
      .to.have.been.calledWithExactly('mockPath', {}, test.sinon.match.func);
  });

  it('tests serializeAll -checks if objArray is falsy and returns empty array', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockObjectType = {};
    const mockObjArray = null;
    const mockOptions = {};

    const result = serviceInst.serializeAll(mockObjectType, mockObjArray, mockOptions);

    test.chai.expect(result).to.eql([]);
  });

  it('tests serializeAll - maps over objArray and calls serialize', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    const mockObjectType = {};
    const mockObjArray = [{}];
    const mockOptions = {};

    serviceInst.serialize = test.sinon.stub();

    serviceInst.serializeAll(mockObjectType, mockObjArray, mockOptions);

    test.chai.expect(serviceInst.serialize).to.have.calledWithExactly({}, {}, {});
  });

  it('tests serialize = options.clone is false', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockObjectType = {};
    const mockObj = {
      _meta: 'meta',
      data: {
        _meta: 'mockMeta',
      },
    };
    const mockOptions = { clone: false };

    serviceInst.serialize(mockObjectType, mockObj, mockOptions);
  });

  function attachServiceInstance(serviceType, config, happn, initialize = true) {
    let mocked;
    if (happn.services[serviceType]) {
      mocked = happn.services[serviceType];
    }
    let serviceConfig = config.services[serviceType]?.config || {};
    if (config.secure) {
      serviceConfig.secure = true;
    }
    if (!config.logger) {
      config.logger = Logger;
    }
    const MockService = require(`../../../lib/services/${serviceType}/service`);
    let instance = new MockService(config);
    instance.happn = happn;
    return new Promise((resolve, reject) => {
      if (mocked) {
        instance = _.merge(instance, mocked); // mocked overrides
      }
      if (initialize && typeof instance.initialize === 'function') {
        return instance.initialize(serviceConfig, (e) => {
          if (e) return reject(e);
          happn.services[serviceType] = instance;
          resolve(instance);
        });
      }
      happn.services[serviceType] = instance;
      resolve(instance);
    });
  }

  async function initializeWithMocks(config, happn) {
    if (!happn.config) {
      happn.config = {};
    }
    if (!happn.services) {
      happn.services = {};
    }

    await attachServiceInstance('crypto', config, happn);
    await attachServiceInstance('cache', config, happn);
    await attachServiceInstance('data', config, happn);
    await attachServiceInstance('session', config, happn, false);
    await attachServiceInstance('utils', config, happn);
    await attachServiceInstance('error', config, happn);
    await attachServiceInstance('system', config, happn);
    await attachServiceInstance('connect', config, happn, false);
    await attachServiceInstance('protocol', config, happn, false);
    return await attachServiceInstance('security', config, happn);
  }

  async function initializer(config, mockHappn, getUser, error = {}) {
    serviceInstance = new SecurityService({
      logger: Logger,
      onBehalfOfCache: {},
    });
    groupsStub = test.sinon.stub(Groups.prototype, 'initialize');
    checkpointStub = test.sinon.stub(CheckPoint.prototype, 'initialize');
    usersStub = test.sinon.stub(Users.prototype, 'initialize');

    upsertGroupStub = test.sinon
      .stub(Groups.prototype, 'upsertGroupWithoutValidation')
      .returns('mockUpsertedUser');
    upsertUserStub = test.sinon
      .stub(Users.prototype, 'upsertUserWithoutValidation')
      .returns('mockUpsertUser');
    getUserStub = test.sinon.stub(Users.prototype, 'getUser');
    if (getUser === true) {
      getUserStub.onFirstCall().returns('mockUser');
    } else {
      getUserStub.returns(null);
    }

    const callback = test.sinon.stub();
    const mockConfig = {
      accountLockout: { enabled: false },
      disableDefaultAdminNetworkConnections: config.disableDefaultAdminNetworkConnections || true,
      updateSubscriptionsOnSecurityDirectoryChanged:
        config.updateSubscriptionsOnSecurityDirectoryChanged || null,
      defaultNonceTTL: config.defaultNonceTTL || 60000,
      logSessionActivity: config.logSessionActivity || false,
      sessionActivityTTL: config.sessionActivityTTL || 60000 * 60 * 24,
      pbkdf2Iterations: config.pbkdf2Iterations || 10000,
      lockTokenToLoginType: config.lockTokenToLoginType || null,
      cookieName: config.cookieName || null,
      cookieDomain: config.cookieDomain || null,
      secure: config.secure || false,
      sessionTokenSecret: config.sessionTokenSecret,
      authProviders: config.authProviders || {},
      allowAnonymousAccess: config.allowAnonymousAccess || false,
      activateSessionManagement: config.activateSessionManagement || false,
      adminUser: config.adminUser || null,
      adminGroup: config.adminGroup || null,
      allowUserChooseAuthProvider: config.allowUserChooseAuthProvider,
      httpsCookie: config.httpsCookie || null,
    };

    serviceInstance.happn = mockHappn;

    if (error.groupCallsFakeRejected) {
      groupsStub.callsFake((_, __, cb) => {
        cb(new Error('mockError'));
      });
    } else {
      groupsStub.callsFake((_, __, cb) => {
        cb(null);
      });
    }
    if (error.usersCallsFakeRejected) {
      usersStub.callsFake((_, __, cb) => {
        cb(new Error('mockError'));
      });
    } else {
      usersStub.callsFake((_, __, cb) => {
        cb(null);
      });
    }

    if (error.checkpointCallsFakeRejected) {
      checkpointStub.callsFake((_, __, cb) => {
        cb(new Error('mockError'));
      });
    } else {
      checkpointStub.callsFake((_, __, cb) => {
        cb(null);
      });
    }

    serviceInstance.initialize(mockConfig, callback);

    await require('node:timers/promises').setTimeout(50);
  }
});
