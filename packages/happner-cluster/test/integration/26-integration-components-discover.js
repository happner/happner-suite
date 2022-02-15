const Promise = require('bluebird');
const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const delay = require('await-delay');
const getSeq = require('../_lib/helpers/getSeq');
const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  var servers, localInstance;

  function localInstanceConfig(seq) {
    var config = baseConfig(seq);
    config.modules = {
      localComponent1: {
        path: libDir + 'integration-26-local-component1',
      },
      localComponent2: {
        path: libDir + 'integration-26-local-component2',
      },
      remoteComponent4: {
        path: libDir + 'integration-26-remote-component4-v1',
      },
    };
    config.components = {
      localComponent1: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      localComponent2: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent4: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstance1Config(seq) {
    var config = baseConfig(seq);
    config.modules = {
      remoteComponent3: {
        path: libDir + 'integration-02-remote-component3',
      },
      remoteComponent4: {
        path: libDir + 'integration-02-remote-component4-v2',
      },
      remoteComponent5: {
        path: libDir + 'integration-02-remote-component5-v1',
      },
    };
    config.components = {
      remoteComponent3: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent4: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent5: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstance2Config(seq) {
    var config = baseConfig(seq);
    config.modules = {
      remoteComponent3: {
        path: libDir + 'integration-02-remote-component3',
      },
      remoteComponent4: {
        path: libDir + 'integration-02-remote-component4-v2',
      },
      remoteComponent5: {
        path: libDir + 'integration-02-remote-component5-v2',
      },
    };
    config.components = {
      remoteComponent3: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent4: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent5: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  before('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', function () {
      done();
    });
  });

  before('start cluster', async () => {
    this.timeout(20000);
    servers = await Promise.all([
      test.HappnerCluster.create(localInstanceConfig(getSeq.getFirst())),
      test.HappnerCluster.create(remoteInstance1Config(getSeq.getNext())),
      test.HappnerCluster.create(remoteInstance2Config(getSeq.getNext())),
    ]);
    localInstance = servers[0];
  });

  after('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, done);
  });

  context('exchange', function () {
    it('uses happner-client to mount all $happn components', async () => {
      // ... and apply models from each component's
      //     package.json happner dependency declaration
      // ... and round robin second call to second remote component

      await delay(5000); //wait for discovery

      var results = {};

      results[
        await localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1')
      ] = 1;

      results[
        await localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1')
      ] = 1;
      let expectedResults = {};
      expectedResults[getSeq.getMeshName(2) + ':component3:method1'] = 1;
      expectedResults[getSeq.getMeshName(3) + ':component3:method1'] = 1;

      test.expect(results).to.eql(expectedResults);
    });

    it('overwrites local components that are wrong version', function (done) {
      localInstance.exchange.localComponent1.callDependency(
        'remoteComponent4',
        'method1',
        function (e, result) {
          if (e) return done(e);
          try {
            test.expect(result.split(':')[1]).to.be('component4-v2');
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });

    it('responds with not implemented', function (done) {
      localInstance.exchange.localComponent1.callDependency(
        'remoteComponent0',
        'method1',
        function (e) {
          try {
            test.expect(e.message).to.be('Not implemented remoteComponent0:^1.0.0:method1');
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });
  });

  context('events', function () {
    it('can subscribe cluster wide', function (done) {
      this.timeout(5000);

      localInstance.exchange.localComponent2.listTestEvents(function (e, result) {
        if (e) return done(e);
        let expectedResults = {};
        expectedResults[
          `/_events/DOMAIN_NAME/remoteComponent3/testevent/${getSeq.getMeshName(3)}`
        ] = 1;
        expectedResults[
          `/_events/DOMAIN_NAME/remoteComponent3/testevent/${getSeq.getMeshName(2)}`
        ] = 1;
        try {
          test.expect(result).to.eql(expectedResults);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('does not receive events from incompatible component versions', function (done) {
      localInstance.exchange.localComponent2.listTestCompatibleEvents(function (e, result) {
        if (e) return done(e);
        let expectedResults = {};
        expectedResults[
          `/_events/DOMAIN_NAME/remoteComponent5/testevent/v2/${getSeq.getMeshName(3)}`
        ] = 1;
        try {
          test.expect(result).to.eql(expectedResults);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    async function tryCallDependency(componentName, methodName) {
      try {
        await localInstance.exchange.localComponent1.callDependency(componentName, methodName);
      } catch (e) {
        if (e.message.indexOf('Not implemented') > -1) return false;
        return e.message;
      }
      return true;
    }

    async function promiseStopCluster(servers) {
      return new Promise((resolve, reject) => {
        stopCluster(servers, (e) => {
          if (e) return reject(e);
          resolve();
        });
      });
    }

    it('dropped remote servers - not implemented message, re-implemented on connection', async () => {
      await delay(5000); //wait for discovery
      const outcomes = [];
      outcomes.push(await tryCallDependency('remoteComponent5', 'method1'));
      outcomes.push(await tryCallDependency('remoteComponent3', 'method1'));
      test.expect(outcomes).to.eql([true, true]);
      await promiseStopCluster(servers.splice(1, 2));
      await delay(5000);
      outcomes.push(await tryCallDependency('remoteComponent5', 'method1'));
      outcomes.push(await tryCallDependency('remoteComponent3', 'method1'));
      test.expect(outcomes).to.eql([true, true, false, false]);
      servers = servers.concat(
        await Promise.all([
          test.HappnerCluster.create(
            remoteInstance1Config([getSeq.lookupFirst(), getSeq.lookupFirst() + 1])
          ),
          test.HappnerCluster.create(
            remoteInstance2Config([getSeq.lookupFirst(), getSeq.lookupFirst() + 2])
          ),
        ])
      );
      await delay(5000); //wait for discvery
      outcomes.push(await tryCallDependency('remoteComponent5', 'method1'));
      outcomes.push(await tryCallDependency('remoteComponent3', 'method1'));
      test.expect(outcomes).to.eql([true, true, false, false, true, true]);
      await delay(5000);
    });
  });
});
