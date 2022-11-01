require('../_lib/test-helper').describe({ timeout: 30e3 }, (test) => {
  const libDir = require('../_lib/lib-dir');
  const baseConfig = require('../_lib/base-config');
  const stopCluster = require('../_lib/stop-cluster');
  const clearMongoCollection = require('../_lib/clear-mongo-collection');
  const users = require('../_lib/users');
  const client = require('../_lib/client');
  const getSeq = require('../_lib/helpers/getSeq');

  let servers = [];
  let userlist = {};
  let eventResults;
  let methodResults;
  let stop = false;

  function serverConfig(seq, minPeers) {
    var config = baseConfig(seq, minPeers, true);
    config.modules = {
      component1: {
        path: libDir + 'integration-08-component',
      },
      component2: {
        path: libDir + 'integration-08-component',
      },
      component3: {
        path: libDir + 'integration-08-component',
      },
      component4: {
        path: libDir + 'integration-08-component',
      },
      component5: {
        path: libDir + 'integration-08-component',
      },
    };
    config.components = {
      component1: {},
      component2: {},
      component3: {},
      component4: {},
      component5: {},
    };
    config.happn.services.replicator = {
      config: {
        securityChangesetReplicateInterval: 10, // 100 per second
      },
    };
    return config;
  }

  before('clear mongo collection', function (done) {
    this.timeout(10000);
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  before('start cluster', function (done) {
    this.timeout(20000);
    test.HappnerCluster.create(serverConfig(getSeq.getFirst(), 1))
      .then(function (server) {
        servers.push(server);
        return Promise.all([
          test.HappnerCluster.create(serverConfig(getSeq.getNext(), 5)),
          test.HappnerCluster.create(serverConfig(getSeq.getNext(), 5)),
          test.HappnerCluster.create(serverConfig(getSeq.getNext(), 5)),
          test.HappnerCluster.create(serverConfig(getSeq.getNext(), 5)),
        ]);
      })
      .then(function (_servers) {
        servers = servers.concat(_servers);
      })
      .then(function () {
        //wait for stabilisation
        setTimeout(done, 5000);
      })
      .catch(done);
  });

  before('create users', function (done) {
    this.timeout(10000);
    var promises = [];
    var username, user, component, method, event;
    for (var i = 0; i < 15; i++) {
      username = test.newid();
      user = userlist[username] = {
        allowedMethods: {},
        allowedEvents: {},
      };
      for (var j = 1; j <= 5; j++) {
        component = 'component' + j;
        user.allowedMethods[component] = {};
        user.allowedEvents[component] = {};
        for (var k = 1; k <= 5; k++) {
          method = 'method' + k;
          event = 'event' + k;
          user.allowedMethods[component][method] = true;
          user.allowedEvents[component][event] = true;
        }
      }
      promises.push(users.add(servers[0], username, 'password', users.generatePermissions(user)));
    }
    Promise.all(promises)
      .then(function () {
        done();
      })
      .catch(done);
  });

  before('connect clients', function (done) {
    var port;
    var i = 0;
    var promises = [];
    let username;
    for (username in userlist) {
      port = getSeq.getPort((++i % servers.length) + 1);
      promises.push(client.create(username, 'password', port));
    }
    Promise.all(promises)
      .then(function (clients) {
        clients.forEach(function (client) {
          userlist[client.username].client = client;
        });
        done();
      })
      .catch(done);
  });

  before('subscribe to all events', function (done) {
    var username, component, event, user;
    var promises = [];

    function createHandler(username) {
      return function (data) {
        var event = data.event;
        var component = data.component;
        eventResults[username] = eventResults[username] || {};
        eventResults[username][component] = eventResults[username][component] || {};
        eventResults[username][component][event] = true;
      };
    }

    for (username in userlist) {
      user = userlist[username];
      for (component in user.allowedEvents) {
        for (event in user.allowedEvents[component]) {
          promises.push(
            client.subscribe(0, user.client, component, event, createHandler(username))
          );
        }
      }
    }
    Promise.all(promises)
      .then(function (results) {
        for (var i = 0; i < results.length; i++) {
          if (results[i].result !== true) return done(new Error('Failed subscription'));
        }
        done();
      })
      .catch(done);
  });

  after('stop clients', function (done) {
    var promises = [];
    for (var username in userlist) {
      promises.push(client.destroy(userlist[username].client));
    }
    Promise.all(promises)
      .then(function () {
        done();
      })
      .catch(done);
  });

  after('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, done);
  });

  function randomUser() {
    var usernames = Object.keys(userlist);
    var random = Math.round(Math.random() * (usernames.length - 1));
    return usernames[random];
  }

  function randomServer() {
    return servers[Math.round(Math.random() * 4)];
  }

  function randomComponent() {
    return 'component' + (Math.round(Math.random() * 4) + 1);
  }

  function randomMethod() {
    return 'method' + (Math.round(Math.random() * 4) + 1);
  }

  function randomEvent() {
    return 'event' + (Math.round(Math.random() * 4) + 1);
  }

  function randomAdjustPermissions() {
    var server = randomServer();
    var promises = [];
    for (var i = 0; i < 50; i++) {
      // var server = randomServer();
      var username = randomUser();
      var component = randomComponent();
      var method = randomMethod();
      var event = randomEvent();

      promises.push(users.denyMethod(server, username, component, method));
      userlist[username].allowedMethods[component][method] = false;
      // console.log('deny method', username, component, method);

      promises.push(users.denyEvent(server, username, component, event));
      userlist[username].allowedEvents[component][event] = false;
      // console.log('deny event', username, component, event);
    }
    return Promise.all(promises);
  }

  function useMethodsAndEvents() {
    eventResults = {};
    return Promise.resolve()
      .then(function () {
        // awiat security sync
        return test.delay(2000);
      })
      .then(function () {
        var i, component;
        var promises = [];
        for (i = 1; i < 6; i++) {
          component = 'component' + i;
          promises.push(servers[0].exchange[component].emitEvents());
        }
        return Promise.all(promises);
      })
      .then(function () {
        var i, j, user, component, method;
        var promises = [];

        for (var username in userlist) {
          user = userlist[username];
          for (i = 1; i < 6; i++) {
            component = 'component' + i;
            for (j = 1; j < 6; j++) {
              method = 'method' + j;
              promises.push(client.callMethod(0, user.client, component, method));
            }
          }
        }
        return Promise.all(promises);
      })
      .then(function (results) {
        methodResults = results;
      });
  }

  function testResponses() {
    return new Promise(function (resolve, reject) {
      var username, user, component, method, event, allowed, result;
      for (username in userlist) {
        user = userlist[username];
        for (component in user.allowedEvents) {
          for (event in user.allowedEvents[component]) {
            allowed = user.allowedEvents[component][event];
            // console.log('allowed', username, component, event, allowed);
            try {
              if (allowed) {
                if (!eventResults[username][component][event]) {
                  return reject(
                    new Error('missing event ' + username + ' ' + component + ' ' + event)
                  );
                } else {
                  // console.log('ok', username, component, event);
                }
              }
            } catch (e) {
              return reject(new Error('missing event ' + username + ' ' + component + ' ' + event));
            }
            try {
              if (!allowed) {
                if (eventResults[username][component][event]) {
                  return reject(
                    new Error(
                      'should not have received event ' + username + ' ' + component + ' ' + event
                    )
                  );
                }
              }
            } catch (e) {
              // no problem
            }
          }
        }
      }

      for (var i = 0; i < methodResults.length; i++) {
        result = methodResults[i];
        username = result.user;
        component = result.component;
        method = result.method;
        allowed = result.result ? true : false;

        if (userlist[username].allowedMethods[component][method] !== allowed) {
          if (allowed) {
            return reject(
              new Error('should not have allowed ' + username + ' ' + component + ' ' + method)
            );
          } else {
            return reject(
              new Error('should not allowed ' + username + ' ' + component + ' ' + method)
            );
          }
        }
      }

      resolve();
    });
  }

  // one at a time
  var queue = test.commons.async.queue(function (task, callback) {
    if (stop) return callback();
    if (task.action === 'randomAdjustPermissions') {
      return randomAdjustPermissions()
        .then(function () {
          callback();
        })
        .catch(callback);
    }
    if (task.action === 'useMethodsAndEvents') {
      return useMethodsAndEvents()
        .then(function () {
          callback();
        })
        .catch(callback);
    }
    if (task.action === 'testResponses') {
      return testResponses()
        .then(function () {
          callback();
        })
        .catch(callback);
    }
  }, 1);

  function call(action) {
    return new Promise(function (resolve, reject) {
      queue.push({ action: action }, function (e) {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  it('handles repetitive security syncronisations', function (done) {
    this.timeout(200 * 1000);
    var promises = [];

    for (var i = 0; i < 5; i++) {
      promises.push(call('randomAdjustPermissions'));
      promises.push(call('useMethodsAndEvents'));
      promises.push(call('testResponses'));
    }

    Promise.all(promises)
      .then(function () {
        done();
      })
      .catch(function (error) {
        stop = true;
        done(error);
      });
  });
});
