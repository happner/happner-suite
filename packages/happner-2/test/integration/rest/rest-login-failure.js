/* RUN: LOG_LEVEL=off mocha test/18-exchange-promises.js */

module.exports = SeeAbove;

function SeeAbove() {}

SeeAbove.prototype.method1 = function (opts, callback) {
  if (opts.errorAs === 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs === 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.method2 = function (opts, callback) {
  if (opts.errorAs === 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs === 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.method3 = function ($happn, $origin, opts, callback) {
  if (opts.errorAs === 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs === 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.method4 = function ($happn, $origin, number, another, callback) {
  callback(null, { product: parseInt(number) + parseInt(another) });
};

SeeAbove.prototype.method5 = function ($happn, $origin, $userSession, $restParams, callback) {
  $restParams.$userSession = $userSession;
  $restParams.$origin = $origin;
  callback(null, $restParams);
};

SeeAbove.prototype.method6 = function succeedWithEmptyResponse(
  $happn,
  $origin,
  $userSession,
  $restParams,
  callback
) {
  callback();
};

SeeAbove.prototype.synchronousMethod = function (opts, opts2) {
  return opts + opts2;
};

SeeAbove.prototype.$happner = {
  config: {
    testComponent: {
      schema: {
        methods: {
          methodName1: {
            alias: 'ancientmoth',
          },
          methodName2: {
            alias: 'ancientmoth',
          },
          synchronousMethod: {
            type: 'sync-promise', //NB - this is how you can wrap a synchronous method with a promise
          },
        },
      },
    },
  },
};

if (global.TESTING_E3B) return; // When 'requiring' the module above,

var path = require('path');

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const spawn = require('child_process').spawn;
  const Mesh = test.Mesh;
  const libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'rest'].join(path.sep) +
    path.sep;

  let REMOTE_MESH = 'remote-mesh-secure.js';
  let ADMIN_PASSWORD = 'ADMIN_PASSWORD';
  let mesh, remote;

  before(function (done) {
    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + REMOTE_MESH]);
    remote.stdout.on('data', function (data) {
      if (data.toString().match(/READY/)) {
        clearTimeout();
        setTimeout(function () {
          done();
        }, 1000);
      }
    });
  });

  before(function (done) {
    global.TESTING_E3B = true;
    Mesh.create(
      {
        name: 'e3b-test',
        happn: {
          secure: true,
          adminPassword: ADMIN_PASSWORD,
          port: 10000,
        },
        modules: {
          testComponent: {
            path: __filename,
          },
        },
        components: {
          testComponent: {},
        },
      },
      function (err, instance) {
        delete global.TESTING_E3B;
        if (err) return done(err);
        mesh = instance;
        done();
      }
    );
  });

  after(async () => {
    if (remote) remote.kill();
    if (mesh) await mesh.stop({ reconnect: false });
  });

  var login = function (done, credentials) {
    var restClient = require('restler');

    var operation = {
      username: '_ADMIN',
      password: ADMIN_PASSWORD,
    };

    if (credentials) operation = credentials;

    restClient
      .postJson('http://127.0.0.1:10000/rest/login', operation)
      .on('complete', function (result) {
        if (result.error) return done(new Error(result.error.message), result);
        done(null, result);
      });
  };

  it('tests the rest components login method over the wire', function (done) {
    login(function (e, response) {
      if (e) return done(e);
      test.expect(response.data.token).to.not.be(null);
      done();
    });
  });

  it('tests the rest components login method fails', function (done) {
    login(
      function (e, result) {
        test.expect(e).to.not.be(null);
        test.expect(result.error.message).to.be('Invalid credentials');
        test.expect(result.error.code).to.be(401);
        done();
      },
      { username: 'bad', password: 'bad' }
    );
  });
});
