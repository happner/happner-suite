require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var path = require('path');
  var Mesh = require('../../..');
  var libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'client'].join(path.sep);
  var serverMesh;

  after(function () {
    return serverMesh.stop();
  });

  var testClient;

  var config = require(path.join(libFolder, 'websocket-client-mesh-config'));

  function createMesh() {
    return Mesh.create(config).then(function (meshInstance) {
      serverMesh = meshInstance;
    });
  }

  before(function () {
    return createMesh().then(function () {
      testClient = new Mesh.MeshClient({ port: 3111 });
      return testClient.login({
        username: '_ADMIN',
        password: 'password',
      });
    });
  });

  it('stops the current happn client before creating a new one on login', function () {
    var currentData = testClient.data;

    test.expect(currentData.status).to.equal(1);

    return testClient
      .login({
        username: '_ADMIN',
        password: 'password',
      })
      .then(function () {
        var newData = testClient.data;

        test.expect(newData).to.not.equal(currentData);

        test.expect(currentData.status).to.equal(2);

        test.expect(newData.status).to.equal(1);
      });
  });

  it('has no client running if the login fails', function (done) {
    var newClient = new Mesh.MeshClient({ port: 3111 });

    testClient
      .disconnect()
      .then(function () {
        return newClient.login({
          username: '_ADMIN',
          password: 'bad_password',
        });
      })
      .catch(function (err) {
        test.expect(err.message).to.equal('Invalid credentials');
        test.expect(newClient.data).to.be(undefined);
        serverMesh
          .stop()
          .then(function () {
            return createMesh();
          })
          .then(function () {
            serverMesh._mesh.happn.server.services.session.primus.on(
              'connection',
              waitForNoConnection
            );
            setTimeout(function () {
              serverMesh._mesh.happn.server.services.session.primus.removeListener(
                'connection',
                waitForNoConnection
              );
              done();
            }, 5000);
          });
      });

    function waitForNoConnection() {
      serverMesh._mesh.happn.server.services.session.primus.removeListener(
        'connection',
        waitForNoConnection
      );
      done(new Error('The client should not try to connect anymore'));
    }
  });
});
