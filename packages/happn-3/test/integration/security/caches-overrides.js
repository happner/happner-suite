var testHelper = require('../../__fixtures/utils/test_helper').create();

describe(testHelper.testName(__filename, 3), function () {
  var happn = require('../../../lib/index');
  var async = require('async');
  var serviceInstance;
  var adminClient;
  var expect = require('expect.js');

  var getService = function (config, callback) {
    happn.service.create(config, callback);
  };

  before(
    'it starts the service with limited cache sizes for the security service',
    function (callback) {
      this.timeout(3000);
      getService(
        {
          secure: true,
          services: {
            cache: {
              config: {
                overrides: {
                  checkpoint_cache_authorization: {
                    //checkpoint auth cache
                    max: 5,
                    maxAge: 0,
                  },
                  checkpoint_cache_authorization_token: {
                    //checkpoint auth cache
                    max: 5,
                    maxAge: 0,
                  },
                  cache_security_groups: {
                    //groups cache
                    max: 5,
                    maxAge: 0,
                  },
                  cache_security_users: {
                    max: 5,
                    maxAge: 0,
                  },
                  cache_security_group_permissions: {
                    max: 5,
                    maxAge: 0,
                  },
                  cache_security_user_permissions: {
                    max: 5,
                    maxAge: 0,
                  },
                  cache_security_passwords: {
                    max: 5,
                    maxAge: 0,
                  },
                },
              },
            },
          },
        },
        function (e, service) {
          if (e) return callback(e);

          serviceInstance = service;

          expect(serviceInstance.services.security.groups.__cache_groups.opts.max).to.be(5);
          expect(serviceInstance.services.security.users.__cache_users.opts.max).to.be(5);
          expect(serviceInstance.services.security.groups.permissionManager.cache.opts.max).to.be(
            5
          );
          expect(
            serviceInstance.services.security.checkpoint.__cache_checkpoint_authorization.opts.max
          ).to.be(5);

          serviceInstance.services.session
            .localClient({
              username: '_ADMIN',
              password: 'happn',
            })

            .then(function (clientInstance) {
              adminClient = clientInstance;
              callback();
            })

            .catch(function (e) {
              callback(e);
            });
        }
      );
    }
  );

  var SESSION_COUNT = 10;

  this.timeout(SESSION_COUNT * 1000);

  var groups = [];
  var users = [];
  var sessions = [];

  before('it creates test groups', function (callback) {
    async.timesSeries(
      SESSION_COUNT,
      function (time, timeCB) {
        var group = {
          name: 'TEST_GRP_' + time.toString(),
          permissions: {},
        };

        group.permissions['test/permission/on/' + time.toString()] = { actions: ['on', 'set'] };
        group.permissions['test/permission/get/' + time.toString()] = { actions: ['get'] };
        group.permissions['test/permission/all/' + time.toString()] = { actions: ['*'] };

        group.permissions['test/{{user.username}}/all/0/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/1/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/2/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/3/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/4/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/5/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/6/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/7/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/8/*'] = { actions: ['*'] };
        group.permissions['test/{{user.username}}/all/9/*'] = { actions: ['*'] };

        serviceInstance.services.security.groups.upsertGroup(group, function (e, upserted) {
          if (e) return timeCB(e);

          groups.push(upserted);
          timeCB();
        });
      },
      callback
    );
  });

  before('it creates test users', function (callback) {
    async.timesSeries(
      SESSION_COUNT,
      function (time, timeCB) {
        var user = {
          username: 'TEST_USR_' + time.toString(),
          password: 'TEST_USR_' + time.toString(),
          custom_data: {
            value: time.toString(),
          },
        };

        serviceInstance.services.security.users.upsertUser(user, function (e, upserted) {
          if (e) return timeCB(e);

          serviceInstance.services.security.groups.linkGroup(groups[time], upserted, function (e) {
            if (e) return timeCB(e);

            users.push(upserted);
            timeCB();
          });
        });
      },
      callback
    );
  });

  before('it creates test sessions', function (callback) {
    async.timesSeries(
      SESSION_COUNT,
      function (time, timeCB) {
        serviceInstance.services.session
          .localClient({
            username: 'TEST_USR_' + time.toString(),
            password: 'TEST_USR_' + time.toString(),
          })

          .then(function (clientInstance) {
            sessions.push(clientInstance);
            timeCB();
          })

          .catch(function (e) {
            timeCB(e);
          });
      },
      callback
    );
  });

  after('should delete the temp data file and disconnect all test clients', function (callback) {
    this.timeout(15000);

    if (adminClient) adminClient.disconnect({ reconnect: false });

    setTimeout(function () {
      serviceInstance.stop(function () {
        callback();
      });
    }, 3000);
  });

  it('does a bunch of user and groups fetches- checks the security caches are the correct size', function (done) {
    this.timeout(30000);

    async.timesSeries(
      SESSION_COUNT * 100,
      function (time, timeCB) {
        var randomInt = testHelper.randomInt(0, SESSION_COUNT - 1);

        serviceInstance.services.security.groups.getGroup(
          'TEST_GRP_' + randomInt.toString(),
          function (e, group) {
            if (e) return timeCB(e);

            expect(
              serviceInstance.services.security.groups.__cache_groups.get(
                'TEST_GRP_' + randomInt.toString()
              ).name
            ).to.be(group.name);

            serviceInstance.services.security.users.getUser(
              'TEST_USR_' + randomInt.toString(),
              function (e, user) {
                if (e) return timeCB(e);
                expect(
                  serviceInstance.services.security.users.__cache_users.get(
                    'TEST_USR_' + randomInt.toString()
                  ).username
                ).to.be(user.username);
                expect(
                  serviceInstance.services.security.users.__cache_passwords.get(
                    'TEST_USR_' + randomInt.toString()
                  )
                ).to.not.be(null);

                timeCB();
              }
            );
          }
        );
      },
      function (e) {
        if (e) return done(e);

        expect(serviceInstance.services.security.groups.__cache_groups.size()).to.be(5);
        expect(serviceInstance.services.security.users.__cache_users.size()).to.be(5);
        expect(serviceInstance.services.security.users.__cache_passwords.size()).to.be(5);

        done();
      }
    );
  });

  it('does a bunch of data activity - checks the security caches are the correct size', function (done) {
    this.timeout(30000);

    async.timesSeries(
      SESSION_COUNT * 100,
      function (time, timeCB) {
        var randomInt = testHelper.randomInt(0, SESSION_COUNT - 1);

        var client = sessions[randomInt];

        client
          .offAll()
          .then(function () {
            client.on(
              'test/permission/on/' + randomInt,
              function () {
                client.get('test/permission/get/' + randomInt, function (e) {
                  if (e) return timeCB(e);

                  client.set('test/permission/all/' + randomInt, { all: randomInt }, function (e) {
                    if (e) return timeCB(e);
                    var randomTemplateNumber = testHelper.randomInt(0, 9);
                    client.set(
                      'test/' +
                        client.session.user.username +
                        '/all/' +
                        randomTemplateNumber +
                        '/' +
                        randomInt,
                      { all: randomInt },
                      timeCB
                    );
                  });
                });
              },
              function (e) {
                if (e) return timeCB(e);

                client.set('test/permission/on/' + randomInt, { set: randomInt });
              }
            );
          })
          .catch(timeCB);
      },
      function (e) {
        if (e) return done(e);

        expect(
          serviceInstance.services.security.checkpoint.__cache_checkpoint_authorization.size()
        ).to.be(5);
        expect(serviceInstance.services.security.groups.permissionManager.cache.size()).to.be(5);
        done();
      }
    );
  });
});
