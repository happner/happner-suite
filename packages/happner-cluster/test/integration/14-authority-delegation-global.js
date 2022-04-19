const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const clearMongoCollection = require('../_lib/clear-mongo-collection');
//var log = require('why-is-node-running');
const getSeq = require('../_lib/helpers/getSeq');

require('../_lib/test-helper').describe({ timeout: 30e3 }, (test) => {
  let servers, localInstance;

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.authorityDelegationOn = true;
    config.modules = {
      localComponent1: {
        path: libDir + 'integration-10-local-component1',
      },
    };
    config.components = {
      localComponent1: {},
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.authorityDelegationOn = true;
    config.modules = {
      remoteComponent2: {
        path: libDir + 'integration-10-remote-component2',
      },
      remoteComponent3: {
        path: libDir + 'integration-10-remote-component3',
      },
    };
    config.components = {
      remoteComponent2: {},
      remoteComponent3: {},
    };
    return config;
  }

  beforeEach('clear mongo', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', function (e) {
      done(e);
    });
  });

  beforeEach('start cluster', async function () {
    this.timeout(20000);
    localInstance = test.HappnerCluster.create(localInstanceConfig(getSeq.getFirst(), 1));
    await test.delay(2000);
    servers = [
      localInstance,
      test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
      test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
      test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext(), 1)),
    ];
    servers = await Promise.all(servers);
    localInstance = servers[0];
    await users.add(servers[1], 'username', 'password');
  });

  afterEach('stop cluster', async function () {
    if (!servers) return;
    await stopCluster(servers);
  });

  it('ensures a happner client without the correct permissions is unable to execute a remote components method', function (done) {
    this.timeout(5000);

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
    this.timeout(8000);

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
    this.timeout(8000);

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
    this.timeout(8000);

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
    this.timeout(10000);
    let thisClient;
    users
      .allowMethod(localInstance, 'username', 'localComponent1', 'localMethodToData')
      .then(function () {
        return testclient.create('username', 'password', getSeq.getPort(1));
      })
      .then(function (client) {
        thisClient = client;
        //getSeq.getPort(1) test our broker components methods are directly callable
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
