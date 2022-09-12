const test = require('../../__fixtures/utils/test_helper').create();
const SecurityGroups = require('../../../lib/services/security/groups');
const PermissionManager = require('../../../lib/services/security/permissions');

describe(test.testName(__filename, 3), function () {
  this.timeout(10000);
  var async = require('async');
  var Logger = require('happn-logger');
  const util = require('util');
  var Services = {};
  const CONSTANTS = require('../../../lib/').constants;
  const SD_EVENTS = CONSTANTS.SECURITY_DIRECTORY_EVENTS;

  Services.SecurityService = require('../../../lib/services/security/service');
  Services.CacheService = require('../../../lib/services/cache/service');
  Services.DataService = require('../../../lib/services/data/service');
  Services.CryptoService = require('../../../lib/services/crypto/service');
  Services.ProtocolService = require('../../../lib/services/protocol/service');
  Services.SubscriptionService = require('../../../lib/services/subscription/service');
  Services.PublisherService = require('../../../lib/services/publisher/service');
  Services.UtilsService = require('../../../lib/services/utils/service');
  Services.SessionService = require('../../../lib/services/session/service');
  Services.SystemService = require('../../../lib/services/system/service');
  Services.ErrorService = require('../../../lib/services/error/service');
  Services.LogService = require('../../../lib/services/log/service');

  var mockService = util.promisify(function (happn, serviceName, config, callback) {
    if (typeof config === 'function') {
      callback = config;
      if (config !== false) config = {};
    }

    try {
      var serviceClass = Services[serviceName + 'Service'];
      var serviceInstance = new serviceClass({
        logger: Logger,
      });
      serviceInstance.happn = happn;
      serviceInstance.config = config;
      happn.services[serviceName.toLowerCase()] = serviceInstance;
      if (typeof serviceInstance.initialize !== 'function' || config === false) return callback();
      serviceInstance.initialize(config, callback);
    } catch (e) {
      callback(e);
    }
  });

  var mockServices = function (callback) {
    var happn = {
      services: {},
      config: {},
    };

    mockService(happn, 'Crypto')
      .then(() => {
        return mockService(happn, 'Utils');
      })
      .then(() => {
        return mockService(happn, 'Log');
      })
      .then(() => {
        return mockService(happn, 'Error');
      })
      .then(() => {
        return mockService(happn, 'Session', false);
      })
      .then(() => {
        return mockService(happn, 'Protocol');
      })
      .then(() => {
        return mockService(happn, 'Publisher');
      })
      .then(() => {
        return mockService(happn, 'Data');
      })
      .then(() => {
        return mockService(happn, 'Cache');
      })
      .then(() => {
        return mockService(happn, 'System');
      })
      .then(() => {
        return mockService(happn, 'Security', {
          secure: true,
        });
      })
      .then(() => {
        return mockService(happn, 'Subscription');
      })
      .then(function () {
        happn.services.session.initializeCaches.bind(happn.services.session)(async (e) => {
          if (e) return callback(e);
          callback(null, happn);
        });
      })
      .catch(callback);
  };

  it('tests adding a group with no permissions', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_1',
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e, result) {
        if (e) return done(e);

        test.expect(result.name).to.be('TEST_GR_1');
        test.expect(result.permissions).to.eql(undefined);

        done();
      });
    });
  });

  it('tests adding a group with permissions', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_1',
        permissions: {
          '/test/with.a.dot': { actions: ['*'] },
          '/test/without/a/dot': { actions: ['*'] },
        },
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e, result) {
        if (e) return done(e);

        test.expect(result.name).to.be('TEST_GR_1');
        test.expect(result.permissions).to.eql(testGroup.permissions);

        done();
      });
    });
  });

  it('tests failing to add a group with permissions', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_1',
        permissions: {
          '/test/with.a.dot': { actions: ['*'] },
          '/test/without/a/dot': { actions: ['*'] },
        },
      };

      happn.services.security.groups.permissionManager.upsertMultiplePermissions = test.sinon
        .stub()
        .rejects(new Error('test error'));

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        test.expect(e.message).to.be('test error');
        done();
      });
    });
  });

  it('tests failing to add a group', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_1',
        permissions: {
          '/test/with.a.dot': { actions: ['*'] },
          '/test/without/a/dot': { actions: ['*'] },
        },
      };

      happn.services.security.groups.dataService.upsert = test.sinon
        .stub()
        .callsArgWith(2, new Error('test error'));

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        test.expect(e.message).to.be('test error');
        done();
      });
    });
  });

  it('fails adding a group, fails to attach permissions, invalid actions', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_2',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': ['get', 'on'],
        },
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        test
          .expect(e.toString())
          .to.be(
            'Error: group permissions invalid: missing allowed actions or prohibit rules: /test/path/2'
          );
        done();
      });
    });
  });

  it('tests upserting an undefined group', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      happn.services.security.groups.upsertGroup(undefined, function (e) {
        test.expect(e.message).to.be('group is null or not an object');
        done();
      });
    });
  });

  it('tests deleting an undefined group', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      happn.services.security.groups.deleteGroup(undefined, function (e) {
        test.expect(e.message).to.be('group is null or not an object');
        done();
      });
    });
  });

  it('adds a group with valid permissions', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_3',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        if (e) return done(e);

        happn.services.security.groups.getGroup(testGroup.name, function (e, fetchedGroup) {
          if (e) return done(e);

          test.expect(fetchedGroup.permissions['/test/path/1'].actions).to.eql(['*']);
          test.expect(fetchedGroup.permissions['/test/path/2'].actions).to.eql(['get', 'on']);

          done();
        });
      });
    });
  });

  it('adds a group with valid permissions, then adds further permissions, we check that the permissions have been merged in the fetched group', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_4',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        if (e) return done(e);

        happn.services.security.groups
          .upsertPermission(testGroup.name, '/test/path/*', 'get')
          .then(function () {
            happn.services.security.groups.getGroup(testGroup.name, function (e, fetchedGroup) {
              if (e) return done(e);

              test.expect(fetchedGroup.permissions['/test/path/1'].actions).to.eql(['*']);
              test.expect(fetchedGroup.permissions['/test/path/2'].actions).to.eql(['get', 'on']);
              test.expect(fetchedGroup.permissions['/test/path/*'].actions).to.eql(['get']);

              done();
            });
          })
          .catch(done);
      });
    });
  });

  it('does a whole bunch of edits to the same permissions in parallel, we then check all the correct permissions exist in the group', function (done) {
    var permissionCount = 1000;

    this.timeout(permissionCount * 10);

    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_5',
        permissions: {
          '/test/path/test': { actions: ['*'] },
          '/test/path/*': { actions: ['get', 'on'] },
        },
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        if (e) return done(e);

        var permissions = [];

        for (var permCounter = 0; permCounter < permissionCount; permCounter++)
          permissions.push('/test/path/' + permCounter.toString());

        async.each(
          permissions,
          function (permission, permissionCB) {
            happn.services.security.groups
              .upsertPermission(testGroup.name, permission, 'get')
              .then(function () {
                permissionCB();
              })
              .catch(done);
          },
          function (e) {
            if (e) return done(e);

            happn.services.security.groups.getGroup(testGroup.name, function (e, fetchedGroup) {
              if (e) return done(e);

              test.expect(fetchedGroup.permissions['/test/path/test'].actions).to.eql(['*']);
              test.expect(fetchedGroup.permissions['/test/path/*'].actions).to.eql(['get', 'on']);

              for (var permCounter = 0; permCounter < permissionCount; permCounter++)
                test
                  .expect(fetchedGroup.permissions['/test/path/' + permCounter.toString()].actions)
                  .to.eql(['get']);

              done();
            });
          }
        );
      });
    });
  });

  it('does a whole bunch of edits to the same group in parallel, we then check all the correct permissions exist in the group', function (done) {
    var permissionCount = 1000;

    this.timeout(permissionCount * 15);

    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_5',
        permissions: {
          '/test/path/test': { actions: ['*'] },
          '/test/path/*': { actions: ['get', 'on'] },
        },
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        if (e) return done(e);

        var permissions = [];

        for (var permCounter = 0; permCounter < permissionCount; permCounter++)
          permissions.push('/test/path/' + permCounter.toString());

        async.each(
          permissions,
          function (permission, permissionCB) {
            var updateGroup = {
              name: 'TEST_GR_5',
              permissions: {
                '/test/path/test': { actions: ['*'] },
                '/test/path/*': { actions: ['get', 'on'] },
              },
            };

            updateGroup.permissions[permission] = { actions: ['get'] };

            happn.services.security.groups.upsertGroup(updateGroup, permissionCB);
          },
          function (e) {
            if (e) return done(e);

            happn.services.security.groups.getGroup(testGroup.name, function (e, fetchedGroup) {
              if (e) return done(e);

              test.expect(fetchedGroup.permissions['/test/path/test'].actions).to.eql(['*']);
              test.expect(fetchedGroup.permissions['/test/path/*'].actions).to.eql(['get', 'on']);

              for (var permCounter = 0; permCounter < permissionCount; permCounter++)
                test
                  .expect(fetchedGroup.permissions['/test/path/' + permCounter.toString()].actions)
                  .to.eql(['get']);

              done();
            });
          }
        );
      });
    });
  });

  it('adds a group with valid permissions, removes a permission - we ensure the permission removal has worked', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_4',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      happn.services.security.groups.upsertGroup(testGroup, function (e) {
        if (e) return done(e);

        happn.services.security.groups
          .upsertPermission(testGroup.name, '/test/path/*', 'get')
          .then(function () {
            return happn.services.security.groups.removePermission(
              testGroup.name,
              '/test/path/*',
              'get'
            );
          })
          .then(function () {
            return happn.services.security.groups.removePermission(
              testGroup.name,
              '/test/path/2',
              'on'
            );
          })
          .then(function () {
            happn.services.security.groups.getGroup(testGroup.name, function (e, fetchedGroup) {
              if (e) return done(e);

              test.expect(fetchedGroup.permissions['/test/path/1'].actions).to.eql(['*']);
              test.expect(fetchedGroup.permissions['/test/path/2'].actions).to.eql(['get']);
              test.expect(fetchedGroup.permissions['/test/path/*']).to.be(undefined);

              done();
            });
          })
          .catch(done);
      });
    });
  });

  it('lists a bunch of groups', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup1 = {
        name: 'TEST_ALL_GR_10',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      var testGroup2 = {
        name: 'TEST_ALL_GR_20',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      var testGroup3 = {
        name: 'TEST_ALL_GR_30',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      var testGroup4 = {
        name: 'TEST_ALL_GR_40',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      happn.services.security.groups
        .upsertGroup(testGroup1)
        .then(function () {
          return happn.services.security.groups.upsertGroup(testGroup2);
        })
        .then(function () {
          return happn.services.security.groups.upsertGroup(testGroup3);
        })
        .then(function () {
          return happn.services.security.groups.upsertGroup(testGroup4);
        })
        .then(function () {
          happn.services.security.groups.listGroups('TEST_ALL_GR_*', function (e, fetchedGroups) {
            if (e) return done(e);

            test.expect(fetchedGroups.length).to.be(4);
            test.expect(fetchedGroups[0].name).to.not.be(null);
            test.expect(fetchedGroups[0].name).to.not.be(undefined);

            done();
          });
        })
        .catch(done);
    });
  });

  it('adds a group with valid permissions, the updates the group, prohibiting some actions - we check the prohibited permissions have been removed', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup = {
        name: 'TEST_GR_3',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      var testGroup1 = {
        name: 'TEST_GR_3',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { prohibit: ['on'] },
        },
      };

      happn.services.security.groups
        .upsertGroup(testGroup)
        .then(function () {
          return happn.services.security.groups.getGroup(testGroup.name);
        })
        .then(function (fetched) {
          test.expect(fetched.permissions['/test/path/1'].actions).to.eql(['*']);
          test.expect(fetched.permissions['/test/path/2'].actions).to.eql(['get', 'on']);
          return happn.services.security.groups.upsertGroup(testGroup1);
        })
        .then(function () {
          return happn.services.security.groups.getGroup(testGroup.name);
        })
        .then(function (fetched) {
          test.expect(fetched.permissions['/test/path/1'].actions).to.eql(['*']);
          test.expect(fetched.permissions['/test/path/2'].actions).to.eql(['get']);
          done();
        });
    });
  });

  it('tests the group caches', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      var testGroup1 = {
        name: 'TEST_ALL_GR_100',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      var testGroup2 = {
        name: 'TEST_ALL_GR_200',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      var testGroup3 = {
        name: 'TEST_ALL_GR_300',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      var testGroup4 = {
        name: 'TEST_ALL_GR_400',
        permissions: {
          '/test/path/1': { actions: ['*'] },
          '/test/path/2': { actions: ['get', 'on'] },
        },
      };

      happn.services.security.groups
        .upsertGroup(testGroup1)
        .then(function () {
          return happn.services.security.groups.upsertGroup(testGroup2);
        })
        .then(function () {
          return happn.services.security.groups.upsertGroup(testGroup3);
        })
        .then(function () {
          return happn.services.security.groups.upsertGroup(testGroup4);
        })
        .then(function () {
          return happn.services.security.groups.getGroup('TEST_ALL_GR_100');
        })
        .then(function () {
          return happn.services.security.groups.getGroup('TEST_ALL_GR_200');
        })
        .then(function () {
          return happn.services.security.groups.getGroup('TEST_ALL_GR_300');
        })
        .then(function () {
          return happn.services.security.groups.getGroup('TEST_ALL_GR_400');
        })
        .then(function () {
          return happn.services.security.groups.getGroup('_ADMIN');
        })
        .then(function () {
          return test.delay(1000);
        })
        .then(function () {
          test.expect(happn.services.security.groups.__cache_groups.keys().length).to.be(5); // 5 including _ADMIN
          test
            .expect(happn.services.security.groups.permissionManager.cache.keys().length)
            .to.be(5);
          happn.services.security.groups.clearCaches(SD_EVENTS.UPSERT_GROUP, {
            name: 'TEST_ALL_GR_100',
          });
          test.expect(happn.services.security.groups.__cache_groups.keys().length).to.be(4);
          test
            .expect(happn.services.security.groups.permissionManager.cache.keys().length)
            .to.be(4);
          happn.services.security.groups.clearCaches(SD_EVENTS.DELETE_GROUP, {
            obj: { name: 'TEST_ALL_GR_200' },
          });
          test.expect(happn.services.security.groups.__cache_groups.keys().length).to.be(3);
          test
            .expect(happn.services.security.groups.permissionManager.cache.keys().length)
            .to.be(3);
          happn.services.security.groups.clearCaches(SD_EVENTS.PERMISSION_UPSERTED, {
            groupName: 'TEST_ALL_GR_300',
          });
          test.expect(happn.services.security.groups.__cache_groups.keys().length).to.be(2);
          test
            .expect(happn.services.security.groups.permissionManager.cache.keys().length)
            .to.be(2);
          happn.services.security.groups.clearCaches(SD_EVENTS.PERMISSION_REMOVED, {
            groupName: 'TEST_ALL_GR_400',
          });
          test.expect(happn.services.security.groups.__cache_groups.keys().length).to.be(1);
          test
            .expect(happn.services.security.groups.permissionManager.cache.keys().length)
            .to.be(1);
          done();
        })
        .catch(done);
    });
  });

  it('tests unlinkGroup function, without options and calls callback with error', () => {
    const callback = test.sinon.stub();

    SecurityGroups.prototype.unlinkGroup('object', 'user', null, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'invalid group name: ' + undefined))
      );
  });

  it('tests unlinkGroup function, dataService.remove returns callback called with error', () => {
    const group = {
      name: 'mockName',
    };
    const user = { username: 'mockUsername' };
    const options = null;
    const callback = test.sinon.stub();

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns('mockCachedGroup'),
      set: test.sinon.stub(),
      remove: test.sinon.stub(),
    };

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().returns('mockCachedGroup'),
      upsert: test.sinon.stub(),
      remove: test.sinon.stub().callsFake((groupLinkPath, _, cb) => {
        test.chai
          .expect(groupLinkPath)
          .to.equal('/_SYSTEM/_SECURITY/_USER/' + user.username + '/_USER_GROUP/' + group.name);
        cb(new Error('test error'));
      }),
      extractData: test.sinon.stub(),
    };

    SecurityGroups.prototype.securityService = {
      users: {
        getUser: test.sinon.stub().callsFake((username, cb) => {
          cb(null, 'mockUser');
        }),
      },
    };

    SecurityGroups.prototype.unlinkGroup(group, user, options, callback);

    test.chai
      .expect(callback)
      .to.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests unlinkGroup function, securityService.dataChanged calls callback with result', () => {
    const group = {
      name: 'mockName',
      permissions: 'mockPermissions',
    };
    const user = { username: 'mockUsername' };
    const groupLinkPath =
      '/_SYSTEM/_SECURITY/_USER/' + user.username + '/_USER_GROUP/' + group.name;
    const options = null;
    const callback = test.sinon.stub();

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns('mockCachedGroup'),
      set: test.sinon.stub(),
      remove: test.sinon.stub(),
    };

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().returns('mockCachedGroup'),
      upsert: test.sinon.stub(),
      remove: test.sinon.stub().callsFake((groupLinkPath, _, cb) => {
        test.chai
          .expect(groupLinkPath)
          .to.equal('/_SYSTEM/_SECURITY/_USER/' + user.username + '/_USER_GROUP/' + group.name);
        cb(null, 'mockResult');
      }),
      extractData: test.sinon.stub(),
    };

    SecurityGroups.prototype.securityService = {
      users: {
        getUser: test.sinon.stub().callsFake((username, cb) => {
          cb(null, 'mockUser');
        }),
      },
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        test.chai.expect(_).to.equal(CONSTANTS.SECURITY_DIRECTORY_EVENTS.UNLINK_GROUP);
        test.chai.expect(__).to.eql({ path: groupLinkPath, permissions: group.permissions });
        test.chai.expect(___).to.eql({ username: 'mockUsername' });

        cb(null, 'mockUser');
      }),
    };

    SecurityGroups.prototype.unlinkGroup(group, user, options, callback);

    test.chai.expect(callback).to.have.been.calledWithExactly(null, 'mockResult');
  });

  it('tests unlinkGroup function, callback gets set to options', () => {
    const group = {
      name: 'mockName',
      permissions: 'mockPermissions',
    };
    const user = { username: 'mockUsername' };
    const groupLinkPath =
      '/_SYSTEM/_SECURITY/_USER/' + user.username + '/_USER_GROUP/' + group.name;
    const options = test.sinon.stub();
    const callback = null;

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns('mockCachedGroup'),
      set: test.sinon.stub(),
      remove: test.sinon.stub(),
    };

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().returns('mockCachedGroup'),
      upsert: test.sinon.stub(),
      remove: test.sinon.stub().callsFake((groupLinkPath, _, cb) => {
        test.chai
          .expect(groupLinkPath)
          .to.equal('/_SYSTEM/_SECURITY/_USER/' + user.username + '/_USER_GROUP/' + group.name);
        cb(null, 'mockResult');
      }),
      extractData: test.sinon.stub(),
    };

    SecurityGroups.prototype.securityService = {
      users: {
        getUser: test.sinon.stub().callsFake((username, cb) => {
          cb(null, 'mockUser');
        }),
      },
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        test.chai.expect(_).to.equal(CONSTANTS.SECURITY_DIRECTORY_EVENTS.UNLINK_GROUP);
        test.chai.expect(__).to.eql({ path: groupLinkPath, permissions: group.permissions });
        test.chai.expect(___).to.eql({ username: 'mockUsername' });

        cb(null, 'mockUser');
      }),
    };

    SecurityGroups.prototype.unlinkGroup(group, user, options, callback);

    test.chai.expect(options).to.have.been.calledWithExactly(null, 'mockResult');
  });

  it('tests unlinkGroup function', () => {
    const group = {
      name: 'mockName',
      permissions: 'mockPermissions',
    };
    const user = { username: 'mockUsername' };
    const groupLinkPath =
      '/_SYSTEM/_SECURITY/_USER/' + user.username + '/_USER_GROUP/' + group.name;
    const options = test.sinon.stub();
    const callback = null;

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns(null),
      set: test.sinon.stub(),
      remove: test.sinon.stub(),
    };

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().callsFake((_, __, cb) => {
        cb();
      }),
      upsert: test.sinon.stub(),
      remove: test.sinon.stub().callsFake((groupLinkPath, _, cb) => {
        test.chai
          .expect(groupLinkPath)
          .to.equal('/_SYSTEM/_SECURITY/_USER/' + user.username + '/_USER_GROUP/' + group.name);
        cb(null, 'mockResult');
      }),
      extractData: test.sinon.stub(),
    };

    SecurityGroups.prototype.securityService = {
      users: {
        getUser: test.sinon.stub().callsFake((username, cb) => {
          cb(null, 'mockUser');
        }),
      },
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        test.chai.expect(_).to.equal(CONSTANTS.SECURITY_DIRECTORY_EVENTS.UNLINK_GROUP);
        test.chai.expect(__).to.eql({ path: groupLinkPath, permissions: group.permissions });
        test.chai.expect(___).to.eql({ username: 'mockUsername' });

        cb(null, 'mockUser');
      }),
    };

    SecurityGroups.prototype.unlinkGroup(group, user, options, callback);
  });

  it('tests initialize function, callback gets callsed with error', () => {
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub().callsFake((_, __, cb) => {
            test.chai.expect(_).to.equal(0);
            test.chai.expect(__).to.eql({
              name: 'volatile_permissions',
              provider: 'memory',
              settings: {},
              patterns: ['/_SYSTEM/_SECURITY/_PERMISSIONS/*'],
            });

            cb(new Error('test error'));
          }),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests initialize function, calls _this.dataService.addDataProviderPatterns', () => {
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub().callsFake((_, __, cb) => {
            test.chai.expect(_).to.equal(0);
            test.chai.expect(__).to.eql({
              name: 'volatile_permissions',
              provider: 'memory',
              settings: {},
              patterns: ['/_SYSTEM/_SECURITY/_PERMISSIONS/*'],
            });

            cb();
          }),
          addDataProviderPatterns: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    test.chai
      .expect(SecurityGroups.prototype.happn.services.data.addDataProviderPatterns)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_GROUP', [
        '/_SYSTEM/_SECURITY/_PERMISSIONS/_*',
      ]);
    test.chai.expect(callback).to.have.been.calledWithExactly();
    test.chai.expect(callback).to.have.callCount(1);
  });

  it('tests initialize function, calls _this.dataService.addDataProviderPatterns', () => {
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub().callsFake((_, __, cb) => {
            test.chai.expect(_).to.equal(0);
            test.chai.expect(__).to.eql({
              name: 'volatile_permissions',
              provider: 'memory',
              settings: {},
              patterns: ['/_SYSTEM/_SECURITY/_PERMISSIONS/*'],
            });

            cb();
          }),
          addDataProviderPatterns: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    test.chai
      .expect(SecurityGroups.prototype.happn.services.data.addDataProviderPatterns)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_GROUP', [
        '/_SYSTEM/_SECURITY/_PERMISSIONS/_*',
      ]);
    test.chai.expect(callback).to.have.been.calledWithExactly();
    test.chai.expect(callback).to.have.callCount(1);
  });

  it('tests listPermissions function', () => {
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon.stub(PermissionManager, 'create').returns({
      listPermissions: test.sinon.stub().returns('mockList'),
    });

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);
    const result = SecurityGroups.prototype.listPermissions('mockGroupName');

    test.chai.expect(result).to.equal('mockList');

    permManagerStub.restore();
  });

  it('tests deleteGroup function, successfully deletes a group', () => {
    const group = {
      name: 'mockName',
    };
    const options = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const removeStub = test.sinon.stub();

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns({ name: 'mockName' }),
    };

    SecurityGroups.prototype.securityService = {
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        cb();
      }),
    };

    removeStub.onCall(0).callsFake((_, __, cb) => {
      test.chai.expect(_).to.equal('/_SYSTEM/_SECURITY/_PERMISSIONS/' + group.name + '/*');
      test.chai.expect(__).to.eql({});
      cb(null, 'permissionsDeleteResults');
    });
    removeStub.onCall(1).callsFake((_, __, cb) => {
      cb(null, 'userGroupDeleteResults');
    });
    removeStub.onCall(2).callsFake((_, __, cb) => {
      cb(null, {
        data: {
          removed: 'mockRemoved',
        },
      });
    });

    SecurityGroups.prototype.dataService = {
      remove: removeStub,
    };

    SecurityGroups.prototype.log = {
      debug: test.sinon.stub(),
    };

    SecurityGroups.prototype.deleteGroup(group, options, callback);

    test.chai.expect(SecurityGroups.prototype.dataService.remove).to.have.callCount(3);
    test.chai
      .expect(SecurityGroups.prototype.log.debug)
      .to.have.been.calledWithExactly(`group deleted: ${group.name}`);

    test.chai.expect(options).to.have.been.calledWithExactly(null, {
      removed: 'mockRemoved',
      obj: group,
      links: 'userGroupDeleteResults',
      permissions: 'permissionsDeleteResults',
    });
  });

  it('tests deleteGroup function, dataService.remove first call calls callback with error', () => {
    const group = {
      name: 'mockName',
    };
    const options = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const removeStub = test.sinon.stub();

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns({ name: 'mockName' }),
    };

    SecurityGroups.prototype.securityService = {
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        cb();
      }),
    };

    removeStub.onCall(0).callsFake((_, __, cb) => {
      test.chai.expect(_).to.equal('/_SYSTEM/_SECURITY/_PERMISSIONS/' + group.name + '/*');
      test.chai.expect(__).to.eql({});
      cb(new Error('test error'), null);
    });

    SecurityGroups.prototype.dataService = {
      remove: removeStub,
    };

    SecurityGroups.prototype.log = {
      debug: test.sinon.stub(),
    };

    SecurityGroups.prototype.deleteGroup(group, options, callback);

    test.chai.expect(SecurityGroups.prototype.dataService.remove).to.have.callCount(1);

    test.chai
      .expect(options)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests deleteGroup function, dataService.remove second call calls callback with error', () => {
    const group = {
      name: 'mockName',
    };
    const options = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const removeStub = test.sinon.stub();

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns({ name: 'mockName' }),
    };

    SecurityGroups.prototype.securityService = {
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        cb();
      }),
    };

    removeStub.onCall(0).callsFake((_, __, cb) => {
      test.chai.expect(_).to.equal('/_SYSTEM/_SECURITY/_PERMISSIONS/' + group.name + '/*');
      test.chai.expect(__).to.eql({});
      cb(null, 'userGroupDeleteResults');
    });
    removeStub.onCall(1).callsFake((_, __, cb) => {
      cb(new Error('test error'), null);
    });

    SecurityGroups.prototype.dataService = {
      remove: removeStub,
    };

    SecurityGroups.prototype.log = {
      debug: test.sinon.stub(),
    };

    SecurityGroups.prototype.deleteGroup(group, options, callback);

    test.chai.expect(SecurityGroups.prototype.dataService.remove).to.have.callCount(2);

    test.chai
      .expect(options)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests deleteGroup function, dataService.remove third call calls callback with error', () => {
    const group = {
      name: 'mockName',
    };
    const options = null;
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const removeStub = test.sinon.stub();

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns({ name: 'mockName' }),
    };

    SecurityGroups.prototype.securityService = {
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        cb();
      }),
    };

    removeStub.onCall(0).callsFake((_, __, cb) => {
      test.chai.expect(_).to.equal('/_SYSTEM/_SECURITY/_PERMISSIONS/' + group.name + '/*');
      test.chai.expect(__).to.eql({});
      cb(null, 'userGroupDeleteResults');
    });
    removeStub.onCall(1).callsFake((_, __, cb) => {
      cb(null, 'permissionsDeleteResults');
    });
    removeStub.onCall(2).callsFake((_, __, cb) => {
      cb(new Error('test error'), null);
    });

    SecurityGroups.prototype.dataService = {
      remove: removeStub,
    };

    SecurityGroups.prototype.log = {
      debug: test.sinon.stub(),
    };

    SecurityGroups.prototype.deleteGroup(group, options, callback);

    test.chai.expect(SecurityGroups.prototype.dataService.remove).to.have.callCount(3);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests deleteGroup function, fails to delete group, getGroup fails to find group', () => {
    const group = {
      name: 'mockName',
    };
    const options = null;
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const removeStub = test.sinon.stub();

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns(null),
    };

    SecurityGroups.prototype.securityService = {
      dataChanged: test.sinon.stub().callsFake((_, __, ___, cb) => {
        cb();
      }),
    };

    SecurityGroups.prototype.dataService = {
      remove: removeStub,
      get: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
    };

    SecurityGroups.prototype.log = {
      debug: test.sinon.stub(),
    };

    SecurityGroups.prototype.deleteGroup(group, options, callback);

    test.chai.expect(SecurityGroups.prototype.dataService.remove).to.have.callCount(0);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests linkGroup function, fails to list group, throws error when validating', () => {
    const group = {
      name: 'mockName',
    };
    const user = 'mockUser';
    const options = null;
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const removeStub = test.sinon.stub();

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns(null),
    };

    SecurityGroups.prototype.dataService = {
      remove: removeStub,
      upsert: test.sinon.stub(),
      get: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
    };

    SecurityGroups.prototype.linkGroup(group, options, user, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(SecurityGroups.prototype.dataService.remove).to.not.have.been.called;
  });

  it('tests linkGroup function, fails to list groups, dataService.upsert calls callback with error', () => {
    const group = {
      name: 'mockName',
    };
    const user = 'mockUser';
    const options = [null, { username: 'mockUsername' }];
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {
      users: {
        getUser: test.sinon.stub().callsFake((_, cb) => {
          cb(null, 'mockUser');
        }),
      },
    };
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns('mockGroups'),
    };

    SecurityGroups.prototype.dataService = {
      upsert: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
    };

    SecurityGroups.prototype.linkGroup(group, options, user, callback);

    test.chai.expect(mockSecurityService.users.getUser).to.have.callCount(1);
    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests linkGroup function, fails to list group, throws error when validating', () => {
    const group = {
      name: 'mockName',
    };
    const user = 'mockUser';
    const options = null;
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const removeStub = test.sinon.stub();

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns(null),
    };

    SecurityGroups.prototype.dataService = {
      remove: removeStub,
      upsert: test.sinon.stub(),
      get: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
    };

    SecurityGroups.prototype.linkGroup(group, options, user, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(SecurityGroups.prototype.dataService.remove).to.not.have.been.called;
  });

  it('tests __validate function, callback gets called with error', () => {
    const group = {
      name: 'mockName',
    };
    const user = 'mockUser';
    const options = [null, { username: 'mockUsername' }];
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {
      users: {
        getUser: test.sinon.stub().callsFake((_, cb) => {
          cb(new Error('test error'));
        }),
      },
    };
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns('mockGroups'),
    };

    SecurityGroups.prototype.dataService = {
      upsert: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
    };

    SecurityGroups.prototype.linkGroup(group, options, user, callback);

    test.chai.expect(mockSecurityService.users.getUser).to.have.callCount(1);
    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
  });

  it('tests __validate function, callback gets called with error, user does not exist or has not been saved', () => {
    const group = {
      name: 'mockName',
    };
    const user = 'mockUser';
    const options = [null, { username: 'mockUsername' }];
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {
      users: {
        getUser: test.sinon.stub().callsFake((_, cb) => {
          cb(null, null);
        }),
      },
    };
    const callback = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.__cache_groups = {
      get: test.sinon.stub().returns('mockGroups'),
    };

    SecurityGroups.prototype.dataService = {
      upsert: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
    };

    SecurityGroups.prototype.linkGroup(group, options, user, callback);

    test.chai.expect(mockSecurityService.users.getUser).to.have.callCount(1);
    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              'validation error: user does not exist or has not been saved'
            )
          )
      );
  });

  it('tests listGroups function, successfully lists groups', () => {
    const groupName = test.sinon.stub();
    const options = null;
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon
      .stub(PermissionManager.prototype, 'attachPermissions')
      .returns('mockGroup');

    const pushSpy = test.sinon.spy(Array.prototype, 'push');

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().callsFake((_, __, cb) => {
        cb(null, 'mockGroup');
      }),
      extractData: test.sinon.stub().returns(['mockGroup']),
    };

    SecurityGroups.prototype.listGroups(groupName, options, callback);

    test.chai.expect(callback).to.have.callCount(0);
    test.chai.expect(SecurityGroups.prototype.dataService.get).to.have.callCount(1);
    test.chai.expect(pushSpy).to.have.been.calledWithExactly('mockGroup');
    test.chai.expect(permManagerStub).to.have.been.calledWithExactly('mockGroup');

    permManagerStub.restore();
    pushSpy.restore();
  });

  it('tests listGroups function, calls callback with data and returns', () => {
    const groupName = 'mockGroupName';
    const options = {
      limit: 1,
      skip: 1,
      collation: 1,
      count: 1,
    };
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon
      .stub(PermissionManager.prototype, 'attachPermissions')
      .returns('mockGroup');

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.dataService = {
      count: test.sinon.stub().callsFake((_, __, cb) => {
        test.chai.expect(_).to.equal('/_SYSTEM/_SECURITY/_GROUP/mockGroupName*');
        test.chai.expect(__).to.eql({
          criteria: {},
          sort: { path: 1 },
          options: { limit: 1, skip: 1, collation: 1 },
        });

        cb(null, { data: 'mockData' });
      }),
    };

    const result = SecurityGroups.prototype.listGroups(groupName, options, callback);

    test.chai.expect(callback).to.have.been.calledOnceWithExactly(null, 'mockData');
    test.chai.expect(SecurityGroups.prototype.dataService.count).to.have.callCount(1);
    test.chai.expect(result).to.have.returned;

    permManagerStub.restore();
  });

  it('tests listGroups function, dataService.count calls callback with error', () => {
    const groupName = 'mockGroupName';
    const options = {
      limit: 1,
      skip: 1,
      collation: 1,
      count: 1,
    };
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon
      .stub(PermissionManager.prototype, 'attachPermissions')
      .returns('mockGroup');

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.dataService = {
      count: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
    };

    const result = SecurityGroups.prototype.listGroups(groupName, options, callback);

    test.chai
      .expect(callback)
      .to.have.been.calledOnceWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(result).to.have.returned;

    permManagerStub.restore();
  });

  it('tests listGroups function, dataService.get calls callback with error', () => {
    const groupName = 'mockGroupName';
    const options = null;
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().callsFake((_, __, cb) => {
        cb(new Error('test error'));
      }),
      extractData: test.sinon.stub().returns(['mockGroup']),
    };

    SecurityGroups.prototype.listGroups(groupName, options, callback);

    test.chai.expect(callback).to.have.callCount(1);
    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(SecurityGroups.prototype.dataService.get).to.have.callCount(1);
  });

  it('tests listGroups function, dataService.get calls callback with extracted ', () => {
    const groupName = 'mockGroupName';
    const options = {
      skipPermissions: true,
    };
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().callsFake((_, __, cb) => {
        cb(null, 'mockGroup');
      }),
      extractData: test.sinon.stub().returns(['mockGroup']),
    };

    SecurityGroups.prototype.listGroups(groupName, options, callback);

    test.chai.expect(callback).to.have.callCount(1);
    test.chai.expect(callback).to.have.been.calledWithExactly(null, ['mockGroup']);
    test.chai.expect(SecurityGroups.prototype.dataService.get).to.have.callCount(1);
  });

  it('tests listGroups function, catches error and calls callback with error', () => {
    const groupName = 'mockGroupName';
    const options = {
      skipPermissions: true,
      criteria: 1,
      sort: 1,
    };
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    SecurityGroups.prototype.dataService = {
      get: test.sinon.stub().throws(new Error('test error')),
    };

    SecurityGroups.prototype.listGroups(groupName, options, callback);

    test.chai.expect(callback).to.have.callCount(1);
    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(SecurityGroups.prototype.dataService.get).to.have.callCount(1);
  });

  it('tests clearCaches function, this.permissionManager is null', () => {
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const mockClear = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns({
            clear: mockClear,
          }),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon.stub(PermissionManager, 'create').returns(null);

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    const result = SecurityGroups.prototype.clearCaches();

    test.chai.expect(result).to.have.returned;
    test.chai.expect(mockClear).to.have.callCount(1);

    permManagerStub.restore();
  });

  it('tests clearCaches function, removes group UPSERT_GROUP or DELETE_GROUP', async () => {
    const changedData = {
      name: 'mockName',
      groupName: 'mockGroupName',
      obj: {
        name: 'objName',
      },
    };
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const mockClear = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns({
            clear: mockClear,
            remove: test.sinon.stub(),
          }),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon.stub(PermissionManager, 'create').returns(null);

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    const result = SecurityGroups.prototype.clearCaches(SD_EVENTS.UPSERT_GROUP, changedData);

    await test.chai.expect(result).to.eventually.equal(undefined);
    test.chai
      .expect(SecurityGroups.prototype.__cache_groups.remove)
      .to.have.been.calledWithExactly(changedData.name);

    permManagerStub.restore();
  });

  it('tests clearCaches function, removes group PERMISSION_UPSERTED or PERMISSION_REMOVED', async () => {
    const changedData = {
      name: 'mockName',
      groupName: 'mockGroupName',
      obj: {
        name: 'objName',
      },
    };
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const mockClear = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns({
            clear: mockClear,
            remove: test.sinon.stub(),
          }),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon.stub(PermissionManager, 'create').returns(null);

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    const result = SecurityGroups.prototype.clearCaches(SD_EVENTS.PERMISSION_UPSERTED, changedData);

    await test.chai.expect(result).to.eventually.equal(undefined);
    test.chai
      .expect(SecurityGroups.prototype.__cache_groups.remove)
      .to.have.been.calledWithExactly(changedData.groupName);

    permManagerStub.restore();
  });

  it('tests clearCaches function, catches error and rejects', async () => {
    const changedData = {
      name: 'mockName',
      groupName: 'mockGroupName',
      obj: {
        name: 'objName',
      },
    };
    const callback = test.sinon.stub();
    const mockConfig = {
      persistPermissions: false,
      __cache_groups: {
        max: 5e3,
        maxAge: 0,
      },
    };
    const mockSecurityService = {};
    const mockClear = test.sinon.stub();

    SecurityGroups.prototype.happn = {
      services: {
        cache: {
          create: test.sinon.stub().returns({
            clear: mockClear,
            remove: test.sinon.stub().throws(new Error('test error')),
          }),
        },
        data: {
          _insertDataProvider: test.sinon.stub(),
        },
        utils: '',
        error: '',
        crypto: '',
        session: '',
      },
    };

    const permManagerStub = test.sinon.stub(PermissionManager, 'create').returns(null);

    SecurityGroups.prototype.initialize(mockConfig, mockSecurityService, callback);

    const result = SecurityGroups.prototype.clearCaches(SD_EVENTS.UPSERT_GROUP, changedData);

    await test.chai.expect(result).to.eventually.be.rejectedWith(Error, 'test error');

    permManagerStub.restore();
  });
});
