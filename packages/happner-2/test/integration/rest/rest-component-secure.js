/* RUN: LOG_LEVEL=off mocha test/18-exchange-promises.js */
/* eslint-disable no-undef */
/* eslint-disable no-console */
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

// eslint-disable-next-line
if (global.TESTING_E3B) return; // When 'requiring' the module above,

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const spawn = require('child_process').spawn;
  const Mesh = require('../../..');
  const path = require('path');
  const libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'rest'].join(path.sep) +
    path.sep;
  const REMOTE_MESH = 'remote-mesh-secure.js';
  const ADMIN_PASSWORD = 'ADMIN_PASSWORD';
  let mesh, remote;

  var startRemoteMesh = function (callback) {
    var timedOut = setTimeout(function () {
      callback(new Error('remote mesh start timed out'));
    }, 10000);
    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + REMOTE_MESH]);
    remote.stdout.on('data', function (data) {
      console.log(data.toString());
      if (data.toString().match(/READY/)) {
        clearTimeout(timedOut);
        setTimeout(function () {
          callback();
        }, 1000);
      }
    });
    remote.stderr.on('data', function (err) {
      console.log(err.toString());
    });
  };

  before(function (done) {
    global.TESTING_E3B = true; //.............

    startRemoteMesh(function (e) {
      if (e) return done(e);

      try {
        Mesh.create(
          {
            name: 'e3b-test',
            happn: {
              secure: true,
              adminPassword: ADMIN_PASSWORD,
              port: 10000,
            },
            util: {
              // logger: {}
            },
            modules: {
              testComponent: {
                path: __filename, // .............
              },
            },
            components: {
              testComponent: {},
            },
            endpoints: {
              remoteMesh: {
                // remote mesh node
                config: {
                  secure: true,
                  port: 10001,
                  host: '127.0.0.1',
                  username: '_ADMIN',
                  password: ADMIN_PASSWORD,
                },
              },
            },
          },
          function (err, instance) {
            delete global.TESTING_E3B; //.............
            mesh = instance;

            if (err) {
              remote.kill();
              return done(err);
            }

            mesh.exchange.remoteMesh.remoteComponent.remoteFunction(
              'one',
              'two',
              'three',
              function (err) {
                if (err) return done(err);
                done();
              }
            );
          }
        );
      } catch (e) {
        done(e);
      }
    });
  });

  after(async () => {
    if (remote) remote.kill();
    if (mesh) await mesh.stop({ reconnect: false });
  });

  var happnUtils = require('../../../lib/system/utilities');

  var mock$Happn = {
    as: () => {
      return mock$Happn;
    },
    log: {
      error: test.sinon.stub(),
      warn: test.sinon.stub(),
      debug: test.sinon.stub(),
      info: test.sinon.stub(),
    },
    happn: {},
    _mesh: {
      on: () => {},
      utilities: happnUtils,
      config: {
        name: 'e3b-test',
        happn: {
          secure: true,
          port: 10000,
        },
      },
      description: {
        name: 'e3b-test',
      },
      endpoints: {},
      happn: {
        server: {
          services: {},
        },
      },
    },
    exchange: {
      testComponent: {
        method1: function (opts, callback) {
          opts.number++;
          callback(null, opts);
        },
      },
    },
  };

  var mock$Origin = {
    test: 'data',
  };

  var mockResponse = {
    writeHead: function (code, header) {
      this.header = { code: code, header: header };
    },
  };

  it('tests the rest components __respond method', function (done) {
    var RestModule = require('../../../lib/modules/rest/index.js');
    var restModule = new RestModule();

    var testStage = 'success';

    mockResponse.end = function (responseString) {
      try {
        var response = JSON.parse(responseString);
        // eslint-disable-next-line default-case
        switch (testStage) {
          case 'success':
            test.expect(response.message).to.be('test success response');
            test.expect(response.message).to.be('test success response');
            test.expect(response.data.test).to.be('$$data$&');
            testStage = 'success-empty';
            restModule.__respond(
              mock$Happn,
              'test empty success response',
              undefined,
              undefined,
              mockResponse
            );
            return;
          case 'success-empty':
            test.expect(response.message).to.be('test empty success response');
            test.expect(response.error).to.be(null);
            test.expect(response.data).to.be(null);
            testStage = 'error';
            restModule.__respond(
              mock$Happn,
              'test error response',
              { test: 'data' },
              new Error('a test error'),
              mockResponse
            );
            return;
          case 'error':
            test.expect(response.error).to.not.be(null);
            test.expect(response.error.message).to.be('a test error');
            test
              .expect(mock$Happn.log.warn.lastCall.firstArg)
              .to.be('rpc request failure: a test error');
            return done();
        }
        //TODO: an untest.expected GET or POST with a non-json content
      } catch (e) {
        done(e);
      }
    };

    restModule.__respond(
      mock$Happn,
      'test success response',
      { test: '$$data$&' },
      null,
      mockResponse
    );
  });

  it('tests the rest components __parseBody method', function (done) {
    var RestModule = require('../../../lib/modules/rest/index.js');
    var restModule = new RestModule();

    var MockRequest = require('../../__fixtures/utils/helper_mock_req');
    var request = new MockRequest({
      method: 'POST',
      url: '/rest/api',
      headers: {
        Accept: 'application/json',
      },
    });

    request.write({
      uri: '/testComponent/methodName1',
      parameters: {
        opts: {
          number: 1,
        },
      },
    });

    request.end();

    mockResponse.end = function (responseString) {
      var response = JSON.parse(responseString);

      if (!response.error) return done(new Error('bad response test.expected error'));

      done(new Error(response.error));
    };

    restModule.__parseBody(request, mockResponse, mock$Happn, function (body) {
      test.expect(body).to.not.be(null);
      test.expect(body).to.not.be(undefined);
      test.expect(body.uri).to.be('/testComponent/methodName1');
      test.expect(body.parameters.opts.number).to.be(1);

      done();
    });
  });

  var mockLogin = function (restModule, done) {
    if (!mock$Happn._mesh.happn) mock$Happn._mesh.happn = {};

    if (!mock$Happn._mesh.happn.server) mock$Happn._mesh.happn.server = {};

    if (!mock$Happn._mesh.happn.server.services) mock$Happn._mesh.happn.server.services = {};

    if (!mock$Happn._mesh.happn.server.services.security)
      mock$Happn._mesh.happn.server.services.security = {};

    mock$Happn._mesh.happn.server.services.security.authorize = function (
      origin,
      accessPoint,
      action,
      callback
    ) {
      try {
        test.expect(origin.test).to.be('data');
        test.expect(action).to.be('set');

        callback();
      } catch (e) {
        callback(e);
      }
    };

    mock$Happn._mesh.happn.server.services.security.login = function (
      _credentials,
      _sessionId,
      _request,
      callback
    ) {
      callback(null, { token: 'test' });
    };

    restModule.initialize(mock$Happn, function (e) {
      if (e) return done(e);

      var MockRequest = require('../../__fixtures/utils/helper_mock_req');
      var request = new MockRequest({
        method: 'POST',
        url: '/rest/login',
        headers: {
          Accept: 'application/json',
        },
      });

      request.write({
        username: '_ADMIN',
        password: ADMIN_PASSWORD,
      });

      request.end();

      mockResponse.end = function (responseString) {
        var response = JSON.parse(responseString);

        if (response.error) return done(new Error(response.error.message));

        test.expect(response.data.token).to.not.be(null);
        done();
      };

      restModule.login(mock$Happn, request, mockResponse);
    });
  };

  it('tests the rest components login method', function (done) {
    var RestModule = require('../../../lib/modules/rest/index.js');
    var restModule = new RestModule();

    mockLogin(restModule, done);
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
        if (result.error) return done(new Error(result.error.message));
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

  it('tests the rest components authorize method, successful', function (done) {
    var RestModule = require('../../../lib/modules/rest/index.js');
    var restModule = new RestModule();

    mockLogin(restModule, function (e) {
      if (e) return done(e);

      mock$Happn._mesh.happn.server.services.security = {
        users: {
          userBelongsToGroups: () => {
            return new Promise((resolve) => {
              resolve(true);
            });
          },
        },
        authorize: function (origin, accessPoint, action, callback) {
          try {
            test.expect(origin.test).to.be('data');
            test.expect(accessPoint).to.be('/_exchange/requests/e3b-test/test/method');
            test.expect(action).to.be('set');

            callback(null, true);
          } catch (e) {
            callback(e);
          }
        },
      };

      var MockRequest = require('../../__fixtures/utils/helper_mock_req');

      var request = new MockRequest({
        method: 'POST',
        url: '/rest/api',
        headers: {
          Accept: 'application/json',
        },
      });

      request.write({
        uri: '/testComponent/methodName1',
        parameters: {
          opts: {
            number: 1,
          },
        },
      });

      mockResponse.end = function (responseString) {
        done(new Error('this was not meant to happn: ' + responseString));
      };

      restModule.__securityService = mock$Happn._mesh.happn.server.services.security;
      restModule.__validateCredentialsGetOrigin(
        mock$Happn,
        mock$Origin,
        mockResponse,
        'testComponent/methodName1',
        'testUser',
        (authorizedOrigin) => {
          test.expect(authorizedOrigin.username).to.be('testUser');
          done();
        }
      );
    });
  });

  it('tests the rest components describe method over the api', function (done) {
    var restClient = require('restler');

    login(function (e, result) {
      if (e) return done(e);

      restClient
        .get('http://127.0.0.1:10000/rest/describe?happn_token=' + result.data.token)
        .on('complete', function (result) {
          test.expect(result.data['/testComponent/method1']).to.not.be(null);
          test.expect(result.data['/testComponent/method2']).to.not.be(null);

          done();
        });
    });
  });

  it('tests the rest components handleRequest method', function (done) {
    var RestModule = require('../../../lib/modules/rest/index.js');
    var restModule = new RestModule();

    var MockRequest = require('../../__fixtures/utils/helper_mock_req');
    var request = new MockRequest({
      method: 'POST',
      url: '/testComponent/method1',
      headers: {
        Accept: 'application/json',
      },
    });

    var operation = {
      parameters: {
        opts: { number: 1 },
      },
    };

    request.write(operation);
    request.end();

    mockLogin(restModule, function (e) {
      if (e) return done(e);

      mock$Happn._mesh.happn.server.services.security = {
        authorize: function (_origin, _accessPoint, _action, callback) {
          callback(null, true);
        },
      };

      restModule.__securityService = mock$Happn._mesh.happn.server.services.security;

      mockResponse.end = function (responseString) {
        var response = JSON.parse(responseString);
        test.expect(response.data.number).to.be(2);
        done();
      };

      restModule.__exchangeDescription = {
        components: {
          testComponent: {
            methods: {
              method1: {
                parameters: [{ name: 'opts' }, { name: 'callback' }],
              },
            },
          },
        },
      };

      restModule.handleRequest(request, mockResponse, mock$Happn, mock$Origin);
    });
  });

  it('tests posting an empty operation without parameters to a local method using $restParams', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      var operation = {};

      restClient
        .postJson(
          'http://127.0.0.1:10000/rest/method/testComponent/method5?happn_token=' +
            result.data.token,
          operation
        )
        .on('complete', function (result) {
          test.expect(result.data.$origin.username).to.be('_ADMIN');
          test.expect(result.data.$userSession.username).to.be('_ADMIN');
          done();
        });
    });
  });

  it('tests posting an operation to a local method', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      var operation = {
        parameters: {
          opts: { number: 1 },
        },
      };

      restClient
        .postJson(
          'http://127.0.0.1:10000/rest/method/testComponent/method1?happn_token=' +
            result.data.token,
          operation
        )
        .on('complete', function (result) {
          test.expect(result.data.number).to.be(2);
          done();
        });
    });
  });

  it('tests posting an operation using a Bearer auth token', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      var operation = {
        parameters: {
          opts: { number: 1 },
        },
      };

      var options = { headers: {} };
      options.headers.authorization = 'Bearer ' + result.data.token;

      restClient
        .postJson('http://127.0.0.1:10000/rest/method/testComponent/method1', operation, options)
        .on('complete', function (result) {
          //eslint-disable-next-line
            if (result.error) console.log(result.error.message);
          test.expect(result.data.number).to.be(2);
          done();
        });
    });
  });

  it('tests getting an operation from a local method with a simple parameter set', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      restClient
        .get(
          'http://127.0.0.1:10000/rest/method/testComponent/method4?number=1&another=2&happn_token=' +
            result.data.token
        )
        .on('complete', function (result) {
          test.expect(result.data.product).to.be(3);
          done();
        });
    });
  });

  it('tests getting an operation from a local method with a serialized parameter', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      var operation = {
        parameters: {
          number: 1,
          another: 2,
        },
      };

      var encoded = encodeURIComponent(JSON.stringify(operation));

      restClient
        .get(
          'http://127.0.0.1:10000/rest/method/testComponent/method4?encoded_parameters=' +
            encoded +
            '&happn_token=' +
            result.data.token
        )
        .on('complete', function (result) {
          test.expect(result.data.product).to.be(3);
          done();
        });
    });
  });

  it('tests logging in using GET', function (done) {
    var restClient = require('restler');

    restClient
      .get('http://127.0.0.1:10000/rest/login?username=_ADMIN&password=' + ADMIN_PASSWORD)
      .on('complete', function (result) {
        test.expect(result.error).to.be(null);
        test.expect(result.data.token).to.not.be(null);

        restClient
          .get(
            'http://127.0.0.1:10000/rest/method/testComponent/method4?number=1&another=2&happn_token=' +
              result.data.token
          )
          .on('complete', function (result) {
            test.expect(result.data.product).to.be(3);
            done();
          });
      });
  });

  it('tests failed logging in using GET', function (done) {
    var restClient = require('restler');

    restClient
      .get('http://127.0.0.1:10000/rest/login?username=_ADMIN&password=wrong')
      .on('complete', function (result) {
        test.expect(result.error.message).to.be('Invalid credentials');
        test.expect(result.message).to.be('Failure logging in');

        done();
      });
  });

  it('tests posting an operation to the security component fails', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      var operation = {
        parameters: {
          username: '_ADMIN',
          password: 'blah',
        },
      };

      restClient
        .postJson(
          'http://127.0.0.1:10000/rest/method/security/updateOwnUser?happn_token=' +
            result.data.token,
          operation
        )
        .on('complete', function (result) {
          test.expect(result.error.number).to.not.be(null);
          test.expect(result.error.message).to.be('attempt to access security component over rest');
          done();
        });
    });
  });

  it('tests posting an operation to a remote method fails', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      var operation = {
        parameters: {
          one: 'one',
          two: 'two',
          three: 'three',
        },
      };

      restClient
        .postJson(
          'http://127.0.0.1:10000/rest/method/remoteMesh/remoteComponent/remoteFunction?happn_token=' +
            result.data.token,
          operation
        )
        .on('complete', function (result) {
          test.expect(result.error).to.not.be(null);
          test.expect(result.error.message).to.be('attempt to access remote mesh: remoteMesh');

          done();
        });
    });
  });

  it('creates a test user, fails to log in, add group with web permission and log in ok', function (done) {
    var testAdminClient = new Mesh.MeshClient({ secure: true, port: 10000 });

    var testGroup = {
      name: 'REST',
      permissions: {
        methods: {
          '/testComponent/method1': { authorized: true },
        },
        web: {
          '/rest/describe': { actions: ['get'], description: 'rest describe permission' },
          '/rest/api': { actions: ['post'], description: 'rest post permission' },
        },
      },
    };

    var testGroupSaved;
    var testUserSaved;

    var credentials = {
      username: '_ADMIN', // pending
      password: ADMIN_PASSWORD,
    };

    testAdminClient
      .login(credentials)
      .then(function () {
        testAdminClient.exchange.security.addGroup(testGroup, function (e, result) {
          if (e) return done(e);

          testGroupSaved = result;

          var testUser = {
            username: 'RESTTEST',
            password: 'REST_TEST',
          };

          testAdminClient.exchange.security.addUser(testUser, function (e, result) {
            if (e) return done(e);
            testUserSaved = result;

            testAdminClient.exchange.security.linkGroup(
              testGroupSaved,
              testUserSaved,
              function (e) {
                if (e) return done(e);

                login(function (e, response) {
                  if (e) return done(e);

                  var token = response.data.token;
                  var restClient = require('restler');

                  restClient
                    .get('http://127.0.0.1:10000/rest/describe?happn_token=' + token)
                    .on('complete', function (result) {
                      test.expect(result.data['/security/updateOwnUser']).to.be(undefined);
                      test
                        .expect(result.data['/remoteMesh/security/updateOwnUser'])
                        .to.be(undefined);

                      test.expect(result.data['/testComponent/method1']).to.not.be(null);
                      test.expect(result.data['/testComponent/method2']).to.be(undefined);

                      test.expect(Object.keys(result.data).length).to.be(1);

                      var operation = {
                        parameters: {
                          opts: { number: 1 },
                        },
                      };

                      restClient
                        .postJson(
                          'http://127.0.0.1:10000/rest/method/testComponent/method1?happn_token=' +
                            token,
                          operation
                        )
                        .on('complete', function (result) {
                          test.expect(result.data.number).to.be(2);

                          done();
                        });
                    });
                }, testUser);
              }
            );
          });
        });
      })
      .catch(done);
  });

  it('creates a test user, logs in, but fails to access a method via REST', function (done) {
    var testAdminClient = new Mesh.MeshClient({ secure: true, port: 10000 });

    var testGroup = {
      name: 'REST-2',
      permissions: {
        methods: {
          '/remoteMesh/remoteComponent/remoteFunction': { authorized: true },
          '/testComponent/method2': { authorized: true },
        },
        web: {
          '/rest/describe': { actions: ['get'], description: 'rest describe permission' },
          '/rest/api': { actions: ['post'], description: 'rest post permission' },
        },
      },
    };

    var testGroupSaved;
    var testUserSaved;

    var credentials = {
      username: '_ADMIN', // pending
      password: ADMIN_PASSWORD,
    };

    testAdminClient
      .login(credentials)
      .then(function () {
        testAdminClient.exchange.security.addGroup(testGroup, function (e, result) {
          if (e) return done(e);

          testGroupSaved = result;

          var testRESTUser = {
            username: 'RESTTEST2',
            password: 'REST_TEST2',
          };

          testAdminClient.exchange.security.addUser(testRESTUser, function (e, result) {
            if (e) return done(e);
            testUserSaved = result;

            testAdminClient.exchange.security.linkGroup(
              testGroupSaved,
              testUserSaved,
              function (e) {
                if (e) return done(e);

                login(function (e, response) {
                  if (e) return done(e);

                  var token = response.data.token;
                  var restClient = require('restler');

                  var operation = {
                    parameters: {
                      opts: {
                        number: 1,
                      },
                    },
                  };

                  //this call fails
                  restClient
                    .postJson(
                      'http://127.0.0.1:10000/rest/method/testComponent/method1?happn_token=' +
                        token,
                      operation
                    )
                    .on('complete', function (result) {
                      test.expect(result.error).to.not.be(null);
                      test.expect(result.error.message).to.be('Access denied');

                      var operation = {
                        parameters: {
                          opts: {
                            number: 1,
                          },
                        },
                      };

                      //this call works
                      restClient
                        .postJson(
                          'http://127.0.0.1:10000/rest/method/testComponent/method2?happn_token=' +
                            token,
                          operation
                        )
                        .on('complete', function (result) {
                          test.expect(result.error).to.be(null);
                          test.expect(result.data.number).to.be(2);

                          testGroup.permissions.methods['/testComponent/method2'] = {
                            authorized: false,
                          };

                          testAdminClient.exchange.security.updateGroup(testGroup, function (e) {
                            if (e) return done(e);

                            var operation = {
                              parameters: {
                                opts: {
                                  number: 1,
                                },
                              },
                            };

                            //this call stops working
                            restClient
                              .postJson(
                                'http://127.0.0.1:10000/rest/method/testComponent/method2?happn_token=' +
                                  token,
                                operation
                              )
                              .on('complete', function (result) {
                                test.expect(result.error).to.not.be(null);
                                test.expect(result.error.message).to.be('Access denied');

                                done();
                              });
                          });
                        });
                    });
                }, testRESTUser);
              }
            );
          });
        });
      })
      .catch(done);
  });

  it('passes params as an object $restParams and injects the $userSession as the rest user', function (done) {
    var testAdminClient = new Mesh.MeshClient({ secure: true, port: 10000 });

    var testGroup = {
      name: 'RESTPARAMS',
      permissions: {
        methods: {
          '/testComponent/method5': { authorized: true },
        },
        web: {
          '/rest/describe': { actions: ['get'], description: 'rest describe permission' },
          '/rest/api': { actions: ['post'], description: 'rest post permission' },
        },
      },
    };

    var testGroupSaved;
    var testUserSaved;

    var credentials = {
      username: '_ADMIN', // pending
      password: ADMIN_PASSWORD,
    };

    testAdminClient
      .login(credentials)
      .then(function () {
        testAdminClient.exchange.security.addGroup(testGroup, function (e, result) {
          if (e) return done(e);

          testGroupSaved = result;

          var testUser = {
            username: 'RESTTESTPARAMS',
            password: 'REST_TEST',
          };

          testAdminClient.exchange.security.addUser(testUser, function (e, result) {
            if (e) return done(e);
            testUserSaved = result;

            testAdminClient.exchange.security.linkGroup(
              testGroupSaved,
              testUserSaved,
              function (e) {
                if (e) return done(e);

                login(function (e, response) {
                  if (e) return done(e);

                  var token = response.data.token;
                  var restClient = require('restler');

                  var params = '&userValue=' + testUser.username;
                  restClient
                    .get(
                      'http://127.0.0.1:10000/rest/method/testComponent/method5?happn_token=' +
                        token +
                        params
                    )
                    .on('complete', function (result) {
                      test.expect(result.data.userValue).to.eql(testUser.username);
                      test.expect(result.data.$origin.username).to.be(testUser.username);
                      test.expect(result.data.$userSession.username).to.be(testUser.username);

                      done();
                    });
                }, testUser);
              }
            );
          });
        });
      })
      .catch(done);
  });

  it('tests posting an empty operation without parameters to a local method using $restParams', function (done) {
    login(function (e, result) {
      if (e) return done(e);

      var restClient = require('restler');

      var operation = {};

      restClient
        .postJson(
          'http://127.0.0.1:10000/rest/method/testComponent/method5?happn_token=' +
            result.data.token,
          operation
        )
        .on('complete', function (result) {
          test.expect(result.data.$origin.username).to.be('_ADMIN');
          test.expect(result.data.$userSession.username).to.be('_ADMIN');
          done();
        });
    });
  });
});
