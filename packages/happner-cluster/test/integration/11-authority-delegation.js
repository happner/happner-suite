const Promise = require('bluebird');
const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
//var log = require('why-is-node-running');
const getSeq = require('../_lib/helpers/getSeq');
require('../_lib/test-helper').describe({ timeout: 30e3 }, (test) => {
  var servers, localInstance;

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.modules = {
      localComponent1: {
        path: libDir + 'integration-10-local-component1',
      },
    };
    config.components = {
      localComponent1: {
        security: {
          authorityDelegationOn: true,
        },
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.modules = {
      remoteComponent2: {
        path: libDir + 'integration-10-remote-component2',
      },
      remoteComponent3: {
        path: libDir + 'integration-10-remote-component3',
      },
    };
    config.components = {
      remoteComponent2: {
        security: {
          authorityDelegationOn: true,
        },
      },
      remoteComponent3: {
        security: {
          authorityDelegationOn: true,
        },
      },
    };
    return config;
  }

  beforeEach('clear mongo', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', function (e) {
      done(e);
    });
  });

  beforeEach('start cluster', function (done) {
    this.timeout(20000);
    test.HappnerCluster.create(localInstanceConfig(getSeq.getFirst(), 1)).then(function (local) {
      localInstance = local;
    });

    setTimeout(() => {
      Promise.all([
        test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
        test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
        test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
      ])
        .then(function (_servers) {
          servers = _servers;
          //localInstance = servers[0];
          return users.add(servers[0], 'username', 'password');
        })
        .then(function () {
          done();
        })
        .catch(done);
    }, 2000);
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers.concat(localInstance), done);
  });


  it('ensures a happner client without the correct permissions is unable to execute a remote components method', function (done) {
    this.timeout(6000);

    users
      .allowMethod(localInstance, 'username', 'localComponent1', 'localMethodToRemoteMethod')
      .then(function () {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then(function (client) {
        let thisClient = client;
        //first test our broker components methods are directly callable
        return thisClient.exchange.localComponent1.localMethodToRemoteMethod(
          'remoteComponent2',
          'method1'
        );
      })
      .then(function () {
        done(new Error('unexpected success'));
      })
      .catch(function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        done();
      });
  });

  it('ensures a happner client without the correct permissions is unable to execute a remote components method, 2 levels deep', function (done) {
    this.timeout(6000);

    users
      .allowMethod(localInstance, 'username', 'localComponent1', 'localMethodToRemoteMethod')
      .then(function () {
        return users.allowMethod(localInstance, 'username', 'remoteComponent2', 'method2');
      })
      .then(function () {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then(function (client) {
        let thisClient = client;
        //first test our broker components methods are directly callable
        return thisClient.exchange.localComponent1.localMethodToRemoteMethod(
          'remoteComponent2',
          'method2'
        );
      })
      .then(function () {
        done(new Error('unexpected success'));
      })
      .catch(function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        done();
      });
  });

  it('ensures a happner client without the correct permissions is unable to subscribe to a remote components event', function (done) {
    this.timeout(6000);

    users
      .allowMethod(localInstance, 'username', 'localComponent1', 'localMethodToRemoteEvent')
      .then(function () {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then(function (client) {
        let thisClient = client;
        //first test our broker components methods are directly callable
        return thisClient.exchange.localComponent1.localMethodToRemoteEvent();
      })
      .then(function () {
        done(new Error('unexpected success'));
      })
      .catch(function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        done();
      });
  });

  it('ensures a happner client without the correct permissions is unable to subscribe to a remote components event, 2 levels deep', function (done) {
    this.timeout(6000);

    users
      .allowMethod(localInstance, 'username', 'localComponent1', 'localMethodToRemoteMethod')
      .then(function () {
        return users.allowMethod(localInstance, 'username', 'remoteComponent2', 'method3');
      })
      .then(function () {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then(function (client) {
        let thisClient = client;
        //first test our broker components methods are directly callable
        return thisClient.exchange.localComponent1.localMethodToRemoteMethod(
          'remoteComponent2',
          'method3'
        );
      })
      .then(function () {
        done(new Error('unexpected success'));
      })
      .catch(function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        done();
      });
  });

  it('ensures a happner client without the correct permissions is unable to modify a remote components data', function (done) {
    this.timeout(6000);
    let thisClient;
    users
      .allowMethod(localInstance, 'username', 'localComponent1', 'localMethodToData')
      .then(function () {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then(function (client) {
        thisClient = client;
        //first test our broker components methods are directly callable
        return thisClient.exchange.localComponent1.localMethodToData();
      })
      .then(function () {
        done(new Error('unexpected success'));
      })
      .catch(function (e) {
        test.expect(e.toString()).to.be('AccessDenied: unauthorized');
        thisClient.disconnect(done);
      });
  });
});
