require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const path = require('path');
  context('on remote mesh', function () {
    var spawn = require('child_process').spawn,
      remote,
      mesh,
      Mesh = require('../../..');

    var libFolder =
      path.resolve(__dirname, '../../..') +
      path.sep +
      ['test', '__fixtures', 'test', 'integration', 'security'].join(path.sep) +
      path.sep;

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
      remote = spawn('node', [libFolder + 'secure-mesh-to-mesh']);
      remote.stdout.on('data', function (data) {
        if (data.toString().match(/READY/)) {
          mesh = new Mesh();
          mesh.initialize(config, function (e) {
            if (e) return done(e);
            mesh.start(done);
          });
        }
      });
    });

    after(function (done) {
      remote.kill();
      mesh.stop({ reconnect: false }, function () {
        // console.log('killed ok:::', remote.pid);
        done();
      });
    });

    it('can call remote component function', function (done) {
      mesh.exchange.remoteMesh.remoteComponent.remoteFunction(
        'one!',
        'two!',
        'three!',
        function (err, res) {
          test.assert(res === 'one! two! three!, wheeeeeeeeeeeeheeee!');
          done();
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
