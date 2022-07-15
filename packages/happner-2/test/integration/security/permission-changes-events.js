require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var mesh = new test.Mesh();
  var test_id = test.newid();
  let adminClient;

  before(function (done) {
    adminClient = new test.Mesh.MeshClient({ secure: true, port: 8004 });
    mesh.initialize(
      {
        name: 'permission-changes-events',
        happn: {
          secure: true,
          adminPassword: test_id,
          port: 8004,
        },
      },
      function (err) {
        if (err) return done(err);
        mesh.start(function (err) {
          if (err) {
            return done(err);
          }

          // Credentials for the login method
          var credentials = {
            username: '_ADMIN', // pending
            password: test_id,
          };

          adminClient
            .login(credentials)
            .then(function () {
              done();
            })
            .catch(done);
        });
      }
    );
  });

  after(function (done) {
    this.timeout(20000);
    if (!adminClient) return done();
    adminClient.disconnect(() => {
      adminClient.event.security.offPath('upsert-user');
      adminClient.event.security.offPath('upsert-group');
      adminClient.event.security.offPath('link-group');
      adminClient.event.security.offPath('unlink-group');
      adminClient.event.security.offPath('delete-group');
      adminClient.event.security.offPath('delete-user');
      mesh.stop({ reconnect: false }, done);
    });
  });

  it('tests that all security events are being bubbled back from happn to happner security - and are consumable from an admin client', function (done) {
    var testGroup = {
      name: 'TESTGROUP1' + test_id,

      custom_data: {
        customString: 'custom1',
        customNumber: 0,
      },

      permissions: {
        methods: {},
      },
    };

    var testGroupSaved;
    var testUserSaved;

    //link-group
    //

    var eventsToFire = {
      'upsert-user': false,
      'upsert-group': false,
      'link-group': false,
      'unlink-group': false,
      'delete-group': false,
      'delete-user': false,
    };

    var fireEvent = function (key) {
      eventsToFire[key] = true;

      for (var eventKey in eventsToFire) if (eventsToFire[eventKey] === false) return;

      done();
    };

    adminClient.exchange.security.attachToSecurityChanges(function (e) {
      if (e) return done(e);

      adminClient.event.security.on('upsert-user', function () {
        fireEvent('upsert-user');
      });

      adminClient.event.security.on('upsert-group', function () {
        fireEvent('upsert-group');
      });

      adminClient.event.security.on('link-group', function () {
        fireEvent('link-group');
      });

      adminClient.event.security.on('unlink-group', function () {
        fireEvent('unlink-group');
      });

      adminClient.event.security.on('delete-group', function () {
        fireEvent('delete-group');
      });

      adminClient.event.security.on('delete-user', function () {
        fireEvent('delete-user');
      });

      adminClient.exchange.security.addGroup(testGroup, function (e, result) {
        if (e) return done(e);

        testGroupSaved = result;

        var testUser = {
          username: 'TESTUSER1' + test_id,
          password: 'TEST PWD',
          custom_data: {
            something: 'useful',
          },
        };

        adminClient.exchange.security.addUser(testUser, function (e, result) {
          if (e) return done(e);

          test.expect(result.username).to.be(testUser.username);
          testUserSaved = result;

          adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {
            //we'll need to fetch user groups, do that later
            if (e) return done(e);

            testUser.password = 'NEW PWD';
            testUser.custom_data = { changedCustom: 'changedCustom' };

            adminClient.exchange.security.updateUser(testUser, function (e) {
              if (e) return done(e);

              adminClient.exchange.security.unlinkGroup(
                testGroupSaved,
                testUserSaved,
                function (e) {
                  if (e) return done(e);

                  adminClient.exchange.security.deleteGroup(testGroupSaved, function (e) {
                    if (e) return done(e);

                    adminClient.exchange.security.deleteUser(testUser, function () {
                      //this will error because when we do done in event, the server closes its connections
                    });
                  });
                }
              );
            });
          });
        });
      });
    });
  });
});
