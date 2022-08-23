require('../../__fixtures/utils/test_helper').describe({ timeout: 20e3 }, function (test) {
  const SecurityService = require('../../../lib/services/security/service');
  const happn = require('../../../lib/index');
  const Logger = require('happn-logger');
  const CheckPoint = require('../../../lib/services/security/checkpoint');
  const util = test.commons.nodeUtils;
  const _ = test.commons._;
  const sift = test.commons.sift.default;

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

  var mockServices = function (callback, servicesConfig) {
    var testConfig = {
      secure: true,
      services: {
        cache: {},
        data: {},
        crypto: {},
        security: {},
      },
    };

    var testServices = {};

    testServices.cache = require('../../../lib/services/cache/service');
    testServices.crypto = require('../../../lib/services/crypto/service');
    testServices.data = require('../../../lib/services/data/service');
    testServices.security = require('../../../lib/services/security/service');
    testServices.session = require('../../../lib/services/session/service');
    testServices.utils = require('../../../lib/services/utils/service');
    testServices.error = require('../../../lib/services/error/service');
    testServices.log = require('../../../lib/services/log/service');

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
      ['log', 'error', 'utils', 'crypto', 'cache', 'session', 'data', 'security'],
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

        callback(null, happnMock);
      }
    );
  };

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

      happnMock.services.security.__profileSession(session);

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

  //issue:::
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

  it('should test the policy ms settings', function (done) {
    var SecurityService = require('../../../lib/services/security/service.js');

    var securityService = new SecurityService({
      logger: Logger,
    });

    var Utils = require('../../../lib/services/utils/service.js');

    var utils = new Utils({
      logger: require('happn-logger'),
    });

    securityService.happn = {
      services: {
        utils: utils,
        security: securityService,
      },
    };
    securityService
      .__initializeProfiles(serviceConfig.services.security.config)
      .then(function () {
        test.expect(securityService.__cache_Profiles[0].policy.ttl).to.be(4000);
        test.expect(securityService.__cache_Profiles[0].policy.inactivity_threshold).to.be(2000);
        test
          .expect(securityService.__cache_Profiles[1].policy.inactivity_threshold)
          .to.be(60000 * 60 * 48);
        // delete serviceConfig.services.security.config.authProvider;
        done();
      })
      .catch(done);
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

        instance.services.security.authProviders.default.login = function (
          credentials,
          sessionId,
          request,
          callback
        ) {
          callback(null, 2);
        };

        instance.services.security.processLogin = util.promisify(
          instance.services.security.processLogin
        );

        instance.services.security
          .processLogin({
            session: {
              id: 1,
            },
            request: {
              data: {},
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
  }).timeout(5000);

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

      happnMock.services.security.__getOnBehalfOfSession = function (
        username,
        onBehalfOf,
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

      happnMock.services.security.__getOnBehalfOfSession = function (
        username,
        onBehalfOf,
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

      happnMock.services.security.__getOnBehalfOfSession = function (
        username,
        onBehalfOf,
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

      happnMock.services.security.__getOnBehalfOfSession = function (
        username,
        onBehalfOf,
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

      happnMock.services.security.__getOnBehalfOfSession = function (
        username,
        onBehalfOf,
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

  it('tests the __getOnBehalfOfSession method - uncached', function (done) {
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
      var wasCached = false;
      let fetchedUserFromDb = false;

      happnMock.services.security.__cache_session_on_behalf_of = {
        get: () => {
          return null;
        },
        set: (username, user) => {
          wasCached = user;
        },
      };

      happnMock.services.security.users.getUser = function (username, callback) {
        fetchedUserFromDb = true;
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.__getOnBehalfOfSession(session, onBehalfOf, (e, onBehalfOf) => {
        if (e) return done(e);
        test.expect(fetchedUserFromDb).to.be(true);
        test.expect(onBehalfOf.user).to.eql({
          username: 'test-user',
          groups: {},
        });
        test.expect(onBehalfOf.happn).to.eql({
          happn: 'info',
        });
        test.expect(wasCached.user).to.eql({
          username: 'test-user',
          groups: {},
        });
        done();
      });
    });
  }).timeout(5000);

  it('tests the __getOnBehalfOfSession method - cached', function (done) {
    mockServices(function (e, happnMock) {
      if (e) return done(e);

      var session = {
        user: {
          username: 'illuminaughty',
        },
      };

      var onBehalfOf = 'test-user';

      happnMock.services.security.__cache_session_on_behalf_of = {
        get: () => {
          return {
            cached: true,
            user: {
              username: 'test-user',
              groups: {},
            },
          };
        },
        set: () => {},
      };

      let fetchedUserFromDb = false;

      happnMock.services.security.users.getUser = function (username, callback) {
        fetchedUserFromDb = true;
        callback(null, {
          username: 'test-user',
          groups: {},
        });
      };

      happnMock.services.security.__getOnBehalfOfSession(session, onBehalfOf, (e, onBehalfOf) => {
        if (e) return done(e);
        test.expect(fetchedUserFromDb).to.be(false);
        test.expect(onBehalfOf.user).to.eql({
          username: 'test-user',
          groups: {},
        });
        done();
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

  it('tests the __initializeSessionTokenSecret method, found secret', async () => {
    const SecurityService = require('../../../lib/services/security/service');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const config = {};
    serviceInst.dataService = {
      get: function (path, callback) {
        return callback(null, {
          data: {
            secret: 'TEST-SECRET',
          },
        });
      },
    };
    await serviceInst.__initializeSessionTokenSecret(config);
    test.expect(config.sessionTokenSecret).to.be('TEST-SECRET');
  });

  it('tests the __initializeSessionTokenSecret method, unfound secret', async () => {
    const SecurityService = require('../../../lib/services/security/service');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const config = {};
    let upserted;
    serviceInst.dataService = {
      get: function (path, callback) {
        return callback(null, null);
      },
      upsert: function (path, data, callback) {
        upserted = data.secret;
        callback();
      },
    };
    await serviceInst.__initializeSessionTokenSecret(config);
    test.expect(upserted != null).to.be(true);
    test.expect(config.sessionTokenSecret).to.be(upserted);
  });

  it('tests the __initializeSessionTokenSecret method, error on get', async () => {
    const SecurityService = require('../../../lib/services/security/service');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const config = {};
    //eslint-disable-next-line
    let upserted,
      errorHappened = false;
    serviceInst.dataService = {
      get: function (path, callback) {
        return callback(new Error('test-error'));
      },
      upsert: function (path, data, callback) {
        upserted = data.secret;
        callback();
      },
    };
    try {
      await serviceInst.__initializeSessionTokenSecret(config);
    } catch (e) {
      test.expect(e.message).to.be('test-error');
      errorHappened = true;
    }
    test.expect(errorHappened).to.be(true);
  });

  it('tests the __initializeSessionTokenSecret method, error on upsert', async () => {
    const SecurityService = require('../../../lib/services/security/service');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const config = {};
    let errorHappened = false;
    serviceInst.dataService = {
      get: function (path, callback) {
        return callback(null, null);
      },
      upsert: function (path, data, callback) {
        return callback(new Error('test-error'));
      },
    };
    try {
      await serviceInst.__initializeSessionTokenSecret(config);
    } catch (e) {
      test.expect(e.message).to.be('test-error');
      errorHappened = true;
    }
    test.expect(errorHappened).to.be(true);
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

  it('tests __ensureAdminUser, user exists', async () => {
    const SecurityService = require('../../../lib/services/security/service');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    serviceInst.users = {
      getUser: test.sinon.stub().resolves({ username: '_ADMIN' }),
      __upsertUser: test.sinon.stub().resolves({ username: '_ADMIN' }),
    };
    serviceInst.groups = {
      __upsertGroup: test.sinon.stub().resolves({ username: '_ADMIN' }),
      linkGroup: test.sinon.stub().resolves({}),
    };
    const config = {};
    await serviceInst.__ensureAdminUser(config);
    test.expect(serviceInst.users.__upsertUser.callCount).to.be(0);
    test.expect(serviceInst.groups.__upsertGroup.callCount).to.be(1);
  });

  it('tests __ensureAdminUser, user does not exist', async () => {
    const SecurityService = require('../../../lib/services/security/service');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    serviceInst.users = {
      getUser: test.sinon.stub().resolves(null),
      __upsertUser: test.sinon.stub().resolves({ username: '_ADMIN' }),
    };
    serviceInst.groups = {
      __upsertGroup: test.sinon.stub().resolves({ username: '_ADMIN' }),
      linkGroup: test.sinon.stub().resolves({}),
    };
    const config = {};
    await serviceInst.__ensureAdminUser(config);
    test.expect(serviceInst.groups.__upsertGroup.callCount).to.be(1);
    test.expect(serviceInst.groups.linkGroup.callCount).to.be(1);
    test.expect(serviceInst.users.__upsertUser.callCount).to.be(1);
  });

  // new tests
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

  it('tests doAuditData - auditData != null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'mockAction' },
      response: 'mockResponse',
      session: {
        type: 'mockType',
        user: { username: 'mockUsername' },
        protocol: 'mockProtocol',
      },
    };

    serviceInst.happn = {
      services: {
        utils: {
          replacePrefix: test.sinon.stub().returns('mock'),
          replaceSuffix: test.sinon.stub().returns('mock'),
        },
      },
    };
    serviceInst.config = { audit: {} };
    serviceInst.dataService = { upsert: test.sinon.stub() };
    serviceInst.dataService.upsert.callsFake((_, __, ___, callback) => {
      callback();
    });

    serviceInst.doAudit(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
      request: { path: 'mockPath', action: 'mockAction' },
      response: 'mockResponse',
      session: {
        type: 'mockType',
        user: { username: 'mockUsername' },
        protocol: 'mockProtocol',
      },
    });
  });

  it('tests doAuditData - auditData != null, callback have error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'mockAction' },
      response: 'mockResponse',
      session: {
        type: 'mockType',
        user: { username: 'mockUsername' },
        protocol: 'mockProtocol',
      },
    };

    serviceInst.happn = {
      services: {
        utils: {
          replacePrefix: test.sinon.stub().returns('mock'),
          replaceSuffix: test.sinon.stub().returns('mock'),
        },
        error: { SystemError: test.sinon.stub().returns('tests error') },
      },
    };
    serviceInst.config = { audit: {} };
    serviceInst.dataService = { upsert: test.sinon.stub() };
    serviceInst.dataService.upsert.callsFake((_, __, ___, callback) => {
      callback('mock error');
    });

    serviceInst.doAudit(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('tests error');
  });

  it('tests doAuditData - auditData == null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: { path: 'mockPath', action: 'mockAction' },
    };

    serviceInst.config = { audit: { paths: 'mockPaths' } };
    serviceInst.happn = {
      services: {
        utils: {
          wildcardMatchMultiple: test.sinon.stub().returns(false),
        },
      },
    };
    serviceInst.dataService = { upsert: test.sinon.stub() };

    serviceInst.doAudit(mockMessage, mockCallback);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
      request: { path: 'mockPath', action: 'mockAction' },
    });
  });

  it('tests getAuditData - message.response is an Array', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { path: 'mockPath', action: 'get' },
      response: [],
      session: {
        type: 'mockType',
        user: { username: 'mockUsername' },
        protocol: 'mockProtocol',
      },
    };

    serviceInst.config = { audit: {} };

    const result = serviceInst.getAuditData(mockMessage);

    test.chai.expect(result).to.eql({
      response: 0,
      session: {
        type: 'mockType',
        username: 'mockUsername',
        protocol: 'mockProtocol',
      },
    });
  });

  it('tests getAuditData - message.response is not an Array', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { path: 'mockPath', action: 'get' },
      response: 'mockResponse',
      session: {
        type: 'mockType',
        user: { username: 'mockUsername' },
        protocol: 'mockProtocol',
      },
    };

    serviceInst.config = { audit: {} };

    const result = serviceInst.getAuditData(mockMessage);

    test.chai.expect(result).to.eql({
      response: 1,
      session: {
        type: 'mockType',
        username: 'mockUsername',
        protocol: 'mockProtocol',
      },
    });
  });

  it('tests getAuditData -should replace path with empty string', () => {
    const paths = ['/ALL@', '/SET@', '/REMOVE@'];

    paths.forEach((path) => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockMessage = {
        request: { path: path + '/mockPath', action: 'mockAction' },
        response: 'mockResponse',
      };

      serviceInst.config = { audit: { paths: 'mockPaths' } };
      serviceInst.happn = {
        services: {
          utils: {
            wildcardMatchMultiple: test.sinon.stub().returns(false),
          },
        },
      };

      const result = serviceInst.getAuditData(mockMessage);
      test.chai.expect(result).to.be.null;
    });
  });

  it('tests getAuditData - message.request.path does not exists', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { action: 'mockAction' },
      response: 'mockResponse',
    };

    serviceInst.config = { audit: { paths: 'mockPaths' } };
    serviceInst.happn = {
      services: {
        utils: {
          wildcardMatchMultiple: test.sinon.stub().returns(false),
        },
      },
    };

    const result = serviceInst.getAuditData(mockMessage);
    test.chai.expect(result).to.be.null;
  });

  it('tests getAuditPath - request.path does not exist', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { action: 'mockAction' },
    };

    const result = serviceInst.getAuditPath(mockMessage);

    test.chai.expect(result).to.equal('/_AUDIT/mockAction');
  });

  it('tests getAuditPath - request.path does exist', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { path: '@mockPath', action: 'mockAction' },
    };

    serviceInst.happn = {
      services: {
        utils: {
          replacePrefix: test.sinon.stub().returns('mock'),
          replaceSuffix: test.sinon.stub().returns('mock'),
        },
      },
    };

    const result = serviceInst.getAuditPath(mockMessage);

    test.chai.expect(result).to.equal('/_AUDIT/mock/mockAction');
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

  it('tests processLogin - checks if authProviders.happn exists', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { data: { token: {}, username: '_ADMIN' } },
    };
    const mockCallback = test.sinon.stub();

    serviceInst.authProviders = {
      happn: { login: test.sinon.stub() },
      default: 'mockDefault',
    };
    serviceInst.authProviders.happn.login.callsFake((_, __, ___, callback) => {
      callback('mockError', null);
    });

    serviceInst.processLogin(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
  });

  it('tests login with no args', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    serviceInst.authProviders = {
      default: { login: test.sinon.stub().returns('tests') },
    };

    const result = serviceInst.login();

    test.chai.expect(result).to.equal('tests');
  });

  it('tests login with args', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    serviceInst.authProviders = {
      mockAuthType: { login: test.sinon.stub().returns('tests') },
    };

    const result = serviceInst.login({ authType: 'mockAuthType' });

    test.chai.expect(result).to.equal('tests');
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
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: 'mock' },
      },
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
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: 'mock' },
      },
    };

    serviceInst.happn = {
      services: {
        error: { AccessDeniedError: test.sinon.stub().returns('test') },
      },
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
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: 'mock' },
      },
    };

    serviceInst.authorizeOnBehalfOf = test.sinon.stub().callsFake((_, __, ___, ____, callback) => {
      callback(null, 'mockAuthorised', null, 'mockOnBehalfOfSession');
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: 'mock' },
      },
      session: 'mockOnBehalfOfSession',
    });
  });

  it('tests processAuthorize - return this.authorizeOnBehalfOf, authorized and reason is not null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: 'mock' },
      },
    };

    serviceInst.happn = {
      services: {
        error: { AccessDeniedError: test.sinon.stub().returns('test') },
      },
    };

    serviceInst.authorizeOnBehalfOf = test.sinon.stub().callsFake((_, __, ___, ____, callback) => {
      callback(null, null, 'mockReason', null);
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);
    test.chai.expect(mockCallback).to.have.been.calledWithExactly('test');
    test.chai
      .expect(serviceInst.happn.services.error.AccessDeniedError)
      .to.have.been.calledWithExactly('unauthorized', 'mockReason request on behalf of: mock');
  });

  it('tests processAuthorize - return this.authorize, calls calback with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockMessage = {
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: '_ADMIN' },
      },
    };

    serviceInst.happn = {
      services: {
        error: { AccessDeniedError: test.sinon.stub().returns('test') },
      },
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
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: '_ADMIN' },
      },
    };

    serviceInst.happn = {
      services: {
        error: { AccessDeniedError: test.sinon.stub().returns('test') },
      },
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
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: '_ADMIN' },
      },
    };

    serviceInst.happn = {
      services: {
        error: { AccessDeniedError: test.sinon.stub().returns('test') },
      },
    };

    serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
      callback(null, 'mockAuthorized', 'mockReason');
    });

    serviceInst.processAuthorize(mockMessage, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
      request: {
        path: 'mockPath',
        action: 'get',
        options: { onBehalfOf: '_ADMIN' },
      },
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

  it('tests __ensureAdminUser', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {
      adminUser: { password: 'mockPassword' },
      adminGroup: {},
    };

    serviceInst.groups = {
      __upsertGroup: test.sinon.stub(),
      linkGroup: test.sinon.stub(),
    };
    serviceInst.users = {
      getUser: test.sinon.stub(),
      __upsertUser: test.sinon.stub(),
    };

    await serviceInst.__ensureAdminUser(mockConfig);

    test.chai.expect(mockConfig).to.eql({
      adminGroup: {
        name: '_ADMIN',
        permissions: {
          '*': { actions: ['*'] },
        },
      },
      adminUser: {
        password: 'mockPassword',
        username: '_ADMIN',
      },
    });
  });

  it('tests __ensureAnonymousUser - returns anonymousUser', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {
      allowAnonymousAccess: {},
    };

    serviceInst.users = {
      getUser: test.sinon.stub().returns('test'),
    };

    const result = serviceInst.__ensureAnonymousUser(mockConfig);

    await test.chai.expect(result).to.eventually.equal('test');
  });

  it('tests __ensureAnonymousUser - returns users.__upsertUser', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {
      allowAnonymousAccess: {},
    };

    serviceInst.users = {
      getUser: test.sinon.stub().returns(null),
      __upsertUser: test.sinon.stub().returns('test'),
    };

    const result = serviceInst.__ensureAnonymousUser(mockConfig);

    await test.chai.expect(result).to.eventually.equal('test');
  });

  it('test linkAnonymousGroup - throws new error when allow config.allowAnonymousAccess is falsy', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockGroup = {};

    serviceInst.config = { allowAnonymousAccess: false };

    await test.chai
      .expect(serviceInst.linkAnonymousGroup(mockGroup))
      .to.eventually.be.rejectedWith('Anonymous access is not configured');
  });

  it('test linkAnonymousGroup - returns groups.linkGroup when config.allowAnonymousAccess is true', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockGroup = {};

    serviceInst.config = { allowAnonymousAccess: true };
    serviceInst.groups = { linkGroup: test.sinon.stub().returns('test') };

    const result = serviceInst.linkAnonymousGroup(mockGroup);

    await test.chai.expect(result).to.eventually.equal('test');
  });

  it('test unlinkAnonymousGroup - throws new error when allow config.allowAnonymousAccess is falsy', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockGroup = {};

    serviceInst.config = { allowAnonymousAccess: false };
    const result = serviceInst.unlinkAnonymousGroup(mockGroup);

    await test.chai
      .expect(result)
      .to.eventually.be.rejectedWith('Anonymous access is not configured');
  });

  it('test unlinkAnonymousGroup - returns groups.unlinkGroup when config.allowAnonymousAccess is true', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockGroup = {};

    serviceInst.config = { allowAnonymousAccess: true };
    serviceInst.groups = { unlinkGroup: test.sinon.stub().returns('test') };

    const result = serviceInst.unlinkAnonymousGroup(mockGroup);

    await test.chai.expect(result).to.eventually.equal('test');
  });

  it('tests __initializeReplication - happn.services.replicator is false , replicator.on callback returns', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    serviceInst.happn = {
      services: { replicator: { on: test.sinon.stub() } },
    };
    serviceInst.happn.services.replicator.on.callsFake((_, self) => {
      self(null, 'mockSelf');
    });
    serviceInst.__initializeReplication();

    test.chai.expect(serviceInst.happn.services.replicator).is.not.null;
  });

  it('tests __initializeReplication - happn.services.replicator is false , changedData.replicated is set to true', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockPayload = {
      whatHappnd: 'mockWhatHappnd',
      changedData: {},
      additionalInfo: 'mockAdditionalInfo',
    };

    serviceInst.happn = {
      services: { replicator: { on: test.sinon.stub() } },
    };
    serviceInst.happn.services.replicator.on.callsFake((_, self) => {
      self(mockPayload, null);
    });

    serviceInst.__initializeReplication();

    test.chai.expect(mockPayload).is.eql({
      whatHappnd: 'mockWhatHappnd',
      changedData: { replicated: true },
      additionalInfo: 'mockAdditionalInfo',
    });
  });

  it('tests __initializeCheckPoint - promise is rejected ', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    serviceInst.checkpoint = { initialize: test.sinon.stub() };

    test.sinon.stub(CheckPoint.prototype, 'initialize').callsFake((_, __, callback) => {
      callback('mockError');
    });

    const result = serviceInst.__initializeCheckPoint('mockConfig');

    await test.chai.expect(result).to.eventually.be.rejectedWith('mockError');
  });

  it('tests __initializeUsers - promise is rejected', async () => {
    const SecurityUsers = require('../../../lib/services/security/users');

    const serviceInst = new SecurityService({
      logger: Logger,
    });

    test.sinon.stub(SecurityUsers.prototype, 'initialize').callsFake((_, __, callback) => {
      callback('mockError');
    });

    const result = serviceInst.__initializeUsers('mockConfig');

    await test.chai.expect(result).to.eventually.be.rejectedWith('mockError');
  });

  it('tests __initializeSessionTokenSecret - promise is rejected', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = { sessionTokenSecret: 'mockSessionTokenSecret' };

    serviceInst.dataService = {
      upsert: test.sinon.stub(),
    };
    serviceInst.dataService.upsert.callsFake((_, __, callback) => {
      callback('mockError');
    });

    serviceInst.__initializeSessionTokenSecret(mockConfig);

    const result = serviceInst.__initializeSessionTokenSecret(mockConfig);

    await test.chai.expect(result).to.eventually.be.rejectedWith('mockError');
  });

  it('tests __initializeSessionTokenSecret - promise is fulfilled', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = { sessionTokenSecret: 'mockSessionTokenSecret' };

    serviceInst.dataService = {
      upsert: test.sinon.stub(),
    };
    serviceInst.dataService.upsert.callsFake((_, __, callback) => {
      callback(null);
    });

    serviceInst.__initializeSessionTokenSecret(mockConfig);

    const result = serviceInst.__initializeSessionTokenSecret(mockConfig);

    await test.chai.expect(result).to.eventually.be.fulfilled;
  });

  it('tests __initializeGroups - promise is rejected', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const SecurityGroups = require('../../../lib/services/security/groups');

    test.sinon.stub(SecurityGroups.prototype, 'initialize').callsFake((_, __, callback) => {
      callback('mockError');
    });

    const result = serviceInst.__initializeGroups('mockConfig');

    await test.chai.expect(result).to.eventually.be.rejectedWith('mockError');
  });

  it('tests __initializeOnBehalfOfCache - promise is resolved', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });

    serviceInst.config = { secure: 'mockSecure' };
    serviceInst.__cache_session_on_behalf_of = {};

    const result = serviceInst.__initializeOnBehalfOfCache();

    await test.chai.expect(result).to.eventually.be.fulfilled;
  });

  it('tests __initializeSessionManagement - return this.__loadRevokedTokens and callback is rejected', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {};

    serviceInst.config = { secure: {} };
    serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
      callback('mockError');
    });
    const result = serviceInst.__initializeSessionManagement(mockConfig);

    await test.chai.expect(result).to.eventually.be.rejectedWith('mockError');
  });

  it('tests __initializeSessionManagement - calls this.activateSessionManagement and callback called is rejected', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = { activateSessionManagement: {} };

    serviceInst.config = { secure: {} };
    serviceInst.activateSessionManagement = test.sinon.stub().callsFake((_, callback) => {
      callback('mockError');
    });

    const result = serviceInst.__initializeSessionManagement(mockConfig);

    await test.chai.expect(result).to.eventually.be.rejectedWith('mockError');
  });

  it('tests __initializeSessionManagement - calls this.activateSessionManagement and callback called is resolved', async () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = { activateSessionManagement: {} };

    serviceInst.config = { secure: {} };
    serviceInst.activateSessionManagement = test.sinon.stub().callsFake((_, callback) => {
      callback(null);
    });

    const result = serviceInst.__initializeSessionManagement(mockConfig);

    await test.chai.expect(result).to.eventually.be.fulfilled;
  });

  it('tests __initializeAuthProviders - creates BaseAuthProviders', () => {
    const BaseAuthProvider = require('../../../lib/services/security/authentication/provider-base');
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockConfig = {
      authProviders: { happn: false, mockAuthProvider: 'mockAuthProvider' },
      defaultAuthProvider: null,
    };

    test.sinon.stub(BaseAuthProvider, 'create').returns('mockAuthProvider');
    serviceInst.authProviders = {};

    serviceInst.__initializeAuthProviders(mockConfig);

    test.chai
      .expect(serviceInst.authProviders)
      .to.eql({ mockAuthProvider: 'mockAuthProvider', default: undefined });
  });

  it('tests activateSessionActivity returns this.__loadSessionActivity', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();

    serviceInst.__loadSessionActivity = test.sinon.stub().returns('mock test');

    const result = serviceInst.activateSessionActivity(mockCallback);

    test.chai.expect(result).to.equal('mock test');
  });

  it('tests activateSessionManagement - returns callback with new Error ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = test.sinon.stub();

    serviceInst.config = { secure: false };

    const result = serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(0);
    test.chai
      .expect(mockLogSessionActivity)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('tests activateSessionManagement - returns callback with error if this.config.secure is false ', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = test.sinon.stub();

    serviceInst.config = { secure: false };

    const result = serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(0);
    test.chai
      .expect(mockLogSessionActivity)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('tests activateSessionManagement - calls this.__loadRevokedTokens and returns callback with error', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockLogSessionActivity = {};

    serviceInst.config = { secure: true };
    serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
      callback('mockError');
    });

    serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
  });

  it('tests activateSessionManagement - calls this.__loadRevokedTokens and returns callback if logSessionActivity is false', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mockTest');
    const mockLogSessionActivity = false;

    serviceInst.config = { secure: true };
    serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
      callback();
    });

    serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests activateSessionManagement - calls this.__loadRevokedTokens and calls this.__loadSessionActivity if logSessionActivity is true', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mockTest');
    const mockLogSessionActivity = true;

    serviceInst.config = { secure: true };
    serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
      callback();
    });
    serviceInst.__loadSessionActivity = test.sinon.stub();

    serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

    test.chai.expect(serviceInst.__loadSessionActivity).to.have.callCount(1);
  });

  it('tests __loadRevokedTokens - return callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mockTest');

    serviceInst.__cache_revoked_tokens = true;

    const result = serviceInst.__loadRevokedTokens(mockCallback);

    test.chai.expect(result).to.equal('mockTest');
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

    serviceInst.__cache_session_activity = {};
    serviceInst.config = {};

    serviceInst.deactivateSessionActivity(mockClear, mockCallback);

    test.chai.expect(mockClear).to.have.callCount(1);
  });

  it('tests deactivateSessionActivity - return this.__cache_session_activity.clear', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub();
    const mockClear = true;

    serviceInst.__cache_session_activity = { clear: test.sinon.stub() };
    serviceInst.config = {};

    serviceInst.deactivateSessionActivity(mockClear, mockCallback);

    test.chai
      .expect(serviceInst.__cache_session_activity.clear)
      .to.have.been.calledWithExactly(test.sinon.match.func);
  });

  it('tests __loadSessionActivity - return callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mock');

    serviceInst.config = { _cache_session_activity: true };
    serviceInst.__cache_session_activity = {};

    const result = serviceInst.__loadSessionActivity(mockCallback);

    test.chai.expect(result).to.equal('mock');
    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests __loadSessionActivity - _cache_session_activity is false', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mock');
    serviceInst.__cache_session_activity = false;

    serviceInst.config = {
      _cache_session_activity: false,
      sessionActivityTTL: true,
    };
    serviceInst.cacheService = {
      create: test.sinon.stub().returns({ sync: test.sinon.stub() }),
    };
    serviceInst.dataService = {};

    const result = serviceInst.__loadSessionActivity(mockCallback);

    test.chai
      .expect(serviceInst.cacheService.create)
      .to.have.been.calledWithExactly('cache_session_activity', {
        type: 'persist',
        cache: {
          dataStore: {},
          defaultTTL: true,
        },
      });

    test.chai
      .expect(serviceInst.__cache_session_activity.sync)
      .to.have.been.calledWithExactly(test.sinon.match.func);
  });

  it('tests __checkRevocations - return callback', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mock');
    const mockToken = 'mockToken';
    serviceInst.__cache_revoked_tokens = {
      get: test.sinon.stub(),
    };
    serviceInst.__cache_revoked_tokens.get.callsFake((_, callback) => {
      callback('mockError');
    });

    serviceInst.__checkRevocations(mockToken, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
    test.chai
      .expect(serviceInst.__cache_revoked_tokens.get)
      .to.have.been.calledWithExactly('mockToken', test.sinon.match.func);
  });

  it('tests __checkRevocations - return callback if item equals null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mock');
    const mockToken = 'mockToken';
    serviceInst.__cache_revoked_tokens = {
      get: test.sinon.stub(),
    };
    serviceInst.__cache_revoked_tokens.get.callsFake((_, callback) => {
      callback(null, null);
    });

    serviceInst.__checkRevocations(mockToken, mockCallback);

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, true);
    test.chai
      .expect(serviceInst.__cache_revoked_tokens.get)
      .to.have.been.calledWithExactly('mockToken', test.sinon.match.func);
  });

  it('tests __checkRevocations - return callback if item equals null', () => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockCallback = test.sinon.stub().returns('mock');
    const mockToken = 'mockToken';
    serviceInst.__cache_revoked_tokens = {
      get: test.sinon.stub(),
    };
    serviceInst.__cache_revoked_tokens.get.callsFake((_, callback) => {
      callback(null, 'mockItem');
    });

    serviceInst.__checkRevocations(mockToken, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(null, false, 'token has been revoked');
  });
});
