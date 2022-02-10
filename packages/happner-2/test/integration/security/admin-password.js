require('../../__fixtures/utils/test_helper').describe({ timeout: 10e3 }, (test) => {
  var __testFileName1 = test.newTestFile({ name: 'admin-password-1' });
  var __testFileName2 = test.newTestFile({ name: 'admin-password-2' });

  var config1 = {
    happn: {
      port: 55001,
      name: 'admin-password-1',
      secure: true,
      services: {
        security: {
          config: {
            adminUser: {
              password: 'initialPassword',
            },
          },
        },
        data: {
          config: {
            filename: __testFileName1,
          },
        },
      },
    },
    __testOptions: {
      getClient: true,
    },
  };

  var config2 = {
    happn: {
      port: 55002,
      name: 'admin-password-2',
      secure: true,
      services: {
        security: {
          config: {
            adminUser: {
              password: 'initialPassword',
            },
          },
        },
        data: {
          config: {
            filename: __testFileName2,
          },
        },
      },
    },
    __testOptions: {
      getClient: true,
    },
  };

  before('should initialize the helper with services', function (done) {
    test.startUp([config1, config2], done);
  });

  after('tears down all services and clients', function (done) {
    this.timeout(10000);
    test.tearDown(() => {
      setTimeout(() => {
        //log();
        done();
      }, 5000);
    });
  });

  it('changes the admin password, then restarts the service - we check the new admin password is still in place', function (done) {
    test.getClient({ name: 'admin-password-1' }, function (e, client) {
      if (e) return done(e);

      test.disconnectClient(client.id, function (e) {
        if (e) return done(e);

        var service = test.findService({ id: 'admin-password-1' });

        try {
          service.instance.exchange.security.upsertUser(
            { username: '_ADMIN', password: 'modifiedPassword' },
            function (e) {
              if (e) return done(e);
              test.restartService({ id: 'admin-password-1' }, function (e) {
                test
                  .expect(e.toString())
                  .to.be(
                    'Error: started service ok but failed to get client: AccessDenied: Invalid credentials'
                  );
                test.getService(config1, done, 'modifiedPassword');
              });
            }
          );
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it('restarts the service without changing the password - all should be ok', function (done) {
    test.getClient({ name: 'admin-password-2' }, function (e, client) {
      if (e) return done(e);

      test.disconnectClient(client.id, function (e) {
        if (e) return done(e);

        try {
          test.restartService({ id: 'admin-password-2' }, done);
        } catch (e) {
          done(e);
        }
      });
    });
  });
});
