require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const path = require('path');
  const libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'security'].join(path.sep) +
    path.sep;
  const remoteConfig = require(libFolder + 'secure-mesh-to-mesh-single-process-config');
  let mesh;

  context('on remote mesh', function () {
    var remoteMesh;

    var config = {
      name: 'mesh2',
      happn: {
        secure: true,
        port: 51233,
      },
      endpoints: {
        remoteMesh: {
          // remote mesh node
          config: {
            port: 51231,
            username: '_ADMIN',
            password: 'testb2', // TODO This was necessary, did not default
          },
        },
      },
      modules: {},
      components: {},
    };

    this.timeout(120000);

    before(function (done) {
      test.Mesh.create(remoteConfig)

        .then(function (createdMesh) {
          remoteMesh = createdMesh;
        })

        .then(function () {
          return test.Mesh.create(config);
        })

        .then(function (createdMesh) {
          mesh = createdMesh;
        })

        .then(function () {
          done();
        })
        .catch(done);
    });

    after(function (done) {
      remoteMesh
        .stop({ reconnect: false })
        .then(function () {
          done();
        })
        .catch(done);
    });

    after(function (done) {
      mesh
        .stop({ reconnect: false })
        .then(function () {
          done();
        })
        .catch(done);
    });

    it('can call remote component function', function (done) {
      mesh.event.remoteMesh.remoteComponent.on(
        'whoops',
        function handler() {
          //console.log(data);
          done();
        },
        function callback(err) {
          if (err) done(err);
        }
      );

      mesh.exchange.remoteMesh.remoteComponent.remoteFunction(
        'one!',
        'two!',
        'three!',
        function (err, res) {
          test.assert(res === 'one! two! three!, wheeeeeeeeeeeeheeee!');
        }
      );
    });

    it('we know when there was an accident', function (done) {
      mesh.exchange.remoteMesh.remoteComponent.causeError(function (err) {
        test.assert(err.toString().match(/ErrorType: Error string/));
        done();
      });
    });
  });
});
