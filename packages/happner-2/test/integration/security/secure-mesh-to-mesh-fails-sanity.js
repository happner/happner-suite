require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var path = require('path');
  context('on remote mesh fails', function () {
    var spawn = require('child_process').spawn,
      remote,
      mesh,
      Mesh = test.Mesh;

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
            password: 'thispasswordwontwork', // TODO This was necessary, did not default
          },
        },
      },
      modules: {},
      components: {},
    };

    after(function (done) {
      remote.kill();
      mesh.stop({ reconnect: false }, function () {
        done();
      });
    });

    this.timeout(120000);

    it('cannot connect endpoint - mesh start fails', function (done) {
      remote = spawn('node', [libFolder + 'secure-mesh-to-mesh-fails']);
      remote.stdout.on('data', function (data) {
        if (data.toString().match(/READY/)) {
          mesh = new Mesh();
          mesh.initialize(config, function (e) {
            if (!e) return done(new Error('this should not have been possible'));

            test.assert(e.toString() === 'AccessDenied: Invalid credentials');

            done();
          });
        }
      });
    });
  });
});
