require('../../__fixtures/utils/test_helper').describe({ timeout: 30e3 }, (test) => {
  var happnerInstance1 = null;
  var happnerInstance2 = null;
  let client;

  var serviceConfig1 = {
    happn: {
      port: 10000,
      secure: true,
      services: {
        security: {
          config: {
            sessionTokenSecret: 'test-secret',
            keyPair: {
              privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
              publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2',
            },
            profiles: [
              //profiles are in an array, in descending order of priority, so if you fit more than one profile, the top profile is chosen
              {
                name: 'token-not-allowed',
                session: {
                  $and: [
                    {
                      user: { username: { $eq: '_ADMIN' } },
                      info: { tokenNotAllowedForLogin: { $eq: true } },
                    },
                  ],
                },
                policy: {
                  disallowTokenLogins: true,
                },
              },
              {
                name: 'short-session',
                session: {
                  $and: [
                    {
                      user: { username: { $eq: '_ADMIN' } },
                      info: { shortSession: { $eq: true } },
                    },
                  ],
                },
                policy: {
                  ttl: '2 seconds',
                },
              },
              {
                name: 'browser-session',
                session: {
                  $and: [
                    {
                      user: { username: { $eq: '_ADMIN' } },
                      info: { _browser: { $eq: true } },
                    },
                  ],
                },
                policy: {
                  ttl: '7 days',
                },
              },
              {
                name: 'locked-session',
                session: {
                  $and: [
                    {
                      user: { username: { $eq: '_ADMIN' } },
                      info: { tokenOriginLocked: { $eq: true } },
                    },
                  ],
                },
                policy: {
                  ttl: 0, // no ttl
                  lockTokenToOrigin: true,
                },
              },
              {
                name: 'node-session',
                session: {
                  $and: [
                    {
                      user: { username: { $eq: '_ADMIN' } },
                      _browser: false,
                    },
                  ],
                },
                policy: {
                  ttl: 0, // no ttl
                },
              },
            ],
          },
        },
      },
    },
  };

  var serviceConfig2 = {
    happn: {
      port: 10001,
      secure: true,
      services: {
        security: {
          config: {
            sessionTokenSecret: 'test-secret',
            keyPair: {
              privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
              publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2',
            },
            profiles: [
              //profiles are in an array, in descending order of priority, so if you fit more than one profile, the top profile is chosen
              {
                name: 'token-not-allowed',
                session: {
                  $and: [
                    {
                      'user.username': { $eq: '_ADMIN' },
                      'info.tokenNotAllowedForLogin': { $eq: true },
                    },
                  ],
                },
                policy: {
                  disallowTokenLogins: true,
                },
              },
              {
                name: 'short-session',
                session: {
                  $and: [
                    {
                      'user.username': { $eq: '_ADMIN' },
                      'info.shortSession': { $eq: true },
                    },
                  ],
                },
                policy: {
                  ttl: '2 seconds',
                },
              },
              {
                name: 'browser-session',
                session: {
                  $and: [
                    {
                      'user.username': { $eq: '_ADMIN' },
                      _browser: true,
                    },
                  ],
                },
                policy: {
                  ttl: '7 days',
                },
              },
              {
                name: 'locked-session',
                session: {
                  $and: [
                    {
                      'user.username': { $eq: '_ADMIN' },
                      'info.tokenOriginLocked': { $eq: true },
                    },
                  ],
                },
                policy: {
                  ttl: 0, // no ttl
                  lockTokenToOrigin: true,
                },
              },
              {
                name: 'node-session',
                session: {
                  $and: [
                    {
                      'user.username': { $eq: '_ADMIN' },
                      _browser: false,
                    },
                  ],
                },
                policy: {
                  ttl: 0, // no ttl
                },
              },
            ],
          },
        },
      },
    },
  };

  before('should initialize the service', function (callback) {
    this.timeout(20000);

    try {
      test.Mesh.create(serviceConfig1, function (e, happnInst1) {
        if (e) return callback(e);

        happnerInstance1 = happnInst1;

        test.Mesh.create(serviceConfig2, function (e, happnInst2) {
          if (e) return callback(e);

          happnerInstance2 = happnInst2;

          callback();
        });
      });
    } catch (e) {
      callback(e);
    }
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  after(function (done) {
    if (happnerInstance1)
      happnerInstance1
        .stop()

        .then(function () {
          if (happnerInstance2)
            happnerInstance2
              .stop()
              .then(function () {
                done();
              })
              .catch(done);
          else done();
        })
        .catch(done);
    else done();
  });

  var getClient = function (options, credentials, callback) {
    client = new test.Mesh.MeshClient(options);

    client
      .login(credentials)

      .then(function () {
        callback(null, client);
      })

      .catch(function (e) {
        callback(e);
      });
  };

  var tryDisconnect = function (clientInstance, callback) {
    if (!clientInstance) return callback();

    try {
      clientInstance.disconnect(callback);
    } catch (e) {
      callback();
    }
  };

  var testOperations = function (clientInstance, callback) {
    var calledBack = false;

    var timeout = setTimeout(function () {
      raiseError('operations timed out');
    }, 2000);

    var raiseError = function (message) {
      if (!calledBack) {
        calledBack = true;
        return callback(new Error(message));
      }
    };

    var operations = '';

    clientInstance.data.on(
      '/test/operations',

      function (data, meta) {
        operations += meta.action.toUpperCase().split('@')[0].replace(/\//g, '');

        if (operations === 'SETREMOVE') {
          clearTimeout(timeout);

          callback();
        }
      },
      function (e) {
        if (e) return raiseError(e.toString());

        clientInstance.data.set('/test/operations', { test: 'data' }, function (e) {
          if (e) return raiseError(e.toString());

          clientInstance.data.remove('/test/operations', function (e) {
            if (e) return raiseError(e.toString());
          });
        });
      }
    );
  };

  it('001: logs in with the test client, supplying a public key, we perform a bunch of operations - we remember the token and logout - then login with the token, and test operations', function (done) {
    getClient(
      {
        port: 10000,
      },
      {
        username: '_ADMIN',
        password: 'happn',
      },
      function (e, instance) {
        if (e) return done(e);

        testOperations(instance, function (e) {
          if (e) return done(e);

          var token = instance.data.session.token;

          instance.disconnect(function (e) {
            if (e) return done(e);

            getClient(
              {
                port: 10000,
              },
              {
                token: token,
              },
              function (e, tokenInstance) {
                if (e) return done(e);

                testOperations(tokenInstance, function (e) {
                  if (e) return done(e);
                  tryDisconnect(tokenInstance, function () {
                    done(e);
                  });
                });
              }
            );
          });
        });
      }
    );
  });

  it('002: logs in with the test client, supplying a public key, we perform a bunch of operations - we wait for the short session to time out, then try and reuse the token for login, it should not be allowed', function (done) {
    getClient(
      {
        port: 10000,
        info: {
          shortSession: true,
        },
      },
      {
        username: '_ADMIN',
        password: 'happn',
      },
      function (e, instance) {
        if (e) return done(e);

        testOperations(instance, function (e) {
          if (e) return done(e);

          var token = instance.data.session.token;

          instance.disconnect(function (e) {
            if (e) return done(e);

            setTimeout(function () {
              getClient(
                {
                  port: 10000,
                },
                {
                  token: token,
                },
                function (e) {
                  test.expect(e.toString()).to.be('AccessDenied: expired session token');
                  done();
                }
              );
            }, 2010);
          });
        });
      }
    );
  });

  it('003: testing inverse of test 002, so no timed out session', function (done) {
    getClient(
      {
        port: 10000,
      },
      {
        username: '_ADMIN',
        password: 'happn',
      },
      function (e, instance) {
        if (e) return done(e);

        testOperations(instance, function (e) {
          if (e) return done(e);

          var token = instance.data.session.token;

          instance.disconnect(function (e) {
            if (e) return done(e);

            setTimeout(function () {
              getClient(
                {
                  port: 10000,
                },
                {
                  token: token,
                },
                done
              );
            }, 2010);
          });
        });
      }
    );
  });

  it('004: logs in with the test client, supplying a public key, we perform a bunch of operations - we remember the token and logout revoking the token - we then ensure we are unable to login with the revoked token', function (done) {
    getClient(
      {
        port: 10000,
      },
      {
        username: '_ADMIN',
        password: 'happn',
      },
      function (e, instance) {
        if (e) return done(e);

        testOperations(instance, function (e) {
          if (e) return done(e);

          var token = instance.data.session.token;

          instance.disconnect({ revokeSession: true }, function (e) {
            if (e) return done(e);

            setTimeout(function () {
              getClient(
                {
                  port: 10000,
                },
                {
                  token: token,
                },
                function (e) {
                  test.expect(e.toString()).to.be('AccessDenied: token has been revoked');
                  done();
                }
              );
            }, 2010);
          });
        });
      }
    );
  });

  it('005: we log in to a test service, supplying a public key, we perform a bunch of operations - the token is remembered and matches the locked profile, we then ensure we are able to login to the same server with the token but are unable to log in to a different server using the locked token', function (done) {
    getClient(
      {
        port: 10000,
        info: {
          tokenOriginLocked: true,
        },
      },
      {
        username: '_ADMIN',
        password: 'happn',
      },
      function (e, instance) {
        if (e) return done(e);

        testOperations(instance, function (e) {
          if (e) return done(e);

          var token = instance.data.session.token;

          instance.disconnect(function (e) {
            if (e) return done(e);

            getClient(
              {
                port: 10001,
              },
              {
                token: token,
              },
              function (e) {
                test
                  .expect(e.toString())
                  .to.be('AccessDenied: this token is locked to a different origin by policy');
                done();
              }
            );
          });
        });
      }
    );
  });

  it('006: inverse of 005, we check we are able to log in to another instance with the same token.', function (done) {
    getClient(
      {
        port: 10000,
      },
      {
        username: '_ADMIN',
        password: 'happn',
      },
      function (e, instance) {
        if (e) return done(e);

        testOperations(instance, function (e) {
          if (e) return done(e);

          var token = instance.data.session.token;

          instance.disconnect(function (e) {
            if (e) return done(e);

            setTimeout(function () {
              getClient(
                {
                  port: 10001,
                },
                {
                  token: token,
                },
                done
              );
            }, 2010);
          });
        });
      }
    );
  });

  it('we log in to a test service, supplying a public key, we perform a bunch of operations - the token is remembered and matches the disallow profile, we then ensure we are unable to login with the login disallowed token', function (done) {
    getClient(
      {
        port: 10000,
        info: {
          tokenNotAllowedForLogin: true,
        },
      },
      {
        username: '_ADMIN',
        password: 'happn',
      },
      function (e, instance) {
        if (e) return done(e);

        testOperations(instance, function (e) {
          if (e) return done(e);

          var token = instance.data.session.token;

          instance.disconnect(function (e) {
            if (e) return done(e);

            getClient(
              {
                port: 10000,
              },
              {
                token: token,
              },
              function (e) {
                test
                  .expect(e.toString())
                  .to.be('AccessDenied: logins with this token are disallowed by policy');
                done();
              }
            );
          });
        });
      }
    );
  });
});
