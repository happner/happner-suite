const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();

const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let deploymentId = test.newid();
  let _AdminClient, client, proxyPorts;

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
    remoteComponent.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
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
    brokerComponent.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
      },
    };
    serverPromises.push(clusterHelper.start(brokerComponent));
    await Promise.all(serverPromises);
    // await test.delay(3e3)
    proxyPorts = await clusterHelper.getPorts();
  });

  before('create test clients', async () => {
    _AdminClient = await test.client.create('_ADMIN', 'happn', proxyPorts[0]);
    await test.users.add(_AdminClient, 'username', 'password');
    await test.users.allowMethod(_AdminClient, 'username', 'brokerComponent', 'block');
    await test.users.allowMethod(_AdminClient, 'username', 'remoteComponent', 'brokeredMethod1');
    client = await test.client.create('username', 'password', proxyPorts[1]);
  });
  after('disconnect _ADMIN client', async () => {
    await _AdminClient.disconnect();
    await client.disconnect();
    _AdminClient = null;
    client = null;
  });

  after('stop cluster', async () => {
    await clusterHelper.destroy();
  });

  after("wait", done => {
    setTimeout(done, 5000)
  })
  

  it('broker rejoins cluster after event loop block causes it to disconnect', async () => {
    await client.exchange.brokerComponent.block();
    await test.delay(15000); //wait for component to stop blocking and reconnect to mesh
    let result = await client.exchange.remoteComponent.brokeredMethod1(); //mesh deemed healthy if function can be called through mesh
    test.expect(result).to.be('MESH_0:remoteComponent:brokeredMethod1');
  });
});
