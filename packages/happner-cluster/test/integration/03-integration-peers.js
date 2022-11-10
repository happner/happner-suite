const unique = require('array-unique');

const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let servers, localInstance;

  beforeEach('start cluster', async function () {
    servers = await Promise.all([
      test.HappnerCluster.create(localInstanceConfig(0)),
      test.HappnerCluster.create(remoteInstanceConfig(1)),
      test.HappnerCluster.create(remoteInstanceConfig(2)),
      test.HappnerCluster.create(remoteInstanceConfig(3)),
    ]);
    localInstance = servers[0];
  });

  afterEach('stop cluster', async function () {
    if (servers) await stopCluster(servers);
  })

  it('removes implementation on peer departure', async function () {
    let replies = await Promise.all([
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
    ]);
    let list = unique(replies).sort();
    test
      .expect(list)
      .to.eql([1, 2, 3].map((num) => 'MESH_' + num.toString() + ':component3:method1'));

    let server = servers.pop();
    await server.stop({ reconnect: false });

    await test.delay(200); // time for peer departure to "arrive" at localInstance

    replies = await Promise.all([
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
    ]);

    list = unique(replies).sort();
    test.expect(list).to.eql([1, 2].map((num) => 'MESH_' + num.toString() + ':component3:method1'));
  });

  it('adds implementation on peer arrival', async function () {
    let replies = await Promise.all([
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
    ]);
    let list = unique(replies).sort();
    test
      .expect(list)
      .to.eql([1, 2, 3].map((num) => 'MESH_' + num.toString() + ':component3:method1').sort());

    let server = await test.HappnerCluster.create(remoteInstanceConfig(4));
    servers.push(server);
    await test.delay(3000); // time for peer arrival to "arrival" at localInstance

    replies = await Promise.all([
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
      localInstance.exchange.localComponent1.callDependency('remoteComponent3', 'method1'),
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
