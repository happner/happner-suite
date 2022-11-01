require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const Mesh = require('../../..');
  const mesh = new Mesh();
  const adminClient = new Mesh.MeshClient({ secure: true, port: 8004 });
  const test_id = test.newid();

  before(function (done) {
    mesh.initialize(
      {
        name: 'connection-changes-events',
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

          var credentials = {
            username: '_ADMIN',
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

  var eventsToFire = {
    'reconnect/scheduled': false,
    'reconnect/successful': false,
  };

  var eventsFired = false;

  it('tests the reconnection events', function (done) {
    var fireEvent = function (key) {
      if (eventsFired) return;

      eventsToFire[key] = true;

      for (var eventKey in eventsToFire) if (eventsToFire[eventKey] === false) return;

      eventsFired = true;

      done();
    };

    adminClient.on('reconnect/scheduled', function () {
      fireEvent('reconnect/scheduled');
    });

    adminClient.on('reconnect/successful', function () {
      fireEvent('reconnect/successful');
    });

    for (var key in mesh._mesh.happn.server.connections)
      mesh._mesh.happn.server.connections[key].destroy();
  });

  var endedConnections = {};

  var endedConnectionDone = false;

  it('tests the connection end event', function (done) {
    adminClient.on('connection/ended', function (evt) {
      if (endedConnections[evt])
        return done(new Error('connection ended called twice for same session'));

      if (!endedConnectionDone) {
        endedConnectionDone = true;
        done();
      }
    });

    mesh.stop({ reconnect: false }, function (e) {
      if (e) return done(e);
    });
  });
});
