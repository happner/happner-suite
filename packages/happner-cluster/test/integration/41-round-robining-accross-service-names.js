const baseConfig = require('../_lib/base-config');
const libDir = require('../_lib/lib-dir');
require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let brokerComponentPath = libDir + 'integration-41-broker-component';
  let remoteComponentPath = libDir + 'integration-41-remote-component';
  let clusterConfig = {
    BROKER: 1,
    SERVICE1: 2,
    SERVICE2: 2,
    SERVICE3: 2,
  };
  let deployment = 'DEPLOY' + Date.now();

  let clusterServiceNameArr = Object.entries(clusterConfig).reduce(
    (serviceNameArray, [name, number]) => {
      return serviceNameArray.concat(Array(number).fill(name));
    },
    []
  );
  let hooksConfig = {
    cluster: {
      functions: [0, 1, 2, 3, 4, 5, 6].map((i) => {
        return instanceConfig(i);
      }),
      localInstance: 0,
    },
    clients: [0],
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, hooksConfig, timing, true);

  it('ensures that calls to a component are round-robined, even though the component is on different services', async function () {
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'remoteComponent',
      'brokeredMethod'
    );
    let results = [];
    for (let i = 0; i < 6; i++) {
      let result = await test.clients[0].exchange.remoteComponent.brokeredMethod();
      results.push(result.split(':')[0]);
    }
    test
      .expect(results.sort())
      .to.eql(['SERVICE1_A', 'SERVICE1_B', 'SERVICE2_A', 'SERVICE2_B', 'SERVICE3_A', 'SERVICE3_B']);
  });

  function instanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    if (seq === 0) {
      config.name = 'BROKER';
      config.modules = {
        brokerComponent: {
          path: brokerComponentPath,
        },
      };
      config.components = {
        brokerComponent: {
          startMethod: 'start',
          stopMethod: 'stop',
        },
      };
    } else {
      let name =
        seq % 2 === 1 ? clusterServiceNameArr[seq] + '_A' : clusterServiceNameArr[seq] + '_B';
      config.name = name; //clusterServiceNameArr[seq] + (seq % 2 === 1) ? "_A" : "_B"
      config.modules = {
        remoteComponent: {
          path: remoteComponentPath,
        },
      };
      config.components = {
        remoteComponent: {
          startMethod: 'start',
          stopMethod: 'stop',
        },
      };
    }
    config.happn.services.orchestrator.config.cluster = clusterConfig;
    config.happn.services.orchestrator.config.serviceName = clusterServiceNameArr[seq];
    config.happn.services.orchestrator.config.deployment = deployment;

    return function () {
      return config;
    };
  }
});