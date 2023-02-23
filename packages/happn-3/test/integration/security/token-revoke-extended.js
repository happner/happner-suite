require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  var happn = require('../../../lib/index');
  var serviceInstance;
  before('it starts completely defaulted service', function (done) {
    getService(
      {
        secure: true,
        services: {
          security: {
            config: {
              profiles: [
                {
                  name: 'test-session',
                  session: {
                    'user.username': {
                      $eq: 'TEST_SESSION',
                    },
                  },
                  policy: {
                    ttl: '2 seconds',
                    inactivity_threshold: '2 seconds',
                  },
                },
                {
                  name: 'long-session',
                  session: {
                    'user.username': 'TEST_SESSION_1',
                  },
                  policy: {
                    ttl: 0,
                  },
                },
              ],
            },
          },
        },
      },
      function (e, service) {
        if (e) return done(e);

        serviceInstance = service;
        serviceInstance.connect.use('/TEST/WEB/ROUTE', function (req, res) {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              secure: 'value',
            })
          );
        });
        done();
      }
    );
  });

  after('stop the test service', function (callback) {
    serviceInstance.stop(callback);
  });

  var testGroup = {
    name: 'TEST GROUP',
    permissions: {
      'client-revoke-session-sanity': {
        actions: ['*'],
      },
      '/TEST/DATA/*': {
        actions: ['*'],
      },
      '/@HTTP/TEST/WEB/ROUTE': {
        actions: ['get'],
      },
    },
  };

  var testUser = {
    username: 'TEST_SESSION',
    password: 'TEST PWD',
  };

  var testUser1 = {
    username: 'TEST_SESSION_1',
    password: 'TEST PWD',
  };

  var addedTestGroup;
  var addedTestUser;
  var addedTestUser1;

  var testClient;

  before(
    'creates a group and a user, adds the group to the user, logs in with test user',
    async () => {
      addedTestGroup = await serviceInstance.services.security.users.upsertGroup(testGroup, {
        overwrite: false,
      });
      addedTestUser = await serviceInstance.services.security.users.upsertUser(testUser, {
        overwrite: false,
      });
      await serviceInstance.services.security.users.linkGroup(addedTestGroup, addedTestUser);
      addedTestUser1 = await serviceInstance.services.security.users.upsertUser(testUser1, {
        overwrite: false,
      });
      await serviceInstance.services.security.users.linkGroup(addedTestGroup, addedTestUser1);
    }
  );

  it('logs in with the ws user - we then test a call to a web-method, then disconnects with the revokeToken flag set to true, we try and reuse the token and ensure that it fails', function (done) {
    happn.client
      .create({
        config: {
          username: testUser.username,
          password: 'TEST PWD',
        },
        secure: true,
      })
      .then(function (clientInstance) {
        testClient = clientInstance;
        var sessionToken = testClient.session.token;
        doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
          if (e) {
            return done(e);
          }
          test.expect(response.statusCode).to.equal(200);
          testClient.disconnect(
            {
              revokeToken: true,
            },
            function (e) {
              if (e) return done(e);
              setTimeout(function () {
                doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
                  if (e) {
                    return done(e);
                  }
                  test.expect(response.statusCode).to.equal(403);
                  doEventRoundTripToken(sessionToken, function (e) {
                    test.expect(e.message).to.be(`token has been revoked`);
                    done();
                  });
                });
              }, 1000);
            }
          );
        });
      })
      .catch(function (e) {
        done(e);
      });
  });

  it('logs in with the ws user - we then test a call to a web-method, then logout, we try and reuse the token and ensure that it fails', async () => {
    testClient = await happn.client.create({
      config: {
        username: testUser.username,
        password: 'TEST PWD',
      },
      secure: true,
    });
    const sessionToken = testClient.session.token;
    let result = await doRequestPromise('/TEST/WEB/ROUTE', sessionToken, false);
    test.expect(result.response.statusCode).to.equal(200);
    await testClient.logout();
    result = await doRequestPromise('/TEST/WEB/ROUTE', sessionToken, false);
    test.expect(result.response.statusCode).to.equal(403);
    try {
      await doEventRoundTripTokenPromise(sessionToken);
      throw new Error('untest.expected success');
    } catch (e) {
      test.expect(e.message).to.be(`token has been revoked`);
    }
  });

  it('logs in with the ws user - we then test a call to a web-method, then logout, we try and reuse the token and ensure that it fails', async () => {
    testClient = await happn.client.create({
      config: {
        username: testUser1.username,
        password: 'TEST PWD',
      },
      secure: true,
    });
    const sessionToken = testClient.session.token;
    let result = await doRequestPromise('/TEST/WEB/ROUTE', sessionToken, false);
    test.expect(result.response.statusCode).to.equal(200);
    await doRequestLogoutPromise(sessionToken);
    result = await doRequestPromise('/TEST/WEB/ROUTE', sessionToken, false);
    test.expect(result.response.statusCode).to.equal(403);
    try {
      await doEventRoundTripTokenPromise(sessionToken);
      throw new Error('untest.expected success');
    } catch (e) {
      test.expect(e.message).to.be(`token has been revoked`);
    }
  });

  it('logs in with the ws user - we then test a call to a web-method, then disconnects with the revokeToken flag set to false, we try and reuse the token and ensure that it succeeds', function (done) {
    happn.client
      .create({
        config: {
          username: testUser.username,
          password: 'TEST PWD',
        },
        secure: true,
      })
      .then(function (clientInstance) {
        testClient = clientInstance;
        var sessionToken = testClient.session.token;
        doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
          if (e) {
            return done(e);
          }
          test.expect(response.statusCode).to.equal(200);
          testClient.disconnect(
            {
              revokeToken: false,
            },
            function (e) {
              if (e) return done(e);

              doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
                if (e) {
                  return done(e);
                }
                test.expect(response.statusCode).to.equal(200);
                done();
              });
            }
          );
        });
      })
      .catch(function (e) {
        done(e);
      });
  });

  it('logs in with the ws user - we then test a call to a web-method, then disconnects with the revokeToken flag set to true, we try and reuse the token and ensure that it fails, then wait longer and ensure even after the token is times out it still fails', function (done) {
    happn.client
      .create({
        config: {
          username: testUser.username,
          password: 'TEST PWD',
        },
        secure: true,
      })

      .then(function (clientInstance) {
        testClient = clientInstance;

        var sessionToken = testClient.session.token;

        doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
          if (e) {
            return done(e);
          }
          test.expect(response.statusCode).to.equal(200);
          testClient.disconnect(
            {
              revokeToken: true,
            },
            function (e) {
              if (e) return done(e);
              setTimeout(function () {
                serviceInstance.services.security.cache_revoked_tokens.get(
                  sessionToken,
                  function (e, cachedToken) {
                    test.expect(cachedToken.reason).to.equal('CLIENT');

                    setTimeout(function () {
                      serviceInstance.services.security.cache_revoked_tokens.get(
                        sessionToken,
                        function (e, cachedToken) {
                          test.expect(cachedToken).to.be(null);

                          doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
                            if (e) {
                              return done(e);
                            }
                            test.expect(response.statusCode).to.equal(401);
                            done();
                          });
                        }
                      );
                    }, 4010);
                  }
                );
              }, 1500);
            }
          );
        });
      })

      .catch(function (e) {
        done(e);
      });
  });

  it('logs in with the ws user - we then test a call to a web-method, we revoke the session explicitly via a client call, test it has the desired effect', function (done) {
    happn.client
      .create({
        username: testUser.username,
        password: 'TEST PWD',
        secure: true,
      })

      .then(function (clientInstance) {
        testClient = clientInstance;

        var sessionToken = testClient.session.token;

        doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
          if (e) {
            return done(e);
          }
          test.expect(response.statusCode).to.equal(200);

          testClient.revokeToken(function (e) {
            if (e) return done(e);

            doRequest('/TEST/WEB/ROUTE', sessionToken, false, function (e, response) {
              if (e) {
                return done(e);
              }
              test.expect(response.statusCode).to.equal(403);
              testClient.disconnect({ reconnect: false });
              done();
            });
          });
        });
      })

      .catch(function (e) {
        done(e);
      });
  });

  it('ensures revoking a token on 1 client revokes the token on all clients using the token', async () => {
    let client1 = await getClient({ username: testUser.username, password: 'TEST PWD' });
    let client2 = await getClient({ token: client1.session.token });
    await doEventRoundTripClient(client2);
    await client1.disconnect({ revokeToken: true });
    try {
      await test.delay(1000);
      await doEventRoundTripClient(client2);
      throw new Error('was not meant to happen');
    } catch (e) {
      test.expect(e.message).to.be('client is disconnected');
      client2.disconnect();
    }
  });

  it('ensures revoking a session on a child client (login from parent token) revokes the token on the parent as well', async () => {
    let client1 = await getClient({ username: testUser.username, password: 'TEST PWD' });
    let client2 = await getClient({ token: client1.session.token });
    await doEventRoundTripClient(client1);
    await client2.disconnect({ revokeToken: true });
    try {
      await test.delay(1000);
      await doEventRoundTripClient(client1);
      throw new Error('was not meant to happen');
    } catch (e) {
      test.expect(e.message).to.be('client is disconnected');
      client1.disconnect();
    }
  });

  it('ensures revoking a session on a child client (login from parent token) revokes the token on the parent as well, 3 levels deep', async () => {
    let client1 = await getClient({ username: testUser.username, password: 'TEST PWD' });
    let client2 = await getClient({ token: client1.session.token });
    let client3 = await getClient({ token: client2.session.token });
    await doEventRoundTripClient(client1);
    await client3.disconnect({ revokeToken: true });
    try {
      await test.delay(1000);
      await doEventRoundTripClient(client1);
      throw new Error('was not meant to happen');
    } catch (e) {
      test.expect(e.message).to.be('client is disconnected');
      client1.disconnect();
      client2.disconnect();
    }
  });

  it('ensures revoking a token on 1 client revokes the token on all clients using the token, 3 levels deep', async () => {
    let client1 = await getClient({ username: testUser.username, password: 'TEST PWD' });
    let client2 = await getClient({ token: client1.session.token });
    let client3 = await getClient({ token: client2.session.token });
    await doEventRoundTripClient(client3);
    await client1.disconnect({ revokeToken: true });
    try {
      await test.delay(1000);
      await doEventRoundTripClient(client3);
      throw new Error('was not meant to happen');
    } catch (e) {
      test.expect(e.message).to.be('client is disconnected');
      client2.disconnect();
      client3.disconnect();
    }
  });

  function getService(config, callback) {
    if (serviceInstance)
      return serviceInstance.stop(function () {
        happn.service.create(config, callback);
      });

    happn.service.create(config, callback);
  }

  async function getClient(config) {
    return happn.client.create({ config, secure: true });
  }

  async function doEventRoundTripClient(client) {
    return new Promise((resolve, reject) => {
      var timeout = this.setTimeout(() => {
        reject(new Error('timed out'));
      }, 3000);
      client.on(
        'client-revoke-session-sanity',
        (data) => {
          this.clearTimeout(timeout);
          test.expect(data).to.eql({ test: 'data' });
          resolve();
        },
        (e) => {
          if (e) return reject(e);
          client.set('client-revoke-session-sanity', { test: 'data' }, (e) => {
            if (e) return reject(e);
          });
        }
      );
    });
  }

  function doEventRoundTripTokenPromise(token) {
    return new Promise((resolve, reject) => {
      doEventRoundTripToken(token, (e, result) => {
        if (e) return reject(e);
        resolve(result);
      });
    });
  }

  function doEventRoundTripToken(token, callback) {
    happn.client
      .create({
        config: {
          token,
        },
        secure: true,
      })
      .then(function (client) {
        var timeout = this.setTimeout(() => {
          callback(new Error('timed out'));
        }, 3000);
        client.on(
          'client-revoke-session-sanity',
          (data) => {
            this.clearTimeout(timeout);
            test.expect(data).to.eql({ test: 'data' });
            callback();
          },
          (e) => {
            if (e) return callback(e);
            client.set('client-revoke-session-sanity', { test: 'data' }, (e) => {
              if (e) return callback(e);
            });
          }
        );
      })
      .catch(callback);
  }

  function doRequestPromise(path, token, query, excludeToken) {
    return new Promise((resolve, reject) => {
      doRequest(
        path,
        token,
        query,
        (e, response, body) => {
          if (e) {
            return reject(e);
          }
          resolve({ response, body });
        },
        excludeToken
      );
    });
  }

  function doRequestLogoutPromise(token, query) {
    return new Promise((resolve, reject) => {
      doRequestLogout(token, query, (e, response) => {
        if (e) return reject(e);
        if (response.statusCode !== 200) {
          return reject(new Error(`unsuccessful logout: ${response.statusCode}`));
        }
        resolve(response);
      });
    });
  }

  function doRequestLogout(token, query, callback) {
    var request = require('request');

    var options = {
      url: 'http://127.0.0.1:55000/auth/logout',
    };

    if (!query)
      options.headers = {
        Cookie: ['happn_token=' + token],
      };
    else options.url += '?happn_token=' + token;

    request(options, function (error, response, body) {
      callback(error, response, body);
    });
  }

  function doRequest(path, token, query, callback, excludeToken) {
    var request = require('request');

    var options = {
      url: 'http://127.0.0.1:55000' + path,
    };

    if (!excludeToken) {
      if (!query)
        options.headers = {
          Cookie: ['happn_token=' + token],
        };
      else options.url += '?happn_token=' + token;
    }

    request(options, function (error, response, body) {
      callback(error, response, body);
    });
  }
});
