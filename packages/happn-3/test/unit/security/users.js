require('../../__fixtures/utils/test_helper').describe({ timeout: 120000 }, function (test) {
  var Logger = require('happn-logger');
  const util = require('util');
  var Services = {};
  const SecurityUsers = require('../../../lib/services/security/users');
  const PermissionsManager = require('../../../lib/services/security/permissions');
  const UsersByGroupCache = require('../../../lib/services/security/users-by-group-cache');

  function stubBindInEachGroup(users) {
    const groupsList = [
      'unlinkGroup',
      'linkGroup',
      'getGroup',
      'listGroups',
      'deleteGroup',
      'upsertGroup',
    ];

    users.groups = {};

    groupsList.forEach((bind) => {
      users.groups[bind] = test.sinon.stub();
    });
  }
  let mockHappn;
  let mockConfig;
  beforeEach(() => {
    mockHappn = {
      services: {
        cache: { create: test.sinon.stub() },
        data: {
          get: test.sinon.stub(),
          upsert: test.sinon.stub(),
          remove: test.sinon.stub(),
          count: test.sinon.stub(),
        },
        utils: { clone: test.sinon.stub() },
        error: {},
        crypto: { generateHash: test.sinon.stub() },
        session: {},
      },
    };
    mockConfig = {
      __cache_groups_by_user: null,
      __cache_users: {},
      __cache_users_by_groups: {},
      usernamesCaseInsensitive: {},
      usernamesCaseInsensitiveExclude: null,
    };
  });

  afterEach(() => {
    mockHappn = null;
    mockConfig = null;
  });

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

      serviceInstance.initialize(config, function () {
        //console.log(`service ${serviceName} initialized...`);
        callback();
      });
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
      .then(mockService(happn, 'Utils'))
      .then(mockService(happn, 'Log'))
      .then(mockService(happn, 'Error'))
      .then(mockService(happn, 'Session', false))
      .then(mockService(happn, 'Protocol'))
      .then(mockService(happn, 'Publisher'))
      .then(mockService(happn, 'Data'))
      .then(mockService(happn, 'Cache'))
      .then(mockService(happn, 'System'))
      .then(mockService(happn, 'Security'))
      .then(mockService(happn, 'Subscription'))
      .then(function () {
        happn.services.session.initializeCaches.bind(happn.services.session)(function (e) {
          if (e) return callback(e);
          callback(null, happn);
        });
      })
      .catch(callback);
  };

  function createUsersAndGroups(happn, callback) {
    let done = (e) => {
      if (e) return callback(e);
      setTimeout(callback, 1000);
    };
    var upsertedGroups = [];
    var upsertedUsers = [];

    var groups = [];
    var users = [];

    for (var ii = 0; ii < 10; ii++) groups.push({ name: 'test_' + ii });

    for (var i = 0; i < 10; i++)
      users.push({
        username: 'test_' + i,
        password: 'test_' + i,
        custom_data: { role: 'OEM Admin', extra: i },
      });

    test.async.each(
      groups,
      function (group, groupCB) {
        happn.services.security.groups.upsertGroup(group, function (e, upsertedGroup) {
          if (e) return groupCB(e);

          upsertedGroups.push(upsertedGroup);

          groupCB();
        });
      },
      function (e) {
        if (e) return done(e);

        test.async.each(
          users,
          function (user, userCB) {
            happn.services.security.users.upsertUser(user, function (e, upsertedUser) {
              if (e) return userCB(e);

              upsertedUsers.push(upsertedUser);

              userCB();
            });
          },
          function (e) {
            if (e) return done(e);

            test.async.each(
              upsertedUsers,
              function (upsertedUser, upsertedUserCB) {
                test.async.each(
                  upsertedGroups,
                  function (upsertedGroup, upsertedGroupCB) {
                    happn.services.security.groups.linkGroup(
                      upsertedGroup,
                      upsertedUser,
                      upsertedGroupCB
                    );
                  },
                  upsertedUserCB
                );
              },
              done
            );
          }
        );
      }
    );
  }

  it('tests upserting an undefined user', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      happn.services.security.users.upsertUser(undefined, function (e) {
        test.expect(e.message).to.be('user is null or not an object');
        done();
      });
    });
  });

  it('tests deleting an undefined user', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      happn.services.security.users.deleteUser(undefined, function (e) {
        test.expect(e.message).to.be('user is null or not an object');
        done();
      });
    });
  });

  it('tests deleting a reserved user', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      happn.services.security.users.deleteUser({ username: '_ANONYMOUS' }, function (e) {
        test.expect(e.message).to.be('unable to delete a user with the reserved name: _ANONYMOUS');
        happn.services.security.users.deleteUser({ username: '_ADMIN' }, function (e) {
          test.expect(e.message).to.be('unable to delete a user with the reserved name: _ADMIN');
          done();
        });
      });
    });
  });

  it('tests deleting an undefined user - promise', function (done) {
    mockServices(async (e, happn) => {
      try {
        await happn.services.security.users.deleteUser(undefined);
      } catch (e) {
        test.expect(e.message).to.be('user is null or not an object');
        done();
      }
    });
  });

  it('tests deleting a reserved user - promise', function (done) {
    mockServices(async (_e, happn) => {
      try {
        await happn.services.security.users.deleteUser({ username: '_ANONYMOUS' });
      } catch (e) {
        test.expect(e.message).to.be('unable to delete a user with the reserved name: _ANONYMOUS');
        done();
      }
    });
  });

  it('tests deleting a user happy path - promise', function (done) {
    mockServices(async (_e, happn) => {
      happn.services.security.users.permissionManager = {
        removeAllUserPermissions: () => {},
      };
      happn.services.security.users.dataService = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_users = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_passwords = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.securityService.dataChanged = (
        whatHappned,
        data,
        additionalInfo,
        callback
      ) => {
        callback(null, { whatHappned, data, additionalInfo });
      };

      happn.services.security.users
        .deleteUser({ username: 'test' })
        .then((deleted) => {
          test.expect(deleted).to.eql({
            obj: {
              path: '/_SYSTEM/_SECURITY/_USER/test',
            },
            tree: {
              path: '/_SYSTEM/_SECURITY/_USER/test/*',
            },
          });
          done();
        })
        .catch(done);
    });
  });

  it('tests deleting a user happy path - callback', function (done) {
    mockServices(async (_e, happn) => {
      happn.services.security.users.permissionManager = {
        removeAllUserPermissions: () => {},
      };
      happn.services.security.users.dataService = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_users = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_passwords = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.securityService.dataChanged = (
        whatHappned,
        data,
        additionalInfo,
        callback
      ) => {
        callback(null, { whatHappned, data, additionalInfo });
      };

      happn.services.security.users.deleteUser({ username: 'test' }, (e, deleted) => {
        test.expect(e).to.eql(null);
        test.expect(deleted).to.eql({
          obj: {
            path: '/_SYSTEM/_SECURITY/_USER/test',
          },
          tree: {
            path: '/_SYSTEM/_SECURITY/_USER/test/*',
          },
        });
        done();
      });
    });
  });

  it('tests deleting a user sad path - promise', function (done) {
    mockServices(async (_e, happn) => {
      happn.services.security.users.permissionManager = {
        removeAllUserPermissions: () => {
          throw new Error('test');
        },
      };
      happn.services.security.users.dataService = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_users = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_passwords = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.securityService.dataChanged = (
        whatHappned,
        data,
        additionalInfo,
        callback
      ) => {
        callback(null, { whatHappned, data, additionalInfo });
      };

      happn.services.security.users
        .deleteUser({ username: 'test' })
        .then(() => {
          done(new Error('untest.expected'));
        })
        .catch((e) => {
          test.expect(e.message).to.be('test');
          done();
        });
    });
  });

  it('tests deleting a user sad path - callback', function (done) {
    mockServices(async (_e, happn) => {
      happn.services.security.users.permissionManager = {
        removeAllUserPermissions: () => {
          throw new Error('test');
        },
      };
      happn.services.security.users.dataService = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_users = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.__cache_passwords = {
        remove: (path) => {
          return { path };
        },
      };
      happn.services.security.users.securityService.dataChanged = (
        whatHappned,
        data,
        additionalInfo,
        callback
      ) => {
        callback(null, { whatHappned, data, additionalInfo });
      };

      happn.services.security.users.deleteUser({ username: 'test' }, (e) => {
        test.expect(e.message).to.be('test');
        done();
      });
    });
  });

  it('searches for users  a custom filter to ensure we dont have to trim out groups, this will allow us to optimise the listUsers method', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        happn.services.data.get(
          '/_SYSTEM/_SECURITY/_USER/*',
          { criteria: { 'custom_data.role': { $in: ['SMC Admin', 'OEM Admin'] } } },
          function (e, results) {
            if (e) return done(e);

            test.expect(results.length === 10).to.be(true);

            done();
          }
        );
      });
    });
  });

  it('searches for users  a custom filter to ensure we dont have to trim out groups, this will allow us to optimise the listUsers method, negative test', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        happn.services.data.get('/_SYSTEM/_SECURITY/_USER/*', function (e, results) {
          if (e) return done(e);

          test.expect(results.length > 10).to.be(true);

          done();
        });
      });
    });
  });

  it('searches for users with the $exists filter and other criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        happn.services.data.get(
          '/_SYSTEM/_SECURITY/_USER/*',
          {
            criteria: {
              'custom_data.role': { $containsAny: ['SMC Admin', 'OEM Admin'] },
              username: { $exists: true },
            },
          },
          function (e, results) {
            if (e) return done(e);

            test.expect(results.length === 10).to.be(true);

            done();
          }
        );
      });
    });
  });

  it('searches for users with the $exists filter and no other criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        setTimeout(() => {
          happn.services.data.get(
            '/_SYSTEM/_SECURITY/_USER/*',
            { criteria: { username: { $exists: true } } },
            function (e, results) {
              if (e) return done(e);
              test.expect(results.length === 11).to.be(true); //11 to compensate for the admin user
              done();
            }
          );
        }, 1000);
      });
    });
  });

  it('searches for users with the listUsers method, no criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        happn.services.security.users.listUsers('*', function (e, users) {
          if (e) return done(e);
          test.expect(users.length === 11).to.be(true); //11 to compensate for the admin user
          done();
        });
      });
    });
  });

  it('searches for users with the listUsers method, null criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        happn.services.security.users.listUsers('*', null, function (e, users) {
          if (e) return done(e);

          test.expect(users.length === 11).to.be(true); //11 to compensate for the admin user

          done();
        });
      });
    });
  });

  it('searches for users with the listUsers method, undefined criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        happn.services.security.users.listUsers('*', undefined, function (e, users) {
          if (e) return done(e);

          test.expect(users.length === 11).to.be(true); //11 to compensate for the admin user

          done();
        });
      });
    });
  });

  it('searches for users with the listUsers method, additional criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);

      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        happn.services.security.users.listUsers(
          '*',
          { criteria: { 'custom_data.role': { $in: ['SMC Admin', 'OEM Admin'] } } },
          function (e, users) {
            if (e) return done(e);

            test.expect(users.length === 10).to.be(true); //11 to compensate for the admin user

            done();
          }
        );
      });
    });
  });

  it('tests the __getUserNamesFromGroupLinks method', function (done) {
    var userGroupLinks = [
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_0/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_0/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_1/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_1/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_2/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_2/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_3/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_3/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_4/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_4/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_5/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_5/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_6/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_6/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_7/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_7/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_8/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_8/_USER_GROUP/test_1',
        },
      },
      {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/test_9/_USER_GROUP/test_1',
          _id: '/_SYSTEM/_SECURITY/_USER/test_9/_USER_GROUP/test_1',
        },
      },
    ];
    mockServices(function (e, happn) {
      if (e) return done(e);
      var userNames = happn.services.security.users.__getUserNamesFromGroupLinks(userGroupLinks);
      test
        .expect(userNames)
        .to.eql([
          'test_0',
          'test_1',
          'test_2',
          'test_3',
          'test_4',
          'test_5',
          'test_6',
          'test_7',
          'test_8',
          'test_9',
        ]);
      done();
    });
  });

  it('tests the __getUserNamesFromGroupLinks method, empty links', function (done) {
    var userGroupLinks = [];
    mockServices(function (e, happn) {
      if (e) return done(e);
      var userNames = happn.services.security.users.__getUserNamesFromGroupLinks(userGroupLinks);
      test.expect(userNames).to.eql([]);
      done();
    });
  });

  it('tests the __getUserNamesFromGroupLinks method, null links', function (done) {
    var userGroupLinks = null;
    mockServices(function (e, happn) {
      if (e) return done(e);
      var userNames = happn.services.security.users.__getUserNamesFromGroupLinks(userGroupLinks);
      test.expect(userNames).to.eql([]);
      done();
    });
  });

  it('searches for users with the listUsersByGroup method, exact match to group', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users.listUserNamesByGroup('test_1').then(function (userNames) {
          if (e) return done(e);
          test
            .expect(userNames.sort())
            .to.eql([
              'test_0',
              'test_1',
              'test_2',
              'test_3',
              'test_4',
              'test_5',
              'test_6',
              'test_7',
              'test_8',
              'test_9',
            ]);
          done();
        });
      });
    });
  });

  it('searches for users with the listUsersByGroup method, group name not matching', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users
          .listUserNamesByGroup('lizard-group')
          .then(function (userNames) {
            if (e) return done(e);
            test.expect(userNames).to.eql([]);
            done();
          });
      });
    });
  });

  it('searches for users with the listUsersByGroup method, group name null', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users
          .listUserNamesByGroup(null)
          .then(function () {
            done(new Error('untest.expected execution'));
          })
          .catch(function (e) {
            test.expect(e.toString()).to.be('Error: validation error: groupName must be specified');
            done();
          });
      });
    });
  });

  it('searches for users with the listUsersByGroup method, exact match to group', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users.listUsersByGroup('test_1', function (e, users) {
          if (e) return done(e);
          test.expect(users.length === 10).to.be(true); //11 to compensate for the admin user
          done();
        });
      });
    });
  });

  it('searches for users with the listUsersByGroup method, exact match to group, extra criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users.listUsersByGroup(
          'test_1',
          { criteria: { 'custom_data.extra': 1 } },
          function (e, users) {
            if (e) return done(e);
            test.expect(users.length === 1).to.be(true); //11 to compensate for the admin user
            done();
          }
        );
      });
    });
  });

  it('searches for users with the listUsersByGroup method, exact match to group, unmatched extra criteria', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users.listUsersByGroup(
          'test_1',
          { criteria: { 'custom_data.extra': 1000 } },
          function (e, users) {
            if (e) return done(e);
            test.expect(users.length === 0).to.be(true); //11 to compensate for the admin user
            done();
          }
        );
      });
    });
  });

  it('searches for users with the listUsersByGroup method, unmatched group name', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users.listUsersByGroup('lizard-group', function (e, users) {
          if (e) return done(e);
          test.expect(users.length === 0).to.be(true); //11 to compensate for the admin user
          done();
        });
      });
    });
  });

  it('searches for users with the listUsersByGroup method, null group name', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users.listUsersByGroup(null, function (e) {
          test.expect(e.toString()).to.be('Error: validation error: groupName must be specified');
          done();
        });
      });
    });
  });

  it('tests getUserNoGroups', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);
        happn.services.security.users.getUser('test_1', (e, user) => {
          test.expect(e).to.be(null);
          test.expect(test._.omit(user, ['userid'])).to.eql({
            username: 'test_1',
            custom_data: { role: 'OEM Admin', extra: 1 },
            groups: {
              test_0: { data: {} },
              test_1: { data: {} },
              test_2: { data: {} },
              test_3: { data: {} },
              test_4: { data: {} },
              test_5: { data: {} },
              test_6: { data: {} },
              test_7: { data: {} },
              test_8: { data: {} },
              test_9: { data: {} },
            },
            permissions: {},
          });
        });
        happn.services.security.users.getUserNoGroups('test_1', (e, user) => {
          test.expect(e).to.be(null);
          test.expect(test._.omit(user, ['userid'])).to.eql({
            username: 'test_1',
            custom_data: { role: 'OEM Admin', extra: 1 },
            permissions: {},
          });
          happn.services.security.users.getUser('test_1', (e, user) => {
            test.expect(e).to.be(null);
            test.expect(test._.omit(user, ['userid'])).to.eql({
              username: 'test_1',
              custom_data: { role: 'OEM Admin', extra: 1 },
              groups: {
                test_0: { data: {} },
                test_1: { data: {} },
                test_2: { data: {} },
                test_3: { data: {} },
                test_4: { data: {} },
                test_5: { data: {} },
                test_6: { data: {} },
                test_7: { data: {} },
                test_8: { data: {} },
                test_9: { data: {} },
              },
              permissions: {},
            });
            done();
          });
        });
      });
    });
  });

  it('tests getUserNoGroups returns user permissions', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      let user = {
        username: 'test_permissions',
        password: 'test_permissions',
        custom_data: { role: 'OEM Admin', extra: 27 },
        permissions: {
          'test/path/1': {
            actions: ['get', 'on', 'set'],
          },
          'test/path/2': {
            prohibit: ['put', 'delete', 'post'],
          },
          'test/path/3': {
            actions: ['get', 'on', 'set'],
            prohibit: ['put', 'delete', 'post'],
          },
        },
      };
      happn.services.security.users.upsertUser(user, (e, upsertedUser) => {
        happn.services.security.users.getUserNoGroups('test_permissions', (e, retrievedUser) => {
          try {
            test
              .expect(test._.omit(upsertedUser, ['userid']))
              .to.eql(test._.omit(user, ['password']));
            test.expect(test._.omit(retrievedUser, ['userid'])).to.eql({
              username: 'test_permissions',
              custom_data: { role: 'OEM Admin', extra: 27 },
              permissions: {
                'test/path/1': {
                  actions: ['get', 'on', 'set'],
                },
                'test/path/2': {
                  prohibit: ['delete', 'post', 'put'],
                },
                'test/path/3': {
                  actions: ['get', 'on', 'set'],
                  prohibit: ['delete', 'post', 'put'],
                },
              },
            });
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

  it('__upsertUser should add a user', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      createUsersAndGroups(happn, function (e) {
        if (e) return done(e);

        const user = {
          username: 'test_user',
          password: 'test_user',
          custom_data: { role: 'OEM Admin', extra: 'user_extra' },
        };

        happn.services.security.users.__upsertUser(user).then((upsertedUser) => {
          if (e) return done(e);

          try {
            test.expect(upsertedUser.username).to.be(user.username);
            test.expect(upsertedUser.custom_data).to.eql(user.custom_data);
            test.expect(upsertedUser.permissions).to.eql({});

            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

  it('tests initialize - config.__cache_users_by_groups is truthy and adds _ADMIN to usernamesCaseInsensitiveExclude array.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');

    mockConfig.__cache_users = null;
    users.happn = mockHappn;
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);

    test.chai.expect(stubCreatePermissions).to.have.callCount(1);
    test.chai.expect(mockConfig).to.eql({
      __cache_groups_by_user: { max: 10000, maxAge: 0 },
      __cache_users: { max: 10000, maxAge: 0 },
      __cache_users_by_groups: {},
      usernamesCaseInsensitive: {},
      usernamesCaseInsensitiveExclude: ['_ADMIN'],
    });
    test.chai.expect(mockCallback).to.have.callCount(1);
    stubCreatePermissions.restore();
  });

  it('tests initialize - config.__cache_users is truthy and _ADMIN already exist inside of usernamesCaseInsensitiveExclude array.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');

    users.happn = mockHappn;
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);

    test.chai.expect(mockConfig).to.eql({
      __cache_groups_by_user: { max: 10000, maxAge: 0 },
      __cache_users: {},
      __cache_users_by_groups: {},
      usernamesCaseInsensitive: {},
      usernamesCaseInsensitiveExclude: ['_ADMIN'],
    });
    test.chai.expect(mockCallback).to.have.callCount(1);
    stubCreatePermissions.restore();
  });

  it('tests initialize - throws error ', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreate = test.sinon.stub(PermissionsManager, 'create').throws(new Error('mockError'));

    users.happn = mockHappn;
    users.happn.services.cache.create.throws(new Error('mockError'));
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );

    stubCreate.restore();
  });

  it('test clearGroupUsersFromCache - calls this.__cache_users.remove', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockGroup = 'mockGroup';
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ getResult });
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearGroupUsersFromCache(mockGroup);

    test.chai.expect(mockCallback).to.have.callCount(1);
    test.chai.expect(remove).to.have.been.calledWithExactly('mockUser');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockGroup');
    test.chai.expect(users.happn.services.cache.create).to.have.callCount(3);
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - it clears group users from cache if whatHappnd === SD_EVENTS.DELETE_GROUP ', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'delete-group';
    const mockChanged = {
      obj: { name: 'mockName' },
      _meta: {
        path: 'path/mockPath',
      },
      path: 'path/mockPath',
    };
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(groupChanged).to.have.been.calledWithExactly('mockName');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockName');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches -it clears group users from cache if whatHappnd === SD_EVENTS.UNLINK_GROUP ', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'unlink-group';
    const mockChanged = {
      obj: { name: 'mockName' },
      _meta: {
        path: 'path/mockPath',
      },
      path: 'path/mockPath',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(groupChanged).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches -it clears group users from cache if whatHappnd === SD_EVENTS.LINK_GROUP', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'link-group';
    const mockChanged = {
      obj: { name: 'mockName' },
      _meta: {
        path: 'path/mockPath',
      },
      path: 'path/mockPath',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(groupChanged).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.PERMISSION_REMOVED, changedData.username and this.permissionManager is truthy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'permission-removed';
    const mockChanged = {
      username: 'mockUsername',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns({
      cache: cache,
    });
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(remove).to.have.been.calledWithExactly('mockUsername');
    test.chai.expect(cache.remove).to.have.been.calledWithExactly('mockUsername');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.PERMISSION_UPSERTED, changedData.username is truthy and this.permissionManager is falsy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'permission-upserted';
    const mockChanged = {
      username: 'mockUsername',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(remove).to.have.been.calledWithExactly('mockUsername');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.PERMISSION_UPSERTED, changedData.username is falsy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'permission-upserted';
    const mockChanged = {
      username: null,
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns({
      cache: cache,
    });
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.UPSERT_USER and calls this.permissionManager.cache.remove', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'upsert-user';
    const mockChanged = {
      username: 'mockUsername',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const userChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns({
      cache: cache,
    });
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ userChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(userChanged).to.have.been.calledWithExactly('mockUsername');
    test.chai.expect(remove).to.have.been.calledWith('mockUsername');
    test.chai.expect(remove).to.have.callCount(3);
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.DELETE_USER and resolves promise', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'delete-user';
    const mockChanged = {
      username: 'mockUsername',
      obj: {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/',
        },
      },
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const userChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ userChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(result).to.be.undefined;
    test.chai.expect(remove).to.have.been.calledWith('');
    test.chai.expect(remove).to.have.callCount(3);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - call this.dataService.get and return callback with error', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = { validateName: test.sinon.stub() };
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      const mockError = new Error('mockError');
      callback(mockError);
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        {},
        test.sinon.match.func
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - calls this.dataService.get and returns callback with new error if result is null', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, null);
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        {},
        test.sinon.match.func
      );
    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              'validation failure: no password or publicKey specified for a new user'
            )
          )
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - this.__upsertUser is rejected with error, callback called with error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername', name: 'mockName', permissions: {} };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
    };
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    users.happn.services.utils.clone.returns(true);
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    stubBindInEachGroup(users);
    users.getUserNoGroups = test.sinon.stub().callsFake((_, callback) => {
      callback(new Error('mockError'), null);
    });

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        {},
        test.sinon.match.func
      );
    test.chai
      .expect(mockSecurityService.checkOverwrite)
      .to.have.been.calledWithExactly(
        'user',
        { username: 'mockusername', name: 'mockName', permissions: {} },
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        'mockusername',
        {},
        test.sinon.match.func
      );
    test.chai
      .expect(users.getUserNoGroups)
      .to.have.been.calledWithExactly('mockusername', test.sinon.match.func);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - obj.username is falsy. Callback function returns callback() with new error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: '', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const clear = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove, clear });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'validation failure: no username specified'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - obj.username.indexOf is greater -1 and returns callback with new error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername::nogroups', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              "validation failure: username cannot contain the ':nogroups' directive"
            )
          )
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - obj.username is _ANONYMOUS and returns callback with new error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: '_ANONYMOUS', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });
    const stubGet = test.sinon.stub().callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ANONYMOUS'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              'validation failure: username cannot be reserved name _ANONYMOUS'
            )
          )
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - return callback when hash is truthy.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns('mockHash');
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, 'mockHash');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - calls this.dataService.get and returns callback with error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns(null);
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get });
    const stubGetData = users.happn.services.data.get.callsFake((_, callback) => {
      const mockError = new Error('mockError');
      callback(mockError, null);
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockUsername',
        test.sinon.match.func
      );
    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - calls this.dataService.get and returns callback with new error if user is falsy.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = null;
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns(null);
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get });
    const stubGetData = users.happn.services.data.get.callsFake((_, callback) => {
      callback(null, null);
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_USER/null', test.sinon.match.func);
    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'null does not exist in the system'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - calls this.dataService.get and calls this.__cache_passwords.set if user is truthy.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = null;
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns(null);
    const set = test.sinon.stub().returns(null);
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get, set: set });
    const stubGetData = users.happn.services.data.get.callsFake((_, callback) => {
      callback(null, { data: { username: 'mockUsername', password: 'mockPassword' } });
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_USER/null', test.sinon.match.func);
    test.chai.expect(set).to.have.been.calledWithExactly('mockUsername', 'mockPassword');
    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, 'mockPassword');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __prepareUserForUpsert - promise resolved if !user.password is falsy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      serialize: test.sinon.stub().returns({ username: 'mockUsername' }),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
      dataChanged: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const get = test.sinon.stub();
    const has = test.sinon.stub().returns(true);
    const userChanged = test.sinon.stub();
    const stubUpsert = test.sinon.stub().returns('mockResult');
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });

    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove, get: get, has: has });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    const stubUpsertData = users.happn.services.data.upsert.returns('mockResult');
    const stubClone = users.happn.services.utils.clone.returns({
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(stubUpsertData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockUsername',
      {
        username: 'mockUsername',
        name: 'mockName',
        password: null,
      },
      { merge: true }
    );
    test.chai.expect(stubClone).to.have.been.calledWithExactly({});
    test.chai
      .expect(mockSecurityService.serialize)
      .to.have.been.calledWithExactly('user', 'mockResult');
    test.chai.expect(mockSecurityService.dataChanged).to.have.been.calledWithExactly(
      'upsert-user',
      {
        username: 'mockUsername',
        permissions: { username: 'mockUsername', name: 'mockName', password: null },
      },
      {
        username: 'mockusername',
        name: 'mockName',
        permissions: {},
        password: null,
      }
    );
    test.chai.expect(stubUpsertMultiplePermissions).to.have.been.calledWithExactly('mockUsername', {
      username: 'mockUsername',
      name: 'mockName',
      password: null,
    });

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __prepareUserForUpsert - calls this.cryptoService.generateHash if user.password is truthy and resolves promise.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      serialize: test.sinon.stub().returns({ username: 'mockUsername' }),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
      dataChanged: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const get = test.sinon.stub();
    const has = test.sinon.stub().returns(true);
    const userChanged = test.sinon.stub();
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });
    const stubGet = test.sinon.stub().callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove, get: get, has: has });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    const stubUpsertData = users.happn.services.data.upsert.returns('mockResult');
    const stubClone = users.happn.services.utils.clone.returns({
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    });
    const stubGenerateHash = users.happn.services.crypto.generateHash.callsFake(
      (_, __, callback) => {
        callback(null, null);
      }
    );

    stubBindInEachGroup(users);
    mockConfig.pbkdf2Iterations = null;

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(stubGenerateHash)
      .to.have.been.calledWithExactly('mockPassword', null, test.sinon.match.func);
    test.chai.expect(stubUpsertData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockUsername',
      {
        username: 'mockUsername',
        name: 'mockName',
        password: null,
      },
      { merge: true }
    );
    test.chai.expect(stubClone).to.have.been.calledWithExactly({});
    test.chai
      .expect(mockSecurityService.serialize)
      .to.have.been.calledWithExactly('user', 'mockResult');
    test.chai.expect(mockSecurityService.dataChanged).to.have.been.calledWithExactly(
      'upsert-user',
      {
        username: 'mockUsername',
        permissions: { username: 'mockUsername', name: 'mockName', password: null },
      },
      {
        username: 'mockusername',
        name: 'mockName',
        permissions: {},
        password: 'mockPassword',
      }
    );
    test.chai.expect(stubUpsertMultiplePermissions).to.have.been.calledWithExactly('mockUsername', {
      username: 'mockUsername',
      name: 'mockName',
      password: null,
    });

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __prepareUserForUpsert - calls this.cryptoService.generateHash if user.password is falsy and rejects promise.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      serialize: test.sinon.stub().returns({ username: 'mockUsername' }),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
      dataChanged: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const get = test.sinon.stub();
    const has = test.sinon.stub().returns(true);
    const userChanged = test.sinon.stub();
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove, get: get, has: has });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    users.happn.services.data.upsert.returns('mockResult');
    users.happn.services.utils.clone.returns({
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    });
    const stubGenerateHash = users.happn.services.crypto.generateHash.callsFake(
      (_, __, callback) => {
        callback('mockUser', null);
      }
    );
    stubBindInEachGroup(users);
    mockConfig.pbkdf2Iterations = null;

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(stubGenerateHash)
      .to.have.been.calledWithExactly('mockPassword', null, test.sinon.match.func);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('test upsertPermissions -  calls this.permissionManager.upsertMultiplePermissions, this.securityService.dataChanged and callback', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const dataChanged = test.sinon.stub();
    const mockSecurityService = {
      dataChanged: dataChanged,
    };
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns();
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertPermissions(mockUser, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    });
    test.chai
      .expect(stubUpsertMultiplePermissions)
      .to.have.been.calledWithExactly('mockUsername', {});
    test.chai.expect(dataChanged).to.have.been.calledWithExactly('upsert-user', {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    });
    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('test upsertPermissions - this.securityService.dataChanged throws error and calls callback with error.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const dataChanged = test.sinon.stub().throws(new Error('mockError'));
    const mockSecurityService = {
      dataChanged: dataChanged,
    };
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns();
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.upsertPermissions(mockUser, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests deleteUser calls this.log.error if there is an error in the callback function of this.securityService.dataChanged', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const dataChanged = test.sinon.stub().callsFake((_, __, ___, callback) => {
      callback(new Error('mockError'));
    });
    const mockSecurityService = {
      dataChanged: dataChanged,
    };
    const stubRemoveAllUserPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ removeAllUserPermissions: stubRemoveAllUserPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();
    const remove = test.sinon.stub();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    const stubRemoveData = users.happn.services.data.remove.returns({});
    stubBindInEachGroup(users);
    users.log = {
      error: test.sinon.stub(),
      debug: test.sinon.stub(),
    };

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.deleteUser(mockUser, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(users.log.error)
      .to.have.been.calledWithExactly(`user delete failure to propagate event: mockError`);
    test.chai.expect(users.log.debug).to.have.been.calledWithExactly(`user deleted: mockUsername`);
    test.chai
      .expect(dataChanged)
      .to.have.been.calledWithExactly(
        'delete-user',
        { obj: {}, tree: {} },
        null,
        test.sinon.match.func
      );
    test.chai.expect(remove).to.have.callCount(2);
    test.chai.expect(stubRemoveData).to.have.callCount(2);
    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, { obj: {}, tree: {} });
    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getUser - calls this.getUserNoGroups and returns callback if options.includeGroups equals false.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const has = test.sinon.stub().returns(true);
    const get = test.sinon.stub().returns({});
    const mockOptions = { includeGroups: false };

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ has: has, get: get });
    stubBindInEachGroup(users);
    users.log = {
      error: test.sinon.stub(),
      debug: test.sinon.stub(),
    };

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getUser(mockUsername, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, {});
    test.chai.expect(get).to.have.been.calledWithExactly('mockusername');
    test.chai.expect(has).to.have.been.calledWithExactly('mockusername');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getUser - calls this.getUserNoGroups and returns callback if options.includeGroups true.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const callback = test.sinon.stub();
    const has = test.sinon.stub();
    const get = test.sinon.stub();
    const set = test.sinon.stub();
    const stubAttachPermissions = test.sinon.stub().returns('mockAttach');

    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });

    users.happn = mockHappn;
    users.happn.services.data.get.onCall(0).returns({ data: { password: 'mockPassword' } });
    users.happn.services.data.get.onCall(1).callsFake((_, __, cb) => {
      cb(new Error('test error'));
    });
    users.happn.services.cache.create
      .withArgs('cache_security_users', test.sinon.match.instanceOf(Object))
      .returns({ has, get, set });
    users.happn.services.cache.create
      .withArgs('cache_security_passwords', test.sinon.match.instanceOf(Object))
      .returns({ set });
    users.happn.services.cache.create
      .withArgs('cache_groups_by_user', test.sinon.match.instanceOf(Object))
      .returns({ has });
    stubBindInEachGroup(users);

    users.initialize(
      {
        usernamesCaseInsensitive: true,
        usernamesCaseInsensitiveExclude: ['mockUsername'],
        __cache_groups_by_user: true,
      },
      { serialize: test.sinon.stub().returns(null) },
      test.sinon.stub()
    );

    users.getUser('mockUsername', { includeGroups: true }, callback);
    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(users.happn.services.cache.create).to.have.callCount(4);

    stubCreatePermissions.restore();
  });

  it('tests getUser, this.getUserNoGroups and returns callback and callback is called with error', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const callback = test.sinon.stub();
    const has = test.sinon.stub();
    const stubAttachPermissions = test.sinon.stub().returns('mockAttach');

    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });

    users.happn = mockHappn;
    users.happn.services.data.get.throws(new Error('test error'));
    users.happn.services.cache.create.returns({ has });

    stubBindInEachGroup(users);

    users.initialize(
      {
        usernamesCaseInsensitive: true,
        usernamesCaseInsensitiveExclude: ['mockUsername'],
        __cache_groups_by_user: true,
      },
      { serialize: test.sinon.stub().returns(null) },
      test.sinon.stub()
    );

    users.getUser('mockUsername', { includeGroups: true }, callback);
    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(callback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(users.happn.services.cache.create).to.have.callCount(4);

    stubCreatePermissions.restore();
  });

  it('tests userBelongsToGroups, returns and calls callback with error', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const callback = test.sinon.stub().returns('mockResult');

    stubBindInEachGroup(users);

    users.initialize(
      { usernamesCaseInsensitive: true, usernamesCaseInsensitiveExclude: ['mockUsername'] },
      { serialize: test.sinon.stub().returns(null) },
      test.sinon.stub()
    );

    const result = users.userBelongsToGroups('mockUsername', null, callback);

    test.chai.expect(result).to.equal('mockResult');
    test.chai
      .expect(callback)
      .to.have.been.calledOnceWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'groupNames must be an array'))
      );
    //   await require('node:timers/promises').setTimeout(50);
  });

  it('tests userBelongsToGroups, calls callback if groupNames.length is equal to 0', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const callback = test.sinon.stub().returns('mockResult');
    const has = test.sinon.stub().returns(true);
    const get = test.sinon.stub().returns('mockUser');

    stubBindInEachGroup(users);

    users.happn = mockHappn;
    users.happn.services.cache.create
      .withArgs('cache_groups_by_user', test.sinon.match.instanceOf(Object))
      .returns({
        has,
        get,
      });

    users.initialize({}, { serialize: test.sinon.stub().returns(null) }, test.sinon.stub());

    users.userBelongsToGroups('mockUsername', [], callback);

    test.chai.expect(callback).to.have.been.calledOnceWithExactly(null, false);
    test.chai.expect(has).to.have.been.calledOnceWithExactly('mockUsername');
    test.chai.expect(get).to.have.been.calledOnceWithExactly('mockUsername');
  });

  it('tests userBelongsToGroups, calls callback with belongs', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const callback = test.sinon.stub().returns('mockResult');
    const has = test.sinon.stub().returns(false);
    const set = test.sinon.stub();

    stubBindInEachGroup(users);

    users.happn = mockHappn;
    users.happn.services.cache.create
      .withArgs('cache_groups_by_user', test.sinon.match.instanceOf(Object))
      .returns({
        has,
        set,
      });

    users.happn.services.data.get.callsFake((_, __, cb) => {
      cb(null, [
        {
          _meta: {
            path: '/_SYSTEM/_SECURITY/_USER/mockUsername/',
          },
        },
      ]);
    });

    users.initialize({}, { serialize: test.sinon.stub().returns(null) }, test.sinon.stub());

    users.userBelongsToGroups('mockUsername', ['test'], callback);

    test.chai.expect(callback).to.have.been.calledOnceWithExactly(null, false);
    test.chai.expect(has).to.have.been.calledOnceWithExactly('mockUsername');
    test.chai.expect(set).to.have.been.calledOnceWithExactly('mockUsername', [
      {
        groupName: '/_SYSTEM/_SECURITY/_USER/mockUsername/',
        membership: {},
      },
    ]);
  });

  it('tests userBelongsToGroups, dataService.get throws error and calls callback with error', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const callback = test.sinon.stub().returns('mockResult');
    const has = test.sinon.stub().returns(false);

    stubBindInEachGroup(users);

    users.happn = mockHappn;
    users.happn.services.cache.create
      .withArgs('cache_groups_by_user', test.sinon.match.instanceOf(Object))
      .returns({
        has,
      });
    users.happn.services.data.get.callsFake((_, __, cb) => {
      cb(new Error('test error'));
    });

    users.initialize({}, { serialize: test.sinon.stub().returns(null) }, test.sinon.stub());

    users.userBelongsToGroups('mockUsername', [], callback);

    test.chai
      .expect(callback)
      .to.have.been.calledOnceWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'test error'))
      );
    test.chai.expect(has).to.have.been.calledOnceWithExactly('mockUsername');
  });

  it('tests listUser - add * to preparedUserName and adds more properties to searchParameters. Then calls this.dataService.count and calls callback with error.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const mockOptions = { sort: {}, limit: {}, skip: {}, collation: {}, count: {} };

    users.happn = mockHappn;
    const stubCountData = users.happn.services.data.count.callsFake((_, __, callback) => {
      callback(new Error('mockError'), null);
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.listUsers(mockUsername, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai.expect(stubCountData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockusername*',
      {
        criteria: { $and: [test.sinon.match.instanceOf(Object)] },
        sort: {},
        options: { limit: {}, skip: {}, collation: {} },
      },
      test.sinon.match.func
    );
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUser - add * to preparedUserName and adds more properties to searchParameters. Then calls this.dataService.count and calls callback.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const mockOptions = { sort: {}, limit: {}, skip: {}, collation: {}, count: {} };

    users.happn = mockHappn;
    const stubCountData = users.happn.services.data.count.callsFake((_, __, callback) => {
      callback(null, { data: 'mockData' });
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.listUsers(mockUsername, mockOptions, mockCallBackTwo);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, 'mockData');
    test.chai.expect(stubCountData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockusername*',
      {
        criteria: { $and: [test.sinon.match.instanceOf(Object)] },
        sort: {},
        options: { limit: {}, skip: {}, collation: {} },
      },
      test.sinon.match.func
    );
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUser - calls this.dataService.get if options.count is falsy and calls callback with error.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = test.sinon.stub();
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const mockOptions = { sort: {}, limit: {}, skip: {}, collation: {}, count: null };

    users.happn = mockHappn;
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(new Error('mockError'), null);
    });
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.listUsers(mockUsername, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockUsername)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai.expect(stubGetData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/*',
      {
        criteria: { $and: [test.sinon.match.instanceOf(Object)] },
        sort: undefined,
        options: {},
      },
      test.sinon.match.func
    );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUserNamesByGroup - calls this.dataService.get if groupName has "*" . Promise is resolved.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockGroupName = 'mockGroupName*';
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();

    users.happn = mockHappn;
    const stubGetData = users.happn.services.data.get.resolves(null);
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.listUserNamesByGroup(mockGroupName);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_USER/*/_USER_GROUP/mockGroupName*', {
        path_only: true,
      });
    await test.chai.expect(result).to.eventually.eql([]);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUsersByGroup - calls this.dataService.get and returns callback', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const groupName = 'mockGroupName*';
    const options = null;
    const mockCallbackOne = test.sinon.stub();
    const mockCallbackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    users.happn = mockHappn;
    const stubGetData = users.happn.services.data.get;
    stubGetData.onCall(0).resolves({
      paths: [
        {
          _meta: {
            path: '/_SYSTEM/_SECURITY/_USER/mockUser/_USER_GROUP/',
          },
        },
      ],
    });
    stubGetData.onCall(1).callsFake((_, __, callback) => {
      callback(new Error('mockError'));
    });

    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.listUsersByGroup(groupName, options, mockCallbackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(stubGetData).to.have.callCount(2);
    test.chai
      .expect(stubGetData.args[0])
      .to.eql(['/_SYSTEM/_SECURITY/_USER/*/_USER_GROUP/mockGroupName*', { path_only: true }]);
    test.chai
      .expect(mockCallbackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listPermissions', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubListPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ listPermissions: stubListPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.listPermissions(mockUsername);

    test.chai.expect(stubListPermissions).to.have.been.calledWithExactly('mockUsername');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests attachPermissions', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {};
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.attachPermissions(mockUser);

    test.chai.expect(stubAttachPermissions).to.have.been.calledWithExactly({});

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests removePermission', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockPath = {};
    const mockAction = '/mockPath/';
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubRemovePermission = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ removePermission: stubRemovePermission });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.removePermission(mockUsername, mockPath, mockAction);

    test.chai
      .expect(stubRemovePermission)
      .to.have.been.calledWithExactly('mockUsername', {}, '/mockPath/');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests upsertPermission', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockPath = {};
    const mockAction = '/mockPath/';
    const mockAuthorized = true;
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubUpsertPermission = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertPermission: stubUpsertPermission });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertPermission(mockUsername, mockPath, mockAction, mockAuthorized);

    test.chai
      .expect(stubUpsertPermission)
      .to.have.been.calledWithExactly('mockUsername', {}, '/mockPath/', true);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });
});
