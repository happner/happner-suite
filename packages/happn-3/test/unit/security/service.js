require('../../__fixtures/utils/test_helper').describe(
  { timeout: 20e3, only: true },
  function (test) {
    const happn = require('../../../lib/index');
    const Logger = require('happn-logger');
    const CheckPoint = require('../../../lib/services/security/checkpoint');
    const util = test.commons.nodeUtils;
    const _ = test.commons._;
    const sift = test.commons.sift.default;
    const SecurityService = require('../../../lib/services/security/service');
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
          test
            .expect(checkpoint.__checkUsageLimit(testSession, testSession.policy[1]))
            .to.be(false);
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

          happnMock.services.security.verifyAuthenticationDigest(
            mockSession,
            function (e, verified) {
              if (e) return done(e);
              test.expect(verified).to.be(true);
              stopServices(happnMock, done);
            }
          );
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

        happnMock.services.security.authorizeOnBehalfOf(
          session,
          path,
          action,
          onBehalfOf,
          callback
        );
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

        happnMock.services.security.authorizeOnBehalfOf(
          session,
          path,
          action,
          onBehalfOf,
          callback
        );
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

        happnMock.services.security.authorizeOnBehalfOf(
          session,
          path,
          action,
          onBehalfOf,
          callback
        );
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

        happnMock.services.security.authorizeOnBehalfOf(
          session,
          path,
          action,
          onBehalfOf,
          callback
        );
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

        happnMock.services.security.authorizeOnBehalfOf(
          session,
          path,
          action,
          onBehalfOf,
          callback
        );
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

      serviceInst.authProviders = { default: { login: test.sinon.stub().returns('tests') } };

      const result = serviceInst.login();

      test.chai.expect(result).to.equal('tests');
    });

    it('tests login with args', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      serviceInst.authProviders = { mockAuthType: { login: test.sinon.stub().returns('tests') } };

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
        request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
      };

      serviceInst.authorizeOnBehalfOf = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, callback) => {
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

      serviceInst.authorizeOnBehalfOf = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, callback) => {
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

      serviceInst.authorizeOnBehalfOf = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, callback) => {
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

      serviceInst.authorizeOnBehalfOf = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, callback) => {
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

      test.chai
        .expect(mockCallback.lastCall.args[0].message)
        .to.equal('no public key with request');
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
      serviceInst.users = { getUser: test.sinon.stub(), __upsertUser: test.sinon.stub() };

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

      try {
        await serviceInst.linkAnonymousGroup(mockGroup);
      } catch (error) {
        test.chai.expect(error.message).to.equal('Anonymous access is not configured');
      }
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

      serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

      test.chai.expect(mockCallback).to.have.callCount(0);
      test.chai
        .expect(mockLogSessionActivity)
        .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
      test.chai.expect();
    });

    it('tests activateSessionManagement - returns callback with error if this.config.secure is false ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockCallback = test.sinon.stub();
      const mockLogSessionActivity = test.sinon.stub();

      serviceInst.config = { secure: false };

      serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

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
        logSessionActivity: true,
      };
      serviceInst.cacheService = { create: test.sinon.stub().returns({ sync: test.sinon.stub() }) };
      serviceInst.dataService = {};

      serviceInst.__loadSessionActivity(mockCallback);

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
      test.chai
        .expect(serviceInst.__cache_revoked_tokens.get)
        .to.have.been.calledWithExactly('mockToken', test.sinon.match.func);
    });

    it('tests revokeToken - checks if token is null and returns callback with new Error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
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
      const mockToken = 'mockToken';
      const mockReason = 'mockReason';
      const mockCallback = test.sinon.stub();

      serviceInst.config = {
        sessionTokenSecret: true,
      };

      const decode = test.sinon.stub(require('jwt-simple'), 'decode').returns('test decode');
      const unpack = test.sinon
        .stub(require('jsonpack'), 'unpack')
        .returns({ info: { _browser: 'mock_browser' }, policy: [{ ttl: 0 }, { ttl: 0 }] });
      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
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
      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.spy(serviceInst, 'dataChanged');

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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
        policy: [{ ttl: 0 }, { ttl: 1 }],
        id: 1,
        type: 0,
      });

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });
      serviceInst.log = {
        warn: test.sinon.stub(),
      };

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.spy(serviceInst, 'dataChanged');

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai
        .expect(serviceInst.log.warn)
        .to.have.been.calledWithExactly(
          'revoking a token without a ttl means it stays in the revocation list forever'
        );
      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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

    it('tests revokeToken - checks if decoded.policy[0].ttl and decoded.policy[1].ttl is truthy and not equal to Infinity and checks if decoded.policy[0] is greater and equal to decoded.policy[1] ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
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

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.spy(serviceInst, 'dataChanged');

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.spy(serviceInst, 'dataChanged');

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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

    it('tests revokeToken -decoded.policy[0].ttl and decoded.policy[1].ttl equal to Infinity', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
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
        policy: [{ ttl: Infinity }, { ttl: Infinity }],
        id: 1,
      });

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback(null);
      });

      const stubDateNow = test.sinon.stub(Date, 'now').returns(18000);
      test.sinon.spy(serviceInst, 'dataChanged');

      serviceInst.revokeToken(mockToken, mockReason, mockCallback);

      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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

    it('tests getCookieName ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
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

      serviceInst.__cache_revoked_tokens = {
        remove: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.remove.callsFake((_, callback) => {
        callback('mockError');
      });

      serviceInst.restoreToken(mockToken, mockCallback);
      test.chai
        .expect(serviceInst.__cache_revoked_tokens.remove)
        .to.have.been.calledWithExactly('mockToken', test.sinon.match.func);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
    });

    it('tests restoreToken - callback called with error equal to null ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockToken = 'mockToken';
      const mockCallback = test.sinon.stub();

      serviceInst.__cache_revoked_tokens = {
        remove: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.remove.callsFake((_, callback) => {
        callback(null);
      });

      serviceInst.restoreToken(mockToken, mockCallback);

      test.chai
        .expect(serviceInst.__cache_revoked_tokens.remove)
        .to.have.been.calledWithExactly('mockToken', test.sinon.match.func);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null);
    });

    it('tests __logSessionActivity - calls __cache_session_activity.set, error is truthy', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockCallback = test.sinon.stub();

      serviceInst.__cache_session_activity = {
        set: test.sinon.stub(),
      };

      serviceInst.__logSessionActivity(
        1,
        'mockPath',
        'mockAction',
        'mockErr',
        'mockAuthorized',
        'mockReason',
        mockCallback
      );

      test.chai.expect(serviceInst.__cache_session_activity.set).to.have.been.calledWithExactly(
        1,
        {
          path: 'mockPath',
          action: 'mockAction',
          id: 1,
          error: 'mockErr',
          authorized: 'mockAuthorized',
          reason: 'mockReason',
        },
        test.sinon.match.func
      );
    });

    it('tests __logSessionActivity - calls __cache_session_activity.set, error is falsy', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockCallback = test.sinon.stub();

      serviceInst.__cache_session_activity = {
        set: test.sinon.stub(),
      };

      serviceInst.__logSessionActivity(
        1,
        'mockPath',
        'mockAction',
        null,
        'mockAuthorized',
        'mockReason',
        mockCallback
      );

      test.chai.expect(serviceInst.__cache_session_activity.set).to.have.been.calledWithExactly(
        1,
        {
          path: 'mockPath',
          action: 'mockAction',
          id: 1,
          error: '',
          authorized: 'mockAuthorized',
          reason: 'mockReason',
        },
        test.sinon.match.func
      );
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
              test.sinon.match.has(
                'message',
                `cache with name__cache_session_activity does not exist`
              )
            )
        );
    });

    it('tests __listCache', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockCacheName = '__cache_session_activity';
      const mockFilter = test.sinon.stub();

      serviceInst.__cache_session_activity = {
        all: test.sinon.stub().returns('test'),
      };

      const result = serviceInst.__listCache(mockCacheName, mockFilter);

      test.chai.expect(result).to.equal('test');
    });

    it('tests listActiveSessions - checks if filter is type of function and if this.__sessionManagementActive equals true', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockFilter = test.sinon.stub();
      const mockCallback = test.sinon.stub();

      serviceInst.__sessionManagementActive = false;

      serviceInst.listActiveSessions(mockFilter, mockCallback);

      test.chai
        .expect(mockFilter)
        .to.have.been.calledWithExactly(
          test.sinon.match
            .instanceOf(Error)
            .and(test.sinon.match.has('message', 'session management not activated'))
        );
    });

    it('tests listActiveSessions - checks if this.__sessionManagementActive equals true', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockFilter = 'mockFilter';
      const mockCallback = test.sinon.stub();

      serviceInst.__sessionManagementActive = true;
      serviceInst.happn = {
        services: {
          session: {
            __activeSessions: {
              all: test.sinon.stub().returns('all'),
            },
          },
        },
      };

      serviceInst.listActiveSessions(mockFilter, mockCallback);

      test.chai
        .expect(serviceInst.happn.services.session.__activeSessions.all)
        .to.have.been.calledWithExactly('mockFilter');
      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'all');
    });

    it('tests listActiveSessions - checks if this.__sessionManagementActive equals true and __activeSessions.all throws error ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockFilter = {};
      const mockCallback = test.sinon.stub();

      serviceInst.__sessionManagementActive = true;
      serviceInst.happn = {
        services: {
          session: {
            __activeSessions: {
              all: test.sinon.stub().throws(new Error('mockError')),
            },
          },
        },
      };

      serviceInst.listActiveSessions(mockFilter, mockCallback);

      test.chai
        .expect(mockCallback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
        );
    });

    it('tests listActiveSessions - checks if this.__sessionManagementActive equals true and __activeSessions.all throws error ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockFilter = {};
      const mockCallback = test.sinon.stub();

      serviceInst.__sessionManagementActive = true;
      serviceInst.happn = {
        services: {
          session: {
            __activeSessions: {
              all: test.sinon.stub().throws(new Error('mockError')),
            },
          },
        },
      };

      serviceInst.listActiveSessions(mockFilter, mockCallback);

      test.chai
        .expect(mockCallback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
        );
    });

    it('tests listRevokedTokens - checks if filter is a function and if __sessionManagementActive equals false', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockFilter = test.sinon.stub();
      const mockCallback = test.sinon.stub();

      serviceInst.__sessionManagementActive = false;

      serviceInst.listRevokedTokens(mockFilter, mockCallback);

      test.chai
        .expect(mockFilter)
        .to.have.been.calledWithExactly(
          test.sinon.match
            .instanceOf(Error)
            .and(test.sinon.match.has('message', 'session management not activated'))
        );
    });

    it('tests listRevokedTokens - checks if __sessionManagementActive equals true and calls callback', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockFilter = 'mockFilter';
      const mockCallback = test.sinon.stub();

      serviceInst.__sessionManagementActive = true;
      serviceInst.__cache_revoked_tokens = {
        all: test.sinon.stub().returns('all'),
      };

      serviceInst.listRevokedTokens(mockFilter, mockCallback);

      test.chai
        .expect(serviceInst.__cache_revoked_tokens.all)
        .to.have.been.calledWithExactly('mockFilter');
      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'all');
    });

    it('tests listRevokedTokens - checks if __sessionManagementActive is true and __cache_revoked_tokens.all throws error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockFilter = 'mockFilter';
      const mockCallback = test.sinon.stub();

      serviceInst.__sessionManagementActive = true;
      serviceInst.__cache_revoked_tokens = {
        all: test.sinon.stub().throws(new Error('mockError')),
      };

      serviceInst.listRevokedTokens(mockFilter, mockCallback);

      test.chai
        .expect(mockCallback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
        );
    });

    it('tests offDataChanged - deletes index from __dataHooks', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockIndex = 'mockIndex';

      serviceInst.__dataHooks = {
        mockIndex: 'mockIndex',
      };

      serviceInst.offDataChanged(mockIndex);

      test.chai.expect(serviceInst.__dataHooks).to.eql({});
    });

    it('tests onDataChanged - adds hook to __dataHooks array and returns length', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockHook = { mockHook: 'mockHook' };

      serviceInst.__dataHooks = [];

      const result = serviceInst.onDataChanged(mockHook);

      test.chai.expect(serviceInst.__dataHooks).to.eql([{ mockHook: 'mockHook' }]);
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
      };

      serviceInst.errorService = {
        handleSystem: test.sinon.stub(),
      };
      serviceInst.sessionService = { disconnectSessions: test.sinon.stub() };
      serviceInst.sessionService.disconnectSessions.callsFake((_, __, callback) => {
        callback('mockError');
      });

      const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

      test.chai
        .expect(serviceInst.sessionService.disconnectSessions)
        .to.have.been.calledWithExactly(
          1,
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
      };

      serviceInst.sessionService = { disconnectSessions: test.sinon.stub() };
      serviceInst.sessionService.disconnectSessions.callsFake((_, __, callback) => {
        callback(null);
      });

      const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

      test.chai
        .expect(serviceInst.sessionService.disconnectSessions)
        .to.have.been.calledWithExactly(
          1,
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

    it('tests resetSessionPermissions - returns this.__cache_revoked_tokens.set, promise resolved', async () => {
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

      serviceInst.sessionService = { disconnectSessions: test.sinon.stub() };
      serviceInst.sessionService.disconnectSessions.callsFake((_, __, callback) => {
        callback(null);
      });

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
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
      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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

    it('tests resetSessionPermissions - returns this.__cache_revoked_tokens.set, promise rejected', async () => {
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

      serviceInst.sessionService = { disconnectSessions: test.sinon.stub() };
      serviceInst.sessionService.disconnectSessions.callsFake((_, __, callback) => {
        callback(null);
      });

      serviceInst.__cache_revoked_tokens = {
        set: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.set.callsFake((_, __, ___, callback) => {
        callback('mockError');
      });

      const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

      await test.chai.expect(result).to.have.been.rejectedWith('mockError');
      test.chai.expect(serviceInst.__cache_revoked_tokens.set).to.have.been.calledWithExactly(
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

    it('tests resetSessionPermissions - returns this.__cache_revoked_tokens.remove, promise resolved', async () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_RESTORED;
      const mockChangedData = {
        replicated: true,
        token: 'mockToken',
      };

      serviceInst.__cache_revoked_tokens = {
        remove: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.remove.callsFake((_, __, callback) => {
        callback(null);
      });

      const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

      await test.chai.expect(result).to.eventually.eql([]);
      test.chai.expect(serviceInst.__cache_revoked_tokens.remove).to.have.been.calledWithExactly(
        'mockToken',
        {
          noPersist: true,
        },
        test.sinon.match.func
      );
    });

    it('tests resetSessionPermissions - returns this.__cache_revoked_tokens.remove, promise rejceted', async () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockWhatHappnd = CONSTANTS.SECURITY_DIRECTORY_EVENTS.TOKEN_RESTORED;
      const mockChangedData = {
        replicated: true,
        token: 'mockToken',
      };

      serviceInst.__cache_revoked_tokens = {
        remove: test.sinon.stub(),
      };
      serviceInst.__cache_revoked_tokens.remove.callsFake((_, __, callback) => {
        callback('mockError');
      });

      const result = serviceInst.resetSessionPermissions(mockWhatHappnd, mockChangedData);

      await test.chai.expect(result).to.have.been.rejectedWith('mockError');
      test.chai.expect(serviceInst.__cache_revoked_tokens.remove).to.have.been.calledWithExactly(
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

    it('tests emitChanges - calls __dataHooks.every calls callback and returns hook.apply. Promised is resolved ', async () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockWhatHappnd = null;
      const mockChangedData = null;
      const mockEffectedSessions = null;

      serviceInst.__dataHooks = {
        every: test.sinon.stub().callsFake((callback) => {
          callback({
            apply: test.sinon.stub(),
          });
        }),
      };

      serviceInst.emitChanges(mockWhatHappnd, mockChangedData, mockEffectedSessions);

      test.chai
        .expect(serviceInst.__dataHooks.every)
        .to.have.been.calledWithExactly(test.sinon.match.func);
    });

    it('tests emitChanges - calls __dataHooks.every throws error. Promised is resolved ', async () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockWhatHappnd = null;
      const mockChangedData = null;
      const mockEffectedSessions = null;

      serviceInst.__dataHooks = {
        every: test.sinon.stub().throws(new Error('mockError')),
      };

      const result = serviceInst.emitChanges(mockWhatHappnd, mockChangedData, mockEffectedSessions);

      await test.chai.expect(result).to.have.eventually.been.rejectedWith('mockError');
      test.chai
        .expect(serviceInst.__dataHooks.every)
        .to.have.been.calledWithExactly(test.sinon.match.func);
    });

    it('tests emitChanges - calls __dataHooks.every throws error. Promised is resolved ', async () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockWhatHappnd = null;
      const mockChangedData = null;
      const mockEffectedSessions = null;

      serviceInst.__dataHooks = {
        every: test.sinon.stub().throws(new Error('mockError')),
      };

      const result = serviceInst.emitChanges(mockWhatHappnd, mockChangedData, mockEffectedSessions);

      await test.chai.expect(result).to.have.eventually.been.rejectedWith('mockError');
      test.chai
        .expect(serviceInst.__dataHooks.every)
        .to.have.been.calledWithExactly(test.sinon.match.func);
    });

    it('tests dataChanged - additionalInfo is a function and calls __dataChangedQueue.push', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockCallback = test.sinon.stub();
      const mockWhatHappnd = null;
      const mockChangedData = null;
      const mockAdditionalInfo = test.sinon.stub();

      serviceInst.__dataChangedQueue = {
        push: test.sinon.stub(),
      };
      serviceInst.dataChanged(mockWhatHappnd, mockChangedData, mockAdditionalInfo, mockCallback);

      test.chai.expect(serviceInst.__dataChangedQueue.push).to.have.been.calledWithExactly(
        {
          whatHappnd: null,
          changedData: null,
          additionalInfo: undefined,
        },
        test.sinon.match.func
      );
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
      await test.chai
        .expect(stubResetSessionPermissions)
        .to.have.been.calledWithExactly('link-group', null, null);

      stubResetSessionPermissions.restore();
      stubQue.restore();
    });

    it('tests __replicateDataChanged - calls replicator.send and reject promise', async () => {
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
          changedData: { replicated: false },
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
          replicator: {
            send: test.sinon.stub(),
          },
        },
        config: {
          disableDefaultAdminNetworkConnections: false,
        },
        error: {
          handleFatal: test.sinon.stub(),
        },
      };
      serviceInst.happn.services.replicator.send.callsFake((_, __, callback) => {
        callback('mockError');
      });

      serviceInst.initialize(mockConfig, callback);

      stubResetSessionPermissions.restore();
      stubQue.restore();
    });
    it('tests __replicateDataChanged - changedData.replicated is true .', async () => {
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
          changedData: { replicated: true },
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
          replicator: {
            send: test.sinon.stub(),
          },
        },
        config: {
          disableDefaultAdminNetworkConnections: false,
        },
        error: {
          handleFatal: test.sinon.stub(),
        },
      };
      serviceInst.happn.services.replicator.send.callsFake((_, __, callback) => {
        callback({ message: 'Replicator not ready' });
      });

      serviceInst.initialize(mockConfig, callback);

      stubResetSessionPermissions.restore();
      stubQue.restore();
    });

    it('tests __replicateDataChanged - calls replicator.send and callback called with e.message equal to Replicator not ready. Promise is resolved.', async () => {
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
          changedData: { replicated: false },
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
          replicator: {
            send: test.sinon.stub(),
          },
        },
        config: {
          disableDefaultAdminNetworkConnections: false,
        },
        error: {
          handleFatal: test.sinon.stub(),
        },
      };
      serviceInst.happn.services.replicator.send.callsFake((_, __, callback) => {
        callback({ message: 'Replicator not ready' });
      });

      serviceInst.initialize(mockConfig, callback);

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

    it('tests checkTokenUserI-  callback function called with error and it returns callback with error ', () => {
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

      serviceInst.__cache_Profiles = [
        {
          session: 1,
          policy: 'mockPolicy',
        },
      ];

      try {
        serviceInst.generateSession(mockUser, sessionId, credentials, tokenLogin, additionalInfo);
      } catch (error) {
        test.chai.expect(error.message).to.equal('unable to match session with a profile');
      }
    });

    it('tests generateSession - encrypted is true and  x-forwarded-proto is equal to wss', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUser = 'mockUser';
      const sessionId = 1;
      const credentials = { info: {} };
      const tokenLogin = {
        token: 'mockToken',
        session: {
          id: 1,
          type: 'mockType',
        },
      };
      const additionalInfo = {};

      serviceInst.config = {
        httpsCookie: true,
        cookieDomain: true,
        cookieName: 'mockCookieName',
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

      serviceInst.__cache_Profiles = [
        {
          session: 1,
          policy: 'mockPolicy',
        },
      ];
      serviceInst.__profileSession = test.sinon.stub();
      serviceInst.generatePermissionSetKey = test.sinon.stub().returns(12345);
      serviceInst.sessionService = {
        getSession: test.sinon.stub().returns({
          headers: {
            'x-forwarded-proto': null,
          },
          encrypted: true,
        }),
      };
      const stubDateNow = test.sinon.stub(Date, 'now').returns(5000);

      const result = serviceInst.generateSession(
        mockUser,
        sessionId,
        credentials,
        tokenLogin,
        additionalInfo
      );

      test.chai.expect(result).to.eql({
        cookieDomain: true,
        cookieName: 'mockCookieName_https',
        httpsCookie: true,
        id: 1,
        info: {},
        origin: 'mockName',
        parentId: 1,
        permissionSetKey: 12345,
        timestamp: 5000,
        token: 'mockToken',
        type: 'mockType',
        user: 'mockUser',
      });

      stubDateNow.restore();
    });

    it('tests generateSession - encrypted and  x-forwarded-proto is null', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUser = 'mockUser';
      const sessionId = 1;
      const credentials = { info: {} };
      const tokenLogin = {
        token: 'mockToken',
        session: {
          id: 1,
          type: 'mockType',
        },
      };
      const additionalInfo = {};

      serviceInst.config = {
        httpsCookie: true,
        cookieDomain: true,
        cookieName: 'mockCookieName',
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

      serviceInst.__cache_Profiles = [
        {
          session: 1,
          policy: 'mockPolicy',
        },
      ];
      serviceInst.__profileSession = test.sinon.stub();
      serviceInst.generatePermissionSetKey = test.sinon.stub().returns(12345);
      serviceInst.sessionService = {
        getSession: test.sinon.stub().returns({
          headers: {
            'x-forwarded-proto': null,
          },
          encrypted: null,
        }),
      };
      const stubDateNow = test.sinon.stub(Date, 'now').returns(5000);

      const result = serviceInst.generateSession(
        mockUser,
        sessionId,
        credentials,
        tokenLogin,
        additionalInfo
      );

      test.chai.expect(result).to.eql({
        cookieDomain: true,
        cookieName: 'mockCookieName',
        httpsCookie: true,
        id: 1,
        info: {},
        origin: 'mockName',
        parentId: 1,
        permissionSetKey: 12345,
        timestamp: 5000,
        token: 'mockToken',
        type: 'mockType',
        user: 'mockUser',
      });

      stubDateNow.restore();
    });

    it('tests __initializeProfiles - throws error', async () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const initializers = [
        '__dataChangedQueue',
        '__initializeGroups',
        '__initializeCheckPoint',
        '__initializeUsers',
        '__initializeLookupTables',
      ];
      const mockConfig = {};
      const mockCallback = test.sinon.stub();

      initializers.forEach((initialize) => {
        serviceInst[initialize] = test.sinon.stub();
      });

      serviceInst.happn = {
        config: {
          disableDefaultAdminNetworkConnections: false,
        },
        services: {
          cache: 'mockCache',
          data: {
            pathField: 'mockPathField',
          },
          utils: {
            toMilliseconds: test.sinon.stub().throws(new Error('mock Error')),
          },
        },
      };
      serviceInst.initialize(mockConfig, mockCallback);

      test.chai.expect(mockConfig).to.eql({
        updateSubscriptionsOnSecurityDirectoryChanged: true,
        defaultNonceTTL: 60000,
        logSessionActivity: false,
        sessionActivityTTL: 86400000,
        pbkdf2Iterations: 10000,
        lockTokenToLoginType: true,
        cookieName: 'happn_token',
      });
    });

    it('tests __loginOK - removes user.password and calls callback', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockCallback = test.sinon.stub();
      const mockSessionId = 1;
      const mockAdminUser = { password: 'mockPassword', username: 'mockUsername' };
      serviceInst.users = {
        getUser: test.sinon.stub(),
      };
      serviceInst.users.getUser.callsFake((_, callback) => {
        callback(null, mockAdminUser);
      });

      serviceInst.generateSession = test.sinon.stub().returns('mock test');

      serviceInst.adminLogin(mockSessionId, mockCallback);

      test.chai.expect(mockAdminUser).to.eql({ username: 'mockUsername' });
      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mock test');
      test.chai
        .expect(serviceInst.generateSession)
        .to.have.been.calledWithExactly(
          { username: 'mockUsername' },
          1,
          { username: '_ADMIN' },
          undefined,
          undefined
        );
    });

    it('tests __loginOK - removes user.password and calls callback', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockCallback = test.sinon.stub();
      const mockSessionId = 1;
      const mockAdminUser = { password: 'mockPassword', username: 'mockUsername' };
      serviceInst.users = {
        getUser: test.sinon.stub(),
      };
      serviceInst.users.getUser.callsFake((_, callback) => {
        callback(null, mockAdminUser);
      });
      serviceInst.__locks = {
        remove: test.sinon.stub(),
      };
      serviceInst.generateSession = test.sinon.stub().returns('mock test');

      serviceInst.adminLogin(mockSessionId, mockCallback);

      test.chai.expect(mockAdminUser).to.eql({ username: 'mockUsername' });
      test.chai.expect(serviceInst.__locks.remove).to.have.been.calledWithExactly('mockUsername');
      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mock test');
      test.chai
        .expect(serviceInst.generateSession)
        .to.have.been.calledWithExactly(
          { username: 'mockUsername' },
          1,
          { username: '_ADMIN' },
          undefined,
          undefined
        );
    });

    it('tests __checkLockedOut returns false ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUsername = 'mockUsername';
      serviceInst.config = {
        accountLockout: { enabled: false },
      };

      const result = serviceInst.__checkLockedOut(mockUsername);

      test.chai.expect(result).to.be.false;
    });

    it('tests __checkLockedOut returns true ', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUsername = 'mockUsername';
      serviceInst.config = {
        accountLockout: { enabled: true, attempts: 1 },
      };

      serviceInst.__locks = {
        get: test.sinon.stub().returns({ attempts: 1 }),
      };

      const result = serviceInst.__checkLockedOut(mockUsername);

      test.chai.expect(result).to.be.true;
    });

    it('tests __loginFailed - checks if e has a message and overrideLockOut is true . Returns and calls callback', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUsername = 'mockUsername';
      const mockSpecificMessage = 'mockSpecificMessage';
      const mockError = { message: 'mockError' };
      const mockCallback = test.sinon.stub();
      const mockOverrideLockOut = true;

      serviceInst.config = {
        accountLockout: { enabled: true },
      };

      serviceInst.happn = {
        services: {
          error: {
            InvalidCredentialsError: test.sinon.stub().returns('mock test'),
          },
        },
      };

      serviceInst.__loginFailed(
        mockUsername,
        mockSpecificMessage,
        mockError,
        mockCallback,
        mockOverrideLockOut
      );

      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mock test');
    });

    it('tests __loginFailed - checks if e is true, config.accountLockout.enabled is true and if overrideLockout is false', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUsername = 'mockUsername';
      const mockSpecificMessage = null;
      const mockError = 'mockError';
      const mockCallback = test.sinon.stub();
      const mockOverrideLockOut = false;

      serviceInst.config = {
        accountLockout: { enabled: true },
      };

      serviceInst.happn = {
        services: {
          error: {
            InvalidCredentialsError: test.sinon.stub().returns('mock test'),
          },
        },
      };
      serviceInst.__locks = {
        get: test.sinon.stub().returns(null),
        set: test.sinon.stub(),
      };

      serviceInst.__loginFailed(
        mockUsername,
        mockSpecificMessage,
        mockError,
        mockCallback,
        mockOverrideLockOut
      );

      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mock test');
      test.chai
        .expect(serviceInst.happn.services.error.InvalidCredentialsError)
        .to.have.been.calledWithExactly('Invalid credentials: mockError');
    });

    it('tests __loginFailed - checks if e has a message and overrideLockOut true, currentLock is equal to true ] . Calls callback', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUsername = 'mockUsername';
      const mockSpecificMessage = 'mockSpecificMessage';
      const mockError = null;
      const mockCallback = test.sinon.stub();
      const mockOverrideLockOut = false;

      serviceInst.config = {
        accountLockout: { enabled: true },
      };

      serviceInst.__locks = {
        get: test.sinon.stub().returns(true),
        set: test.sinon.stub(),
      };

      serviceInst.happn = {
        services: {
          error: {
            InvalidCredentialsError: test.sinon.stub().returns('mock test'),
          },
        },
      };

      serviceInst.__loginFailed(
        mockUsername,
        mockSpecificMessage,
        mockError,
        mockCallback,
        mockOverrideLockOut
      );

      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mock test');
      test.chai
        .expect(serviceInst.happn.services.error.InvalidCredentialsError)
        .to.have.been.calledWithExactly('mockSpecificMessage');
    });

    it('tests __loginFailed - checks if e has a message and overrideLockOut true . Calls callback', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockUsername = 'mockUsername';
      const mockSpecificMessage = 'mockSpecificMessage';
      const mockError = null;
      const mockCallback = test.sinon.stub();
      const mockOverrideLockOut = true;

      serviceInst.config = {
        accountLockout: { enabled: true },
      };

      serviceInst.happn = {
        services: {
          error: {
            InvalidCredentialsError: test.sinon.stub().returns('mock test'),
          },
        },
      };

      serviceInst.__loginFailed(
        mockUsername,
        mockSpecificMessage,
        mockError,
        mockCallback,
        mockOverrideLockOut
      );

      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mock test');
      test.chai
        .expect(serviceInst.happn.services.error.InvalidCredentialsError)
        .to.have.been.calledWithExactly('mockSpecificMessage');
    });

    it('tests adminLogin - calls callback function and returns callback', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockSessionId = 1;
      const mockCallback = test.sinon.stub();

      serviceInst.users = {
        getUser: test.sinon.stub().callsFake((_, callback) => {
          callback('mockError');
        }),
      };

      serviceInst.adminLogin(mockSessionId, mockCallback);

      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
    });

    it('tests checkIPAddressWhitelistPolicy - checks if mongoFilter array length is zero', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockCredentials = {};
      const mockSessionId = 1;
      const mockRequest = {};
      let mockCallback;
      serviceInst.__cache_Profiles = {
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

      serviceInst.__cache_Profiles = {
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

      serviceInst.__cache_Profiles = {
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

      serviceInst.__cache_Profiles = {
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

      serviceInst.__cache_security_authentication_nonce = {
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

      serviceInst.__cache_security_authentication_nonce = {
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

    it('tests authorize - return and calls completeCall .Calls callback function with error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockSession = { id: 1, token: 1 };
      const mockPath = 'mockPath';
      const mockAction = {};
      const mockCallback = test.sinon.stub();

      serviceInst.config = {
        logSessionActivity: {},
      };
      serviceInst.__logSessionActivity = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, _____, ______, callback) => {
          callback('mockError');
        });
      serviceInst.__checkRevocations = test.sinon.stub().callsFake((_, authorize) => {
        authorize(null, null, null);
      });
      serviceInst.log = {
        warn: test.sinon.stub(),
      };

      serviceInst.authorize(mockSession, mockPath, mockAction, mockCallback);

      test.chai
        .expect(serviceInst.log.warn)
        .to.have.been.calledWithExactly('unable to log session activity: mockError');
      test.chai
        .expect(serviceInst.__logSessionActivity)
        .to.have.been.calledWithExactly(
          1,
          'mockPath',
          {},
          null,
          false,
          null,
          test.sinon.match.func
        );
      test.chai
        .expect(serviceInst.__checkRevocations)
        .to.have.been.calledWithExactly(1, test.sinon.match.func);
    });

    it('tests authorize - return and calls completeCall .Calls callback function with no error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockSession = { id: 1, token: 1 };
      const mockPath = 'mockPath';
      const mockAction = {};
      const mockCallback = test.sinon.stub();

      serviceInst.config = {
        logSessionActivity: {},
      };
      serviceInst.__logSessionActivity = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, _____, ______, callback) => {
          callback(null);
        });
      serviceInst.__checkRevocations = test.sinon.stub().callsFake((_, authorize) => {
        authorize(null, null, null);
      });
      serviceInst.log = {
        warn: test.sinon.stub(),
      };

      serviceInst.authorize(mockSession, mockPath, mockAction, mockCallback);

      test.chai
        .expect(serviceInst.__logSessionActivity)
        .to.have.been.calledWithExactly(
          1,
          'mockPath',
          {},
          null,
          false,
          null,
          test.sinon.match.func
        );
      test.chai
        .expect(serviceInst.__checkRevocations)
        .to.have.been.calledWithExactly(1, test.sinon.match.func);
    });

    it('tests authorize - return and calls completeCall .Calls callback function with no error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockSession = { id: 1, token: 1 };
      const mockPath = 'mockPath';
      const mockAction = {};
      const mockCallback = test.sinon.stub();

      serviceInst.__checkRevocations = test.sinon.stub().callsFake((_, authorize) => {
        authorize('mockError', null, null);
      });

      serviceInst.authorize(mockSession, mockPath, mockAction, mockCallback);

      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
      test.chai
        .expect(serviceInst.__checkRevocations)
        .to.have.been.calledWithExactly(1, test.sinon.match.func);
    });

    it('tests authorize - return and calls completeCall .Calls callback function with no error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockSession = { id: 1, token: 1 };
      const mockPath = 'mockPath';
      const mockAction = {};
      const mockCallback = test.sinon.stub();

      serviceInst.__checkRevocations = test.sinon.stub().callsFake((_, authorize) => {
        authorize(null, {}, null);
      });
      serviceInst.checkpoint = {
        _authorizeSession: test.sinon.stub().callsFake((_, __, ___, callback) => {
          callback('mockError', null, null, null);
        }),
      };

      serviceInst.authorize(mockSession, mockPath, mockAction, mockCallback);

      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
      test.chai
        .expect(serviceInst.__checkRevocations)
        .to.have.been.calledWithExactly(1, test.sinon.match.func);
      test.chai
        .expect(serviceInst.checkpoint._authorizeSession)
        .to.have.been.calledWithExactly({ id: 1, token: 1 }, 'mockPath', {}, test.sinon.match.func);
    });

    it('tests authorizauthorizeOnBehalfOf - calls this.__logSessionActivity and calls callback function with error', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });
      const mockSession = {
        id: 1,
        token: 1,
        user: {
          username: 'mockUsername',
        },
      };
      const mockPath = 'mockPath';
      const mockAction = 'mockAction';
      const mockOnBehalfOf = {};
      const mockCallback = test.sinon.stub();

      serviceInst.config = {
        logSessionActivity: true,
      };
      serviceInst.__logSessionActivity = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, _____, ______, callback) => {
          callback('mockError');
        });
      serviceInst.log = {
        warn: test.sinon.stub(),
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
          null,
          false,
          'session attempting to act on behalf of is not authorized',
          undefined
        );
      test.chai
        .expect(serviceInst.__logSessionActivity)
        .to.have.been.calledWithExactly(
          1,
          'mockPath',
          'mockAction',
          null,
          false,
          'session attempting to act on behalf of is not authorized',
          test.sinon.match.func
        );
      test.chai
        .expect(serviceInst.log.warn)
        .to.have.been.calledWithExactly('unable to log session activity: mockError');
    });

    it('tests authorizauthorizeOnBehalfOf - calls __getOnBehalfOfSession and calls callback function with error', () => {
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

      serviceInst.__getOnBehalfOfSession = test.sinon.stub().callsFake((_, __, callback) => {
        callback('mockError', null);
      });
      serviceInst.config = {
        logSessionActivity: true,
      };
      serviceInst.__logSessionActivity = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, _____, ______, callback) => {
          callback(null);
        });

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
        .expect(serviceInst.__logSessionActivity)
        .to.have.been.calledWithExactly(
          1,
          'mockPath',
          'mockAction',
          'mockError',
          false,
          'failed to get on behalf of session',
          test.sinon.match.func
        );
    });

    it('tests authorizauthorizeOnBehalfOf - calls __getOnBehalfOfSession and calls callback function with error', () => {
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

      serviceInst.__getOnBehalfOfSession = test.sinon.stub().callsFake((_, __, callback) => {
        callback(null, {});
      });
      serviceInst.config = {
        logSessionActivity: true,
      };
      serviceInst.__logSessionActivity = test.sinon
        .stub()
        .callsFake((_, __, ___, ____, _____, ______, callback) => {
          callback(null);
        });
      serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
        callback('mockError', null, null);
      });

      serviceInst.authorizeOnBehalfOf(
        mockSession,
        mockPath,
        mockAction,
        mockOnBehalfOf,
        mockCallback
      );

      test.chai
        .expect(mockCallback)
        .to.have.been.calledWithExactly('mockError', false, null, undefined);
      test.chai.expect(serviceInst.__getOnBehalfOfSession).to.have.been.calledWithExactly(
        {
          id: 1,
          token: 1,
          user: {
            username: '_ADMIN',
          },
        },
        {},
        test.sinon.match.func
      );
      test.chai
        .expect(serviceInst.__logSessionActivity)
        .to.have.been.calledWithExactly(
          1,
          'mockPath',
          'mockAction',
          'mockError',
          false,
          null,
          test.sinon.match.func
        );
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

      serviceInst.__cache_session_on_behalf_of = {
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

    it('tests __getOnBehalfOfSession - calls this.users.getUser . Calls callback function and returns callback with no error', () => {
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

      serviceInst.__cache_session_on_behalf_of = {
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

    it('tests __getOnBehalfOfSession - calls this.users.getUser . Calls callback function and returns callback with error', () => {
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

    it('tests stop', () => {
      const serviceInst = new SecurityService({
        logger: Logger,
      });

      const mockOptions = {};
      const mockCallback = test.sinon.stub();

      serviceInst.__locks = {
        stop: test.sinon.stub(),
      };
      serviceInst.__cache_session_activity = {
        stop: test.sinon.stub(),
      };
      serviceInst.checkpoint = {
        stop: test.sinon.stub(),
      };

      serviceInst.stop(mockOptions, mockCallback);

      test.chai.expect(mockCallback).to.have.callCount(1);
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
  }
);
