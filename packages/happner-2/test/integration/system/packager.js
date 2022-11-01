require('../../__fixtures/utils/test_helper').describe({ timeout: 15e3 }, (test) => {
  let path = require('path');
  let Mesh = test.Mesh;
  let libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'mesh'].join(path.sep) +
    path.sep;

  let config = {
    name: 'stopMesh',
    modules: {
      stopMeshModule1: {
        path: libFolder + '9-stop-mesh-module',
      },
      stopMeshModule2: {
        path: libFolder + '9-stop-mesh-module-2',
      },
    },
    components: {
      component1: {
        moduleName: 'stopMeshModule1',
        // scope: "component",//either component(mesh aware) or module - default is module
        startMethod: 'start',
        stopMethod: 'stop',
        schema: {
          exclusive: false, //means we dont dynamically share anything else
          methods: {
            start: {
              type: 'sync',
              parameters: [{ required: true, value: { message: 'this is a start parameter' } }],
            },
          },
        },
      },
      component2: {
        moduleName: 'stopMeshModule2',
        stopMethod: 'stop',
        // scope: "component",
        schema: {
          exclusive: false,
          methods: {},
        },
      },
    },
  };

  var mesh;

  after(function (done) {
    if (mesh) mesh.stop({ reconnect: false }, done);
  });

  var startMesh = function (callback) {
    mesh = new Mesh();
    mesh.initialize(config, callback);
  };

  it('starts the mesh, checks the packagers watchers, stops the mesh ensures there are no more watchers', function (done) {
    startMesh(function (e) {
      if (e) return done(e);
      test.expect(mesh.__packager.__fileWatchers.length > 0).to.be(true);
      mesh.stop({ reconnect: false }, function (e, mesh) {
        if (e) return done(e);
        test.expect(mesh.__packager.__fileWatchers.length === 0).to.be(true);
        done();
      });
    });
  });

  it('restarts a same mesh, checks the packagers watchers', function (done) {
    startMesh(function (e) {
      if (e) return done(e);
      test.expect(mesh.__packager.__fileWatchers.length > 0).to.be(true);
      mesh.stop({ reconnect: false }, function (e) {
        if (e) return done(e);
        test.expect(mesh.__packager.__fileWatchers.length === 0).to.be(true);
        mesh.initialize(config, function (e) {
          if (e) return done(e);
          test.expect(mesh.__packager.__fileWatchers.length > 0).to.be(true);
          mesh.exchange.component1.echo('test', function (e, response) {
            test.expect(e).to.be(null);
            test.expect(response).to.be('test');
            done();
          });
        });
      });
    });
  });
});
