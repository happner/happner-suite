module.exports = TestComponent;

function TestComponent() {}

TestComponent.prototype.method1 = function ($happn, args, callback) {
  callback = args; // callback comes in position1
  callback(null, 'result1');
};

TestComponent.prototype.method2 = function ($happn, args, callback) {
  callback(null, 'result2');
};

if (global.TESTING_C5) return; // When 'requiring' the module above,

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  /*
   * Note: also tests that args arrive in the called sequence.
   *
   * eg. When calling function(arg1, callback) with only the callback os the only arg
   *     then the resulting call actoss the exchange has arg1 as the callback
   *     and callback as undefined)
   *
   */
  let testMesh;

  before(function () {
    global.TESTING_C5 = true; //.............
  });

  beforeEach(function (done) {
    test.Mesh.create({
      port: 54545,
      modules: {
        test: {
          path: __filename,
        },
      },
      components: {
        test: {
          module: 'test',
        },
      },
    })
      .then(function (mesh) {
        testMesh = mesh;
      })
      .then(done)
      .catch(done);
  });

  afterEach(function (done) {
    testMesh.stop({ reconnect: false }, done);
  });

  it('server can call more than one method in sequence (callback)', function (done) {
    var mesh = testMesh;
    mesh.exchange.test.method1(function (e, result) {
      if (e) return done(e);
      test.expect(result).to.equal('result1');
      var args = {};
      mesh.exchange.test.method2(args, function (e, result) {
        if (e) return done(e);
        test.expect(result).to.equal('result2');
        done();
      });
    });
  });

  it('server can call more than one method in sequence (promise)', function (done) {
    var mesh = testMesh;
    mesh.exchange.test
      .method1()

      .then(function (result) {
        test.expect(result).to.equal('result1');
        var args = {};
        return mesh.exchange.test.method2(args);
      })

      .then(function (result) {
        test.expect(result).to.equal('result2');
      })

      .then(done)
      .catch(done);
  });

  it('client can call more than one method in sequence (callback)', function (done) {
    var client = new test.Mesh.MeshClient({
      port: 54545,
    });
    client.login().then(function () {
      client.exchange.test.method1(function (e, result) {
        if (e) return done(e);
        test.expect(result).to.equal('result1');

        var args = {};

        client.exchange.test.method2(args, function (e, result) {
          if (e) return done(e);
          test.expect(result).to.equal('result2');
          done();
        });
      });
    });
  });

  it('client can call more than one method in sequence (promise)', function (done) {
    var client = new test.Mesh.MeshClient({
      port: 54545,
    });
    client.login().then(function () {
      client.exchange.test
        .method1()
        .then(function (result) {
          test.expect(result).to.equal('result1');
          var args = {};
          return client.exchange.test.method2(args);
        })
        .then(function (result) {
          test.expect(result).to.equal('result2');
        })
        .then(done)
        .catch(done);
    });
  });
});
