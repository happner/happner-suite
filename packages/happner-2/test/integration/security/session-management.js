require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  let serviceInstance;
  let clientInstance;

  let disconnectClient = function (client, cb) {
    if (typeof client === 'function') {
      cb = client;
      client = null;
    }
    if (!client) client = clientInstance;
    if (client) return client.disconnect({ reconnect: false }, cb);
    if (cb) cb();
  };

  var stopService = function (callback) {
    if (serviceInstance) serviceInstance.stop(callback);
    else callback();
  };

  after('disconnects the client and stops the server', function (callback) {
    this.timeout(3000);
    disconnectClient(function () {
      stopService(callback);
    });
  });

  var getService = function (activateSessionManagement, logSessionActivity, callback, port) {
    if (typeof activateSessionManagement === 'function') {
      callback = activateSessionManagement;
      activateSessionManagement = true;
      logSessionActivity = true;
    }

    if (typeof logSessionActivity === 'function') {
      callback = logSessionActivity;
      activateSessionManagement = true;
      logSessionActivity = true;
    }

    disconnectClient();

    setTimeout(function () {
      stopService(function (e) {
        if (e) return callback(e);

        if (!port) port = 10101;

        var config = {
          secure: true,
          port: port,
          happn: {
            adminPassword: 'happn',
            activateSessionManagement: activateSessionManagement,
            logSessionActivity: logSessionActivity,
          },
        };

        test.Mesh.create(config, function (err, instance) {
          serviceInstance = instance;

          if (err) return callback(err);

          clientInstance = new test.Mesh.MeshClient({ secure: true, port: port });

          clientInstance
            .login({ username: '_ADMIN', password: 'happn' })
            .then(function () {
              setTimeout(callback, 1000);
            })
            .catch(callback);
        });
      });
    }, 1000);
  };

  it('tests active sessions and session activity logging on a secure instance', function (callback) {
    this.timeout(15000);

    getService(function (e) {
      if (e) return callback(e);

      clientInstance.exchange.security.listActiveSessions(function (e, list) {
        if (e) return callback(e);

        test.expect(list.length <= 2).to.be(true);

        setTimeout(function () {
          clientInstance.exchange.security.listSessionActivity(function (e, list) {
            if (e) return callback(e);
            //mesh description being called by someone else intermittently
            test.expect(list.length <= 3).to.be(true);
            callback();
          });
        }, 1000);
      });
    });
  });

  it('tests session revocation on a secure instance', function (callback) {
    this.timeout(15000);

    getService(
      true,
      true,
      function (e) {
        if (e) return callback(e);

        clientInstance.exchange.security.listActiveSessions(function (e, list) {
          if (e) return callback(e);
          test.expect(list.length).to.be(2);

          clientInstance.exchange.security.listSessionActivity(function (e, list) {
            if (e) return callback(e);
            test.expect(list.length <= 2).to.be(true);

            var newInstance = new test.Mesh.MeshClient({ secure: true, port: 11112 });

            newInstance

              .login({ username: '_ADMIN', password: 'happn' })
              .then(function () {
                clientInstance.exchange.security.listActiveSessions(function (e, list) {
                  if (e) return callback(e);
                  test.expect(list.length <= 3).to.be(true);

                  clientInstance.exchange.security.revokeToken(
                    newInstance.data.session.token,
                    'APP',
                    function (e) {
                      if (e) return callback(e);
                      setTimeout(function () {
                        clientInstance.exchange.security.listRevokedTokens(function (e, items) {
                          test.expect(items.length).to.be(1);

                          newInstance.exchange.security.listActiveSessions(function (err) {
                            if (!err) return callback(new Error('this was not meant to happn'));
                            test.expect(err.toString()).to.be('Error: client is disconnected');

                            disconnectClient(newInstance, callback);
                          });
                        });
                      }, 2000);
                    }
                  );
                });
              })
              .catch(callback);
          });
        });
      },
      11112
    );
  });

  it('tests switching on active sessions but not session activity logging on a secure instance', function (callback) {
    this.timeout(10000);

    getService(
      false,
      false,
      function (e) {
        if (e) return callback(e);

        clientInstance.exchange.security.listActiveSessions(function (e) {
          test.expect(e.toString()).to.be('Error: session management not activated');

          clientInstance.exchange.security.listSessionActivity(function (e) {
            test.expect(e.toString()).to.be('Error: session activity logging not activated');

            clientInstance.exchange.security.activateSessionManagement(function (e) {
              if (e) return callback(e);

              setTimeout(function () {
                clientInstance.exchange.security.listActiveSessions(function (e, list) {
                  if (e) return callback(e);

                  test.expect(list.length <= 2).to.be(true);

                  clientInstance.exchange.security.listSessionActivity(function (e) {
                    test
                      .expect(e.toString())
                      .to.be('Error: session activity logging not activated');
                    callback();
                  });
                });
              }, 1000);
            });
          });
        });
      },
      11113
    );
  });

  it('tests switching on active sessions and session activity logging on a secure instance', function (callback) {
    this.timeout(6000);

    getService(
      false,
      false,
      function (e) {
        if (e) return callback(e);

        clientInstance.exchange.security.listActiveSessions(function (e) {
          test.expect(e.toString()).to.be('Error: session management not activated');

          clientInstance.exchange.security.listSessionActivity(function (e) {
            test.expect(e.toString()).to.be('Error: session activity logging not activated');

            clientInstance.exchange.security.activateSessionManagement(true, function (e) {
              if (e) return callback(e);

              clientInstance.exchange.security.listActiveSessions(function (e, list) {
                if (e) return callback(e);
                test.expect(list.length <= 2).to.be(true);

                clientInstance.exchange.security.listSessionActivity(function (e, list) {
                  if (e) return callback(e);
                  test.expect(list.length <= 2).to.be(true);

                  callback();
                });
              });
            });
          });
        });
      },
      11114
    );
  });

  it('tests switching on active sessions and session activity logging on a secure instance, then switching them off', function (callback) {
    this.timeout(6000);

    getService(
      false,
      false,
      function (e) {
        if (e) return callback(e);

        clientInstance.exchange.security.listActiveSessions(function (e) {
          test.expect(e.toString()).to.be('Error: session management not activated');

          clientInstance.exchange.security.listSessionActivity(function (e) {
            test.expect(e.toString()).to.be('Error: session activity logging not activated');

            clientInstance.exchange.security.activateSessionManagement(true, function (e) {
              if (e) return callback(e);

              clientInstance.exchange.security.listActiveSessions(function (e, list) {
                if (e) return callback(e);
                test.expect(list.length <= 2).to.be(true);

                clientInstance.exchange.security.listSessionActivity(function (e, list) {
                  if (e) return callback(e);
                  test.expect(list.length <= 2).to.be(true);

                  clientInstance.exchange.security.deactivateSessionManagement(true, function (e) {
                    if (e) return callback(e);

                    clientInstance.exchange.security.listActiveSessions(function (e) {
                      test.expect(e.toString()).to.be('Error: session management not activated');

                      clientInstance.exchange.security.listSessionActivity(function (e) {
                        test
                          .expect(e.toString())
                          .to.be('Error: session activity logging not activated');

                        callback();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      },
      11115
    );
  });

  it('tests switching on active sessions and session activity logging on a secure instance, then switching off activity logging', function (callback) {
    this.timeout(6000);

    getService(
      false,
      false,
      function (e) {
        if (e) return callback(e);

        clientInstance.exchange.security.listActiveSessions(function (e) {
          test.expect(e.toString()).to.be('Error: session management not activated');

          clientInstance.exchange.security.listSessionActivity(function (e) {
            test.expect(e.toString()).to.be('Error: session activity logging not activated');

            clientInstance.exchange.security.activateSessionManagement(true, function (e) {
              if (e) return callback(e);

              clientInstance.exchange.security.listActiveSessions(function (e, list) {
                if (e) return callback(e);

                test.expect(list.length <= 2).to.be(true);

                clientInstance.exchange.security.listSessionActivity(function (e, list) {
                  if (e) return callback(e);

                  test.expect(list.length <= 2).to.be(true);

                  clientInstance.exchange.security.deactivateSessionActivity(true, function (e) {
                    if (e) return callback(e);

                    clientInstance.exchange.security.listActiveSessions(function (e, list) {
                      if (e) return callback(e);

                      test.expect(list.length <= 2).to.be(true);

                      clientInstance.exchange.security.listSessionActivity(function (e) {
                        test
                          .expect(e.toString())
                          .to.be('Error: session activity logging not activated');

                        callback();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      },
      11116
    );
  });
});
