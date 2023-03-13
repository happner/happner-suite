const unique = require('array-unique');
const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let config = {
    cluster: {
      functions: [
        localInstanceConfig,
        remoteInstanceConfig,
        remoteInstanceConfig,
        remoteInstanceConfig,
      ],
      localInstance: 0,
    },
  };
  test.hooks.standardHooks(test, config);

  it('removes implementation on peer departure', async function () {
    let replies = await Promise.all([
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
    ]);
    let list = unique(replies).sort();
    test
      .expect(list)
      .to.eql([1, 2, 3].map((num) => 'MESH_' + num.toString() + ':component3:method1'));

    let server = test.servers.pop();
    await server.stop({ reconnect: false });

    await test.delay(200); // time for peer departure to "arrive" at test.localInstance

    replies = await Promise.all([
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
    ]);

    list = unique(replies).sort();
    test.expect(list).to.eql([1, 2].map((num) => 'MESH_' + num.toString() + ':component3:method1'));
  });

  it('adds implementation on peer arrival', async function () {
    let replies = await Promise.all([
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
    ]);
    let list = unique(replies).sort();
    test
      .expect(list)
      .to.eql([1, 2, 3].map((num) => 'MESH_' + num.toString() + ':component3:method1').sort());

    let server = await test.HappnerCluster.create(remoteInstanceConfig(4));
    test.servers.push(server);
    await test.delay(3e3); // time for peer arrival to "arrival" at test.localInstance

    replies = await Promise.all([
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      test.localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
    ]);

    list = unique(replies).sort();
    test
      .expect(list)
      .to.eql([1, 2, 3, 4].map((num) => 'MESH_' + num.toString() + ':component3:method1').sort());
  });

  function localInstanceConfig(seq) {
    let config = baseConfig(seq);
    config.modules = {
      localComponent1: {
        path: libDir + 'integration-03-local-component1',
      },
    };
    config.components = {
      localComponent1: {},
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    let config = baseConfig(seq);
    config.modules = {
      remoteComponent2: {
        path: libDir + 'integration-03-remote-component2',
      },
      remoteComponent3: {
        path: libDir + 'integration-03-remote-component3',
      },
    };
    config.components = {
      remoteComponent2: {},
      remoteComponent3: {},
    };
    return config;
  }
});
