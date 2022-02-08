require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var should = test.should();
  var path = test.path;

  var meshpath = path.join(__dirname, '../../../lib/mesh');

  var libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'component'].join(path.sep);

  var happner = require(meshpath);

  var testComponentPath = path.join(libFolder, 'system-component-initialization.js');

  var mesh = new happner();

  var config = {
    happn: {
      secure: true,
    },
    modules: {
      testComponent: {
        path: testComponentPath,
      },
    },
    components: {
      testComponent: {
        name: 'testComponent',
        moduleName: 'testComponent',
        startMethod: 'start',
        schema: {
          exclusive: false,
          methods: {
            start: {
              type: 'async',
            },
          },
        },
      },
    },
  };

  after('should stop the happn server', function (done) {
    mesh.stop({ reconnect: false }, done);
  });

  it('should start a user component that expects the security layer to be initialized', function (done) {
    mesh.initialize(config, function (err) {
      //eslint-disable-next-line
        if (err) console.log(err);
      should.not.exist(err);

      mesh.start(function (err) {
        //eslint-disable-next-line
          if (err) console.log(err);
        should.not.exist(err);
        done();
      });
    });
  });
});
