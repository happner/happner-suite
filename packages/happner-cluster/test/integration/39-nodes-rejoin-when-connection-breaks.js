const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();

const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let _AdminClient, testClient, proxyPorts;

  before('clear mongo collection', (done) => {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });

  before('start cluster', async () => {
    const serverPromises = [];
    const remoteComponent = baseConfig(0, 2, true);
    remoteComponent.modules = {
      remoteComponent: {
        path: libDir + 'integration-37-remote-component',
      },
    };
    remoteComponent.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    serverPromises.push(clusterHelper.start(remoteComponent));
    const brokerComponent = baseConfig(1, 2, true);
    brokerComponent.modules = {
      brokerComponent: {
        path: libDir + 'integration-37-broker-component',
      },
    };
    brokerComponent.components = {
      brokerComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    serverPromises.push(clusterHelper.start(brokerComponent));
    let servers = await Promise.all(serverPromises);
    // await test.delay(3e3)
    proxyPorts = await clusterHelper.getPorts()
  });

  before('create test clients', async () => {
    _AdminClient = await testclient.create('_ADMIN', 'happn', proxyPorts[0]);
    await users.add(_AdminClient, 'username', 'password');
    await users.allowMethod(_AdminClient, 'username', 'brokerComponent', 'block');
    await users.allowMethod(_AdminClient, 'username', 'remoteComponent', 'brokeredMethod1');
    testClient = await testclient.create('username', 'password', proxyPorts[1]);
  });
  after('disconnect _ADMIN client', async () => {
    await _AdminClient.disconnect();
    await testClient.disconnect();
    _AdminClient = null;
    testClient = null;
  });

  after('stop cluster', async () => {
    await clusterHelper.destroy();
  });

  it('broker rejoins cluster after event loop block causes it to disconnect', async () => {
    await testClient.exchange.brokerComponent.block();
    await test.delay(15000); //wait for component to stop blocking and reconnect to mesh
    let result = await testClient.exchange.remoteComponent.brokeredMethod1(); //mesh deemed healthy if function can be called through mesh
    test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
  });
});
