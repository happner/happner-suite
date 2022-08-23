const test = require('../../__fixtures/utils/test_helper').create();
describe.only(test.testName(__filename), function () {
  this.timeout(5000);
  const sinon = require('sinon');
  var expect = require('expect.js');
  var happnCommons = require('happn-commons');
  var async = happnCommons.async;
  var Logger = require('happn-logger');
  var EventEmitter = require('events').EventEmitter;
  var Checkpoint = require('../../../lib/services/security/checkpoint');

  const generatePermissionSetKey = (user) => {
    const permissionSetKey = require('crypto')
      .createHash('sha1')
      .update(Object.keys(user.groups).sort().join('/'))
      .digest('base64');
    return permissionSetKey;
  };

  var initializeCheckpoint = function (callback, config) {
    if (!config) config = {};

    var checkpoint = new Checkpoint({
      logger: Logger,
    });

    var CacheService = require('../../../lib/services/cache/service');
    var UtilsService = require('../../../lib/services/utils/service');

    var cacheServiceInst = new CacheService();
    var utilsServiceInst = new UtilsService();

    cacheServiceInst.initialize(function () {
      var happn = {
        services: {
          session: new EventEmitter(),
          utils: utilsServiceInst,
          security: {
            happn: {
              services: {
                utils: new UtilsService(),
              },
            },
            generatePermissionSetKey,
            users: {
              getUser: function (name, callback) {
                return callback(null, {
                  username: name,
                  groups: {
                    TEST1: {
                      permissions: {},
                    },
                    TEST2: {
                      permissions: {},
                    },
                  },
                });
              },
              attachPermissions: function (user) {
                return new Promise((resolve) => {
                  return resolve(user);
                });
              },
            },
            groups: {
              getGroup: function (name, opts, callback) {
                var returnGroup = {
                  name: name,
                  permissions: {},
                };

                if (name === 'TEST_GROUP')
                  returnGroup = {
                    name: 'TEST_GROUP',
                    permissions: {
                      '/test/group/explicit': {
                        action: ['set'],
                      },
                      '/test/group/*': {
                        action: ['*'],
                      },
                    },
                  };

                if (name === 'TEST_GROUP_1')
                  returnGroup = {
                    name: 'TEST_GROUP_1',
                    permissions: {
                      '/test/group/*': {
                        action: ['*'],
                      },
                    },
                  };

                if (name === 'TEST_GROUP_2')
                  returnGroup = {
                    name: 'TEST_GROUP_2',
                    permissions: {
                      '/test/explicit': {
                        actions: ['set'],
                      },
                      '/test/wild/*': {
                        actions: ['*'],
                      },
                    },
                  };

                if (name === 'TEST_GROUP_3')
                  returnGroup = {
                    name: 'TEST_GROUP_3',
                    permissions: {
                      '/test/wild/*': {
                        actions: ['*'],
                      },
                    },
                  };

                return callback(null, returnGroup);
              },
            },
          },
          cache: cacheServiceInst,
        },
      };

      Object.defineProperty(checkpoint, 'happn', {
        value: happn,
      });

      Object.defineProperty(cacheServiceInst, 'happn', {
        value: happn,
      });

      checkpoint.initialize(config, happn.services.security, function (e) {
        if (e) return callback(e);

        callback(null, checkpoint);
      });
    });
  };

  it('tests CheckPoint, String.prototype.count returns 0', () => {
    Checkpoint({
      logger: {
        createLogger: test.sinon.stub().returns({
          $$TRACE: test.sinon.stub(),
        }),
      },
    });

    test.chai.expect(String.prototype.count.call('hello', 'c')).to.equal(0);
    test.chai.expect(String.prototype.count.call('chello', 'c')).to.equal(1);
  });

  it('tests the security checkpoints __loadPermissionSet function', function (done) {
    var groups = {
      TEST_GROUP: {
        permissions: {
          '/test/group/explicit': {
            actions: ['set'],
          },
          '/test/group/*': {
            actions: ['*'],
          },
        },
      },
      TEST_GROUP_1: {
        permissions: {
          '/test/group/*': {
            actions: ['*'],
          },
        },
      },
    };

    var identity = {
      user: {
        groups: groups,
      },
    };

    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);
      checkpoint.__loadPermissionSet(identity, function (e, permissionSet) {
        if (e) return done(e);
        expect(permissionSet.search('/test/group/explicit')).to.eql(['*', 'set']);
        expect(permissionSet.search('/test/group/*')).to.eql(['*']);
        done();
      });
    });
  });

  it('tests the security checkpoints __createPermissionSet function', function (done) {
    var permissions = {
      '/test/group/explicit': {
        action: ['set'],
      },
      '/test/group/*': {
        action: ['*'],
      },
    };

    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);

      var permissionSet = checkpoint.__createPermissionSet(permissions);

      expect(permissionSet.search('/test/group/explicit')).to.eql(['*', 'set']);
      expect(permissionSet.search('/test/group/*')).to.eql(['*']);
      done();
    });
  });

  it('tests the security checkpoints __authorized function', function (done) {
    var groups = {
      TEST_GROUP_2: {
        permissions: {
          '/test/explicit': {
            actions: ['set'],
          },
          '/test/wild/*': {
            actions: ['*'],
          },
        },
      },
      TEST_GROUP_3: {
        permissions: {
          '/test/wild/*': {
            actions: ['*'],
          },
        },
      },
    };

    var identity = {
      user: {
        groups: groups,
      },
    };

    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);

      checkpoint.__loadPermissionSet(identity, function (e, permissionSet) {
        if (e) return done(e);

        expect(permissionSet.search('/test/explicit')).to.eql(['set']);
        expect(permissionSet.search('/test/wild/*')).to.eql(['*']);

        expect(checkpoint.__authorized(permissionSet, '/test/explicit/1', 'set')).to.be(false);
        expect(checkpoint.__authorized(permissionSet, '/test/explicit', 'set')).to.be(true);
        expect(checkpoint.__authorized(permissionSet, '/test/wild/blah', 'on')).to.be(true);
        expect(checkpoint.__authorized(permissionSet, '/test', 'get')).to.be(false);
        done();
      });
    });
  });

  it('tests caching in checkpoint, __permissionCache', function (done) {
    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);
      mockLookup(checkpoint, null, false);
      expect(
        checkpoint.__cache_checkpoint_authorization.get('TEST-SESSION-ID' + '/test/path' + 'set')
      ).to.be(null);

      //session, path, action, callback
      checkpoint._authorizeUser(
        {
          id: 'TEST-SESSION-ID',
          username: 'TEST',
          user: {
            groups: {
              TEST1: {
                permissions: {},
              },
              TEST2: {
                permissions: {},
              },
            },
          },
        },
        '/test/path',
        'set',
        function (e, authorized) {
          if (e) return done(e);

          expect(authorized).to.be(false);

          var cached = checkpoint.__cache_checkpoint_authorization.get(
            'TEST-SESSION-ID:/test/path:set'
          );

          expect(cached === false).to.be(true);

          checkpoint.clearCaches([
            {
              id: 'TEST-SESSION-ID',
            },
          ]);

          expect(
            checkpoint.__cache_checkpoint_authorization.get(
              'TEST-SESSION-ID' + '/test/path' + 'set'
            )
          ).to.be(null);

          done();
        }
      );
    });
  });

  it('tests caching in checkpoint, __permissionSets', function (done) {
    var testPermissionSetKey = require('crypto')
      .createHash('sha1')
      .update(['TEST1', 'TEST2'].join('/'))
      .digest('base64');

    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);
      mockLookup(checkpoint, null, false);
      expect(checkpoint.__checkpoint_permissionset.get(testPermissionSetKey)).to.be(null);
      const permissionSetKey = require('crypto')
        .createHash('sha1')
        .update(['TEST1', 'TEST2'].join('/'))
        .digest('base64');
      //session, path, action, callback
      checkpoint._authorizeUser(
        {
          permissionSetKey,
          id: 'TEST-SESSION-ID',
          username: 'TEST',
          user: {
            groups: {
              TEST1: {
                permissions: {},
              },
              TEST2: {
                permissions: {},
              },
            },
          },
        },
        '/test/path',
        'set',
        function (e, authorized) {
          if (e) return done(e);

          expect(authorized).to.be(false);

          var cached = checkpoint.__checkpoint_permissionset.get(testPermissionSetKey);

          expect(cached).to.not.be(null);

          checkpoint.clearCaches();

          expect(checkpoint.__checkpoint_permissionset.get(testPermissionSetKey)).to.be(null);

          done();
        }
      );
    });
  });

  it('tests caching in checkpoint, __permissionSets: isToken', function (done) {
    const user = {
      groups: {
        TEST1: {
          permissions: {},
        },
        TEST2: {
          permissions: {},
        },
      },
    };

    var testPermissionSetKey = generatePermissionSetKey(user);

    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);
      mockLookup(checkpoint, null, false);
      expect(checkpoint.__checkpoint_permissionset.get(testPermissionSetKey)).to.be(null);
      checkpoint._authorizeUser(
        {
          isToken: true,
          testPermissionSetKey,
          id: 'TEST-SESSION-ID',
          username: 'TEST',
          user,
        },
        '/test/path',
        'set',
        function (e, authorized) {
          if (e) return done(e);

          expect(authorized).to.be(false);

          var cached = checkpoint.__checkpoint_permissionset.get(testPermissionSetKey, 'TEST');
          expect(cached).to.be(null);

          cached = checkpoint.__checkpoint_permissionset_token.get(testPermissionSetKey, 'TEST');
          expect(cached).to.not.be(null);
          checkpoint.clearCaches();

          expect(checkpoint.__checkpoint_permissionset_token.get(testPermissionSetKey)).to.be(null);

          done();
        }
      );
    });
  });

  it('tests caching in checkpoint, authorization', function (done) {
    const authorizationKey = `TEST-SESSION-ID:/test/path:set`;
    const user = {
      groups: {
        TEST1: {
          permissions: {},
        },
        TEST2: {
          permissions: {},
        },
      },
    };
    var testPermissionSetKey = generatePermissionSetKey(user);
    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);
      mockLookup(checkpoint, null, false);
      expect(checkpoint.__cache_checkpoint_authorization.get(authorizationKey)).to.be(null);
      //session, path, action, callback
      checkpoint._authorizeUser(
        {
          testPermissionSetKey,
          id: 'TEST-SESSION-ID',
          username: 'TEST',
          user: {
            groups: {
              TEST1: {
                permissions: {},
              },
              TEST2: {
                permissions: {},
              },
            },
          },
        },
        '/test/path',
        'set',
        function (e, authorized) {
          if (e) return done(e);
          expect(authorized).to.be(false);
          var cached = checkpoint.__cache_checkpoint_authorization.get(authorizationKey);
          expect(cached).to.not.be(null);
          checkpoint.clearCaches();
          expect(checkpoint.__cache_checkpoint_authorization.get(authorizationKey)).to.be(null);
          done();
        }
      );
    });
  });

  it('tests caching in checkpoint, authorization: isToken', function (done) {
    const authorizationKey = `TEST-SESSION-ID:/test/path:set`;
    const user = {
      groups: {
        TEST1: {
          permissions: {},
        },
        TEST2: {
          permissions: {},
        },
      },
    };
    var testPermissionSetKey = generatePermissionSetKey(user);
    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);
      mockLookup(checkpoint, null, false);
      expect(checkpoint.__cache_checkpoint_authorization_token.get(authorizationKey)).to.be(null);
      checkpoint._authorizeUser(
        {
          isToken: true,
          testPermissionSetKey,
          id: 'TEST-SESSION-ID',
          username: 'TEST',
          user,
        },
        '/test/path',
        'set',
        function (e, authorized) {
          if (e) return done(e);

          expect(authorized).to.be(false);

          var cached = checkpoint.__cache_checkpoint_authorization.get(authorizationKey);
          expect(cached).to.be(null);

          cached = checkpoint.__cache_checkpoint_authorization_token.get(authorizationKey);
          expect(cached).to.not.be(null);
          checkpoint.clearCaches();

          expect(checkpoint.__cache_checkpoint_authorization_token.get(authorizationKey)).to.be(
            null
          );

          done();
        }
      );
    });
  });

  it('tests caching in checkpoint, cache size 5', function (done) {
    this.timeout(10000);
    initializeCheckpoint(
      function (e, checkpoint) {
        if (e) return done(e);
        mockLookup(checkpoint, null, false);

        async.timesSeries(
          10,
          function (time, timeCB) {
            var testPermissionSetKey = require('crypto')
              .createHash('sha1')
              .update(['TEST1', 'TEST2', 'TEST_TIME' + time].join('/'))
              .digest('base64');

            //session, path, action, callback
            let identity = {
              permissionSetKey: testPermissionSetKey,
              id: 'TEST-SESSION-ID' + time,
              user: {
                username: 'TEST' + time,
                groups: {
                  TEST1: {
                    permissions: {},
                  },
                  TEST2: {
                    permissions: {},
                  },
                },
              },
            };
            checkpoint._authorizeUser(identity, '/test/path', 'set', function (e, authorized) {
              if (e) return done(e);

              expect(authorized).to.be(false);

              var cached = checkpoint.__checkpoint_permissionset.get(
                testPermissionSetKey,
                identity.user.username
              );
              expect(cached).to.not.be(null);

              timeCB();
            });
          },
          function (e) {
            if (e) return done(e);

            expect(checkpoint.__cache_checkpoint_authorization.size()).to.be(5);

            done();
          }
        );
      },
      {
        __cache_checkpoint_authorization: {
          max: 5,
        },
      }
    );
  });

  it('tests caching in checkpoint, cache size 10', function (done) {
    initializeCheckpoint(
      function (e, checkpoint) {
        if (e) return done(e);
        mockLookup(checkpoint, null, false);

        async.timesSeries(
          10,
          function (time, timeCB) {
            var testPermissionSetKey = require('crypto')
              .createHash('sha1')
              .update(['TEST1', 'TEST2', 'TEST_TIME' + time].join('/'))
              .digest('base64');

            //session, path, action, callback
            let identity = {
              permissionSetKey: testPermissionSetKey,
              id: 'TEST-SESSION-ID' + time,
              user: {
                username: 'TEST' + time,
                groups: {
                  TEST1: {
                    permissions: {},
                  },
                  TEST2: {
                    permissions: {},
                  },
                },
              },
            };
            checkpoint._authorizeUser(identity, '/test/path', 'set', function (e, authorized) {
              if (e) return done(e);

              expect(authorized).to.be(false);

              var cached = checkpoint.__checkpoint_permissionset.get(
                testPermissionSetKey,
                identity.user.username
              );

              expect(cached).to.not.be(null);

              timeCB();
            });
          },
          function (e) {
            if (e) return done(e);
            expect(checkpoint.__cache_checkpoint_authorization.size()).to.be(10);
            done();
          }
        );
      },
      {
        __cache_checkpoint_authorization: {
          max: 10,
        },
      }
    );
  });

  it('it tests _authorizeSession function, early sync return on async callback', function (done) {
    this.timeout(60000);

    var checks = [];

    for (var i = 0; i < 1000000; i++) {
      checks.push({
        session: {
          policy: {},
        },
        path: 'test/path' + i,
        action: 'SET',
      });
    }

    var okCount = 0;

    initializeCheckpoint(function (e, checkpoint) {
      if (e) {
        return done(e);
      }

      checkpoint.__cache_checkpoint_authorization = {
        get: function () {
          return false;
        },
      };

      async.each(
        checks,
        function (check, checkCB) {
          checkpoint._authorizeSession(check.session, check.path, check.action, function (e) {
            if (e) {
              // do nothing
            } else {
              okCount++;
            }
            checkCB();
          });
        },
        function () {
          expect(okCount).to.be(1000000);
          done();
        }
      );
    });
  });

  it('it tests race condition in loadPermissionSet', function (done) {
    const identity = {
      user: {
        groups: {
          group1: {},
          group2: {},
          group3: {},
          group4: {},
        },
      },
    };
    const groups = [
      {
        permissions: {
          'test/1': {},
        },
      },
      null,
      {
        permissions: {
          'test/2': {},
        },
      },
      {
        permissions: {
          'test/3': {},
        },
      },
    ];
    initializeCheckpoint(function (e, checkpoint) {
      if (e) return done(e);
      checkpoint.__checkpoint_permissionset.get = () => {
        return null;
      };
      checkpoint.securityService.groups.getGroup = (groupName, opts, cb) => {
        return cb(null, groups.pop());
      };
      checkpoint.__loadPermissionSet(identity, (e, permissionSet) => {
        if (e) return done(e);
        expect(JSON.parse(JSON.stringify(permissionSet.tree))).to.eql({
          test: { 1: { $leaf: 'test/1' }, 2: { $leaf: 'test/2' }, 3: { $leaf: 'test/3' } },
        });
        done();
      });
    });
  });

  it('it tests _authorizeSession function, session has no policy', function (done) {
    this.timeout(60000);

    initializeCheckpoint(function (e, checkpoint) {
      if (e) {
        return done(e);
      }

      var testData = {
        session: {
          policy: {},
        },
        sessionNoPolicy: {},
        sessionWithType: {
          type: 1,
          policy: {
            1: {},
          },
        },
        sessionWithTtl: {
          timestamp: Date.now(),
          type: 1,
          policy: {
            1: { ttl: 1 },
          },
        },
        path: 'test/path',
        action: 'SET',
      };

      checkpoint.__cache_checkpoint_authorization = {
        get: function () {
          return false;
        },
      };

      checkpoint._authorizeSession(
        testData.session,
        testData.path,
        testData.action,
        function (e, authorised, reason) {
          expect(e).to.be(null);
          expect(authorised).to.be(false);
          expect(reason).to.be('no policy for session type');
          checkpoint._authorizeSession(
            testData.sessionNoPolicy,
            testData.path,
            testData.action,
            function (e, authorised, reason) {
              expect(e).to.be(null);
              expect(authorised).to.be(false);
              expect(reason).to.be('no policy attached to session');
              setTimeout(function () {
                checkpoint._authorizeSession(
                  testData.sessionWithTtl,
                  testData.path,
                  testData.action,
                  function (e, authorised, reason) {
                    expect(e).to.be(null);
                    expect(authorised).to.be(false);
                    expect(reason).to.be('expired session token');
                    checkpoint._authorizeSession(
                      testData.sessionWithType,
                      testData.path,
                      testData.action,
                      function (e, authorised) {
                        expect(e).to.be(null);
                        expect(authorised).to.be(true);
                        done();
                      }
                    );
                  }
                );
              }, 100);
            }
          );
        }
      );
    });
  });

  it('tests stop function, with properties', function () {
    const checkPointOpts = [
      '__checkpoint_permissionset',
      '__checkpoint_permissionset_token',
      '__cache_checkpoint_authorization',
      '__checkpoint_inactivity_threshold',
      '__checkpoint_usage_limit',
      '__cache_checkpoint_authorization_token',
    ];

    checkPointOpts.forEach((item) => {
      Checkpoint.prototype[item] = {
        clear: test.sinon.stub(),
      };
    });

    Checkpoint.prototype.stop();

    checkPointOpts.forEach((item) => {
      test.chai.expect(Checkpoint.prototype[item].clear).to.have.callCount(1);
    });
  });

  it('tests stop function, without properties', function () {
    const checkPointOpts = [
      '__checkpoint_permissionset',
      '__checkpoint_permissionset_token',
      '__cache_checkpoint_authorization',
      '__checkpoint_inactivity_threshold',
      '__checkpoint_usage_limit',
      '__cache_checkpoint_authorization_token',
    ];

    checkPointOpts.forEach((item) => {
      Checkpoint.prototype[item] = false;
    });

    Checkpoint.prototype.stop();

    checkPointOpts.forEach((item) => {
      test.chai.expect(Checkpoint.prototype[item]).to.not.haveOwnProperty('clear');
    });
  });

  it('tests __authorizedAction function, returns false', function () {
    const mockAction = 'mockAction';
    const mockPermission = {
      actions: ['action1'],
    };

    const result = Checkpoint.prototype.__authorizedAction(mockAction, mockPermission);

    test.chai.expect(result).to.be.false;
  });

  it('tests __authorizedAction function, returns true', function () {
    const mockAction = 'mockAction';
    const mockPermission = {
      actions: ['mockAction'],
    };

    const result = Checkpoint.prototype.__authorizedAction(mockAction, mockPermission);

    test.chai.expect(result).to.be.true;
  });

  it('tests listRelevantPermissions function, calls callback with permissions', function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns('mockAuthorization'),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: 'mockUser',
      isToken: false,
    };

    const mockWildcardPathSearch = test.sinon.stub().returns('mockPermissions');
    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);
    Checkpoint.prototype.__checkpoint_permissionset.get = test.sinon.stub().returns({
      wildcardPathSearch: mockWildcardPathSearch,
    });

    Checkpoint.prototype.listRelevantPermissions(mockSession, 'mockPath', 'mockAction', callback2);

    test.chai
      .expect(mockWildcardPathSearch)
      .to.have.been.calledWithExactly('mockPath', 'mockAction');
    test.chai.expect(callback2).to.have.been.calledWithExactly(null, 'mockPermissions');
  });

  it('tests listRelevantPermissions function, calls callback with error', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      groups: {
        getGroup: test.sinon.stub().callsFake((_, __, cb) => {
          cb('mockError');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns('mockAuthorization'),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
    };

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    Checkpoint.prototype.listRelevantPermissions(mockSession, 'mockPath', 'mockAction', callback2);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(callback2).to.have.been.calledWithExactly('mockError');
    test.chai.expect(callback2).to.have.callCount(1);
  });

  it('tests lookupAuthorize function, logs error and calls callback', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      lookupTables: {
        authorizeCallback: test.sinon.stub().callsFake((_, __, ___, cb) => {
          cb('mockError');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns('mockAuthorization'),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
    };

    Checkpoint.prototype.log = { warn: test.sinon.stub(), $$TRACE: test.sinon.stub() };

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    Checkpoint.prototype.lookupAuthorize(mockSession, 'mockPath', 'mockAction', callback2);

    test.chai.expect(Checkpoint.prototype.log.warn).to.have.been.calledWithExactly('mockError');
    test.chai.expect(callback2).to.have.been.calledWithExactly(null, false);
  });

  it('tests lookupAuthorize function, logs error and calls callback', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      lookupTables: {
        authorizeCallback: test.sinon.stub().callsFake((_, __, ___, cb) => {
          cb('mockError');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns('mockAuthorization'),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
    };

    Checkpoint.prototype.log = { warn: test.sinon.stub(), $$TRACE: test.sinon.stub() };

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    Checkpoint.prototype.lookupAuthorize(mockSession, 'mockPath', 'mockAction', callback2);

    test.chai.expect(Checkpoint.prototype.log.warn).to.have.been.calledWithExactly('mockError');
    test.chai.expect(callback2).to.have.been.calledWithExactly(null, false);
  });

  it('tests lookupAuthorize function, logs error and calls callback', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      lookupTables: {
        authorizeCallback: test.sinon.stub().callsFake((_, __, ___, cb) => {
          cb(null, 'mockAuthorized');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns({ set: test.sinon.stub() }),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
    };

    Checkpoint.prototype.log = { warn: test.sinon.stub(), $$TRACE: test.sinon.stub() };

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    Checkpoint.prototype.lookupAuthorize(mockSession, 'mockPath', 'mockAction', callback2);

    test.chai.expect(Checkpoint.prototype.log.warn).to.not.have.been.called;
    test.chai.expect(callback2).to.have.been.calledWithExactly(null, 'mockAuthorized');
  });

  it('tests _authorizeSession function, __checkInactivity is false', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      lookupTables: {
        authorizeCallback: test.sinon.stub().callsFake((_, __, ___, cb) => {
          cb(null, 'mockAuthorized');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon
            .stub()
            .returns({ set: test.sinon.stub(), get: test.sinon.stub().returns(23134324) }),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
      policy: {
        mockPolicy: {
          inactivity_threshold: 232323,
        },
      },
      type: 'mockPolicy',
    };

    const pushSpy = test.sinon.spy(Array.prototype, 'push');

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    const result = Checkpoint.prototype._authorizeSession(
      mockSession,
      'mockPath',
      'mockAction',
      callback2
    );

    test.chai.expect(result).to.equal(3);
    test.chai
      .expect(pushSpy)
      .to.have.been.calledWithExactly(null, false, 'session inactivity threshold reached');

    pushSpy.restore();
  });

  it('tests _authorizeSession function, __checkUsageLimit is false', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      lookupTables: {
        authorizeCallback: test.sinon.stub().callsFake((_, __, ___, cb) => {
          cb(null, 'mockAuthorized');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon
            .stub()
            .returns({ set: test.sinon.stub(), get: test.sinon.stub().returns(23134324) }),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
      policy: {
        mockPolicy: {
          inactivity_threshold: null,
          usage_limit: 13434,
        },
      },
      type: 'mockPolicy',
    };

    const pushSpy = test.sinon.spy(Array.prototype, 'push');

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    const result = Checkpoint.prototype._authorizeSession(
      mockSession,
      'mockPath',
      'mockAction',
      callback2
    );

    test.chai.expect(result).to.equal(3);
    test.chai
      .expect(pushSpy)
      .to.have.been.calledWithExactly(null, false, 'session usage limit reached');

    pushSpy.restore();
  });

  it.skip('tests _authorizeSession function, limited token permissions', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      lookupTables: {
        authorizeCallback: test.sinon.stub().callsFake((_, __, ___, cb) => {
          cb(null, 'mockAuthorized');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon
            .stub()
            .returns({ set: test.sinon.stub(), get: test.sinon.stub().returns(23134324) }),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
      policy: {
        mockPolicy: {
          permissions: true,
          inactivity_threshold: null,
          usage_limit: null,
        },
      },
      type: 'mockPolicy',
    };

    const pushSpy = test.sinon.spy(Array.prototype, 'push');

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    const result = Checkpoint.prototype._authorizeSession(
      mockSession,
      'mockPath',
      'mockAction',
      callback2
    );

    test.chai.expect(result).to.equal(3);
    test.chai
      .expect(pushSpy)
      .to.have.been.calledWithExactly(null, false, 'token permissions limited');

    pushSpy.restore();
  });

  it.only('tests _authorizeSession function, limited token permissions', async function () {
    const mockConfig = {};
    const mockSecurityService = {
      users: {
        attachPermissions: test.sinon.stub().resolves('preparedUser'),
      },
      lookupTables: {
        authorizeCallback: test.sinon.stub().callsFake((_, __, ___, cb) => {
          cb(null, 'mockAuthorized');
        }),
      },
    };
    const callback1 = test.sinon.stub();
    const callback2 = test.sinon.stub();

    Checkpoint.prototype.happn = {
      services: {
        cache: {
          create: test.sinon
            .stub()
            .returns({ set: test.sinon.stub(), get: test.sinon.stub().returns(23134324) }),
        },
        error: '',
        session: {
          on: test.sinon.stub(),
        },
        utils: {
          clone: test.sinon.stub(),
        },
      },
    };

    const mockSession = {
      id: 1,
      happn: 'happn',
      user: {
        groups: 'hello',
      },
      isToken: false,
      policy: {
        mockPolicy: {
          permissions: {
            mockPerm1: 'perm1',
            mockPerm2: 'perm2',
            mockPerm3: 'perm3',
          },
          inactivity_threshold: null,
          usage_limit: null,
        },
      },
      type: 'mockPolicy',
    };

    const pushSpy = test.sinon.spy(Array.prototype, 'push');

    Checkpoint.prototype.initialize(mockConfig, mockSecurityService, callback1);

    const result = Checkpoint.prototype._authorizeSession(
      mockSession,
      'mockPerm1',
      'mockAction',
      callback2
    );

    test.chai.expect(result).to.equal(4);
    test.chai.expect(pushSpy).to.have.been.calledWithExactly(null, true, null, true);

    pushSpy.restore();
  });

  function mockLookup(checkpoint, error, response) {
    checkpoint.securityService.lookupTables = {};
    checkpoint.securityService.lookupTables.authorizeCallback = sinon.stub();
    checkpoint.securityService.lookupTables.authorizeCallback.callsArgWith(3, error, response);
  }
});
