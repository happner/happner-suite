module.exports = Explicit;
let thisTest;

var DONE = false;

var INITIALIZED = false;

function Explicit() {}

Explicit.prototype.asyncStart = function ($happn, opts, optionalOpts, callback) {
  if (typeof callback === 'undefined') callback = optionalOpts;

  setTimeout(function () {
    DONE = true;
    callback(null);
  }, 200);
};

Explicit.prototype.asyncInit = function ($happn, opts, optionalOpts, callback) {
  if (typeof callback === 'undefined') callback = optionalOpts;

  thisTest.expect(opts.op).to.be('tions');

  setTimeout(function () {
    INITIALIZED = true;
    callback(null);
  }, 200);
};

Explicit.prototype.asyncStartFails = function (callback) {
  callback(new Error('erm'));
};

Explicit.prototype.asyncInitFails = function (callback) {
  callback(new Error('erm'));
};

Explicit.prototype.methodName1 = function (opts, blob, callback) {
  if (typeof blob === 'function') callback = blob;
  callback(null, { yip: 'eee', state: { started: DONE, initialized: INITIALIZED } });
};

if (global.TESTING_16) return; // When 'requiring' the module above,

var mesh;
var anotherMesh;
var Mesh = require('../../..');

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  thisTest = test;
  before(function (done) {
    global.TESTING_16 = true; //.............

    mesh = this.mesh = new Mesh();

    mesh.initialize(
      {
        util: {
          // logLevel: 'error'
        },
        happn: {
          port: 8001,
        },
        modules: {
          expliCit: {
            path: __filename,
          },
        },
        components: {
          explicit: {
            moduleName: 'expliCit',
            startMethod: 'asyncStart',
            initMethod: 'asyncInit',
            schema: {
              exclusive: true,
              methods: {
                asyncInit: {
                  type: 'async',
                  parameters: [
                    { name: 'opts', required: true, value: { op: 'tions' } },
                    { name: 'optionalOpts', required: false },
                    { type: 'callback', required: true },
                  ],
                  callback: {
                    parameters: [{ type: 'error' }],
                  },
                },
                asyncStart: {
                  type: 'async',
                  parameters: [
                    { name: 'opts', required: true, value: { op: 'tions' } },
                    { name: 'optionalOpts', required: false },
                    { type: 'callback', required: true },
                  ],
                  callback: {
                    parameters: [{ type: 'error' }],
                  },
                },
                methodName1: {
                  // alias: 'm1',
                  parameters: [
                    { name: 'opts', required: true, value: { op: 'tions' } },
                    { name: 'blob', required: false },
                    { type: 'callback', required: true },
                  ],
                },
              },
            },
          },
        },
      },
      function (err) {
        if (err) return done(err);

        mesh.start(function (err) {
          if (err) {
            //eslint-disable-next-line
              console.log(err.stack);
            return done(err);
          }
          return done();
        });
      }
    );
  });

  after(function (done) {
    delete global.TESTING_16; //.............
    mesh.stop({ reconnect: false }, function (e) {
      if (e) return done(e);
      anotherMesh.stop({ reconnect: false }, done);
    });
  });

  it('validates start and init methods', function (done) {
    this.mesh.api.exchange.explicit.methodName1({ op: 'tions3' }, function (err, res) {
      test.expect(res.state.started).to.be(true);
      test.expect(res.state.initialized).to.be(true);

      done();
    });
  });

  it('has called back with error into the mesh start callback because the component start failed', function (done) {
    anotherMesh = new Mesh();

    anotherMesh.initialize(
      {
        util: {
          logger: {},
        },
        happn: {
          port: 8002,
        },
        modules: {
          expliCit: {
            path: __filename,
          },
        },
        components: {
          explicit: {
            moduleName: 'expliCit',
            initMethod: 'asyncInitFails',
            schema: {
              methods: {
                asyncInitFails: {
                  type: 'async',
                  parameters: [{ type: 'callback', required: true }],
                  callback: {
                    parameters: [{ type: 'error' }],
                  },
                },
              },
            },
          },
        },
      },
      function (err) {
        if (err) return done(err);

        anotherMesh.start(function (err) {
          test.expect(err).to.exist;
          done();
        });
      }
    );
  });
});
