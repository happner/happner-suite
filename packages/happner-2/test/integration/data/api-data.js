require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var maximumPings = 1000;
  var mesh;
  var libFolder =
    test.commons.path.resolve(__dirname, '../../..') +
    test.commons.path.sep +
    ['test', '__fixtures', 'test', 'integration', 'data'].join(test.commons.path.sep);
  var Mesh = require('../../..');
  var config = {
    name: 'testProtectedDataAPI',
    modules: {
      module1: {
        path: libFolder + test.commons.path.sep + 'api-data-module1',
        construct: {
          type: 'sync',
          parameters: [{ value: { maximumPings: maximumPings } }],
        },
      },
      module2: {
        path: libFolder + test.commons.path.sep + 'api-data-module2',
        construct: {
          type: 'sync',
        },
      },
    },
    components: {
      component1: {
        moduleName: 'module1',
        startMethod: 'start',
        schema: {
          exclusive: false, //means we dont dynamically share anything else
          methods: {
            start: {
              type: 'async',
              parameters: [{ required: true, value: { message: 'this is a start parameter' } }],
            },
          },
        },
      },
      component2: {
        moduleName: 'module2',
        schema: {
          exclusive: false,
        },
      },
    },
  };

  after(function (done) {
    mesh.stop({ reconnect: false }, done);
  });

  before(function (done) {
    Mesh.create(config)
      .then(function (created) {
        mesh = created;
        done();
      })
      .catch(done);
  });

  it('stores some data on component1, we look at the output from happn', function (done) {
    mesh.exchange.component1.storeData(
      '/test/integration/data/api-data',
      { testprop1: 'testval1' },
      {},
      function (e, result) {
        result._meta.path.should.equal('/_data/component1/test/integration/data/api-data');

        setTimeout(done, 200); //so the on picks something up?
      }
    );
  });

  //relies on above store test!!!
  it('checks the on count on component1 must be greater than 0', function (done) {
    mesh.exchange.component1.getOnCount(function (e, result) {
      if (!result || result === 0) return done(new Error('result should be greater than 0'));
      done();
    });
  });

  it('checks that component1 can count data values', function (done) {
    mesh.exchange.component1.storeData(
      '/test/integration/data/count-data',
      { testprop1: 'testval1' },
      {},
      function (e) {
        test.expect(e).to.not.exist;
        mesh.exchange.component1.getCount(
          '/test/integration/data/count-data',
          function (e, result) {
            test.expect(result.value).to.eql(1);
            done();
          }
        );
      }
    );
  });

  it('increments a gauge using $happn.data on the test component', function (done) {
    mesh.exchange.component1.incrementGauge(
      'my/test/gauge',
      'custom_counter',
      1,
      function (e, result) {
        if (e) return done(e);

        test.expect(result.value).to.be(1);
        test.expect(result.gauge).to.be('custom_counter');

        done();
      }
    );
  });

  it('should delete multiple items filtered by criteria', async () => {
    await mesh.exchange.component1.deleteWithOptions();
  });
});
