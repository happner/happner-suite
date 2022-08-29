require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  const mesh = new test.Mesh();
  const adminClient = new test.Mesh.MeshClient({ secure: true });
  const testClient = new test.Mesh.MeshClient({ secure: true });
  const test_id = Date.now() + '_' + require('shortid').generate();

  before(function (done) {
    mesh.initialize(
      {
        name: 'session-changes-events',

        happn: {
          secure: true,
          adminPassword: test_id,
        },
      },
      function (err) {
        if (err) return done(err);

        mesh.start(function (err) {
          if (err) return done(err);

          var credentials = {
            username: '_ADMIN', // pending
            password: test_id,
          };

          adminClient.login(credentials).then(done).catch(done);
        });
      }
    );
  });

  // test.printOpenHandlesAfter(5e3);

  after(async () => {
    await testClient.disconnect();
    await adminClient.disconnect();
    await mesh.stop({ reconnect: false });
  });

  var eventsToFire = {
    connect: false,
    disconnect: false,
  };

  it('tests the connect and disconnect events, by logging on and off with the test client', function (done) {
    var fireEvent = function (key) {
      eventsToFire[key] = true;
      for (var eventKey in eventsToFire) if (eventsToFire[eventKey] === false) return;
      done();
    };

    var testUser = {
      username: 'TESTUSER1' + test_id,
      password: 'TEST PWD',
      custom_data: {
        something: 'useful',
      },
    };

    adminClient.exchange.security.addUser(testUser, function (e) {
      if (e) return done(e);

      adminClient.exchange.security.attachToSessionChanges(function (e) {
        if (e) return done(e);

        adminClient.event.security.on('connect', function () {
          fireEvent('connect');
        });

        adminClient.event.security.on('disconnect', function () {
          fireEvent('disconnect');
        });

        var credentials = {
          username: 'TESTUSER1' + test_id, // pending
          password: 'TEST PWD',
        };

        testClient
          .login(credentials)
          .then(function () {
            testClient.disconnect();
          })
          .catch(done);
      });
    });
  });
});
