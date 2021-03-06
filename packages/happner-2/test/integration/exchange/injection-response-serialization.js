require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var path = require('path');
  var sep = require('path').sep;
  var libFolder =
    path.resolve(__dirname, '../../..') +
    sep +
    ['test', '__fixtures', 'test', 'integration', 'exchange'].join(sep) +
    sep;
  var maximumPings = 1000;
  var Mesh = test.Mesh;

  var config = {
    name: 'testInjectionResponse',
    modules: {
      module1: {
        path: libFolder + '12-module1',
        construct: {
          type: 'sync',
          parameters: [{ value: { maximumPings: maximumPings } }],
        },
      },
    },
    components: {
      component1: {
        moduleName: 'module1',
      },
    },
  };

  var mesh;

  it('starts the mesh, listens for the ping pong completed event, that module1 emits', function (done) {
    mesh = new Mesh();

    mesh.initialize(config, function (err) {
      if (err) {
        //eslint-disable-next-line
          console.log(err.stack);
        done(err);
      } else {
        mesh.exchange.component1.exposedMethod('a message', function () {
          setTimeout(function () {
            done();
          }, 2000);
        });
      }
    });
  });

  after(function (done) {
    mesh.stop({ reconnect: false }, done);
  });
});
