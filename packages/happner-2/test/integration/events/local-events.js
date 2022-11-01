require('../../__fixtures/utils/test_helper').describe({ timeout: 10e3 }, (test) => {
  var server;

  before('start server', function (done) {
    test.Mesh.create({
      modules: {
        component1: {
          instance: {
            start: function ($happn, callback) {
              this.interval = setInterval(function () {
                $happn.localEventEmitter.emit('eventName', { some: 'data' });
              }, 100);
              callback();
            },
            stop: function ($happn, callback) {
              clearInterval(this.interval);
              callback();
            },
          },
        },
        component2: {
          instance: {
            awaitLocalEvent: function ($happn, callback) {
              $happn.localEvent.component1.once('eventName', function (data) {
                callback(null, data);
              });
            },
          },
        },
      },
      components: {
        component1: {
          startMethod: 'start',
          stopMethod: 'stop',
        },
        component2: {},
      },
    })
      .then(function (_server) {
        server = _server;
      })
      .then(done)
      .catch(done);
  });

  after('stop server', function (done) {
    if (!server) return done();
    server.stop({ reconnect: false }, done);
  });

  it('can subscribe to and emit local events from within components', function (done) {
    server.exchange.component2
      .awaitLocalEvent()
      .then(function (result) {
        test.expect(result).to.eql({ some: 'data' });
      })
      .then(done)
      .catch(done);
  });

  it('can subscribe to local events from mesh', function (done) {
    server.localEvent.component1.once('eventName', function (data) {
      test.expect(data).to.eql({ some: 'data' });
      done();
    });
  });
});
