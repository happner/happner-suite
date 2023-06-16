const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let deploymentId = test.newid();
  let hooksConfig = {
    cluster: {
      functions: [localInstanceConfig, remoteInstance1Config, remoteInstance2Config],
      localInstance: 0,
    },
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, hooksConfig, timing);

  context('exchange', function () {
    it('uses happner-client to mount all $happn components', async () => {
      // ... and apply models from each component's
      //     package.json happner dependency declaration
      // ... and round robin second call to second remote component

      await test.delay(5e3); //wait for discovery

      var results = {};

      results[
        await test.localInstance.exchange.localComponent1.callDependency(
          'remoteComponent3',
          'method1'
        )
      ] = 1;

      results[
        await test.localInstance.exchange.localComponent1.callDependency(
          'remoteComponent3',
          'method1'
        )
      ] = 1;
      let expectedResults = {};
      expectedResults['MESH_1:component3:method1'] = 1;
      expectedResults['MESH_2:component3:method1'] = 1;

      test.expect(results).to.eql(expectedResults);
    });

    it('overwrites local components that are wrong version', async function () {
      let result = await test.localInstance.exchange.localComponent1.callDependency(
        'remoteComponent4',
        'method1'
      );
      test.expect(result.split(':')[1]).to.be('component4-v2');
    });

    it('responds with not implemented', async function () {
      try {
        await test.localInstance.exchange.localComponent1.callDependency(
          'remoteComponent0',
          'method1'
        );
        throw new Error('Should not happn');
      } catch (e) {
        test.expect(e.message).to.be('Not implemented remoteComponent0:^1.0.0:method1');
      }
    });
  });

  context('events', function () {
    it('can subscribe cluster wide', async function () {
      this.timeout(5000);

      let result = await test.localInstance.exchange.localComponent2.listTestEvents();
      let expectedResults = {};
      expectedResults[`/_events/DOMAIN_NAME/remoteComponent3/testevent/MESH_2`] = 1;
      expectedResults[`/_events/DOMAIN_NAME/remoteComponent3/testevent/MESH_1`] = 1;
      test.expect(result).to.eql(expectedResults);
    });

    it('does not receive events from incompatible component versions', async function () {
      let result = await test.localInstance.exchange.localComponent2.listTestCompatibleEvents();
      let expectedResults = {};
      expectedResults[`/_events/DOMAIN_NAME/remoteComponent5/testevent/v2/MESH_2`] = 1;
      test.expect(result).to.eql(expectedResults);
    });

    async function tryCallDependency(componentName, methodName) {
      try {
        await test.localInstance.exchange.localComponent1.callDependency(componentName, methodName);
      } catch (e) {
        if (e.message.indexOf('Not implemented') > -1) return false;
        return e.message;
      }
      return true;
    }

    async function promiseStopCluster(servers) {
      return new Promise((resolve, reject) => {
        test.stopCluster(servers, (e) => {
          if (e) return reject(e);
          resolve();
        });
      });
    }

    it('dropped remote servers - not implemented message, re-implemented on connection', async () => {
      await test.delay(5e3); //wait for discovery
      const outcomes = [];
      outcomes.push(await tryCallDependency('remoteComponent5', 'method1'));
      outcomes.push(await tryCallDependency('remoteComponent3', 'method1'));
      test.expect(outcomes).to.eql([true, true]);
      await promiseStopCluster(test.servers.splice(1, 2));
      await test.delay(5e3);
      outcomes.push(await tryCallDependency('remoteComponent5', 'method1'));
      outcomes.push(await tryCallDependency('remoteComponent3', 'method1'));
      test.expect(outcomes).to.eql([true, true, false, false]);
      test.servers = test.servers.concat(
        await Promise.all([
          test.HappnerCluster.create(remoteInstance1Config(1)),
          test.HappnerCluster.create(remoteInstance2Config(2)),
        ])
      );
      await test.delay(4e3); //wait for discvery
      outcomes.push(await tryCallDependency('remoteComponent5', 'method1'));
      outcomes.push(await tryCallDependency('remoteComponent3', 'method1'));
      test.expect(outcomes).to.eql([true, true, false, false, true, true]);
    });
  });

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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
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
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
      },
    };
    return config;
  }
});
