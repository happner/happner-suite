const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const users = require('../_lib/users');
const testclient = require('../_lib/client');
const getSeq = require('../_lib/helpers/getSeq');
const clusterHelper = require('../_lib/helpers/multiProcessClusterManager').create();

const clearMongoCollection = require('../_lib/clear-mongo-collection');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let _AdminClient;
  let testClient;

  before('clear mongo collection', (done) => {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', done);
  });
  before('start cluster', async () => {
    const serverPromises = [];
    const remoteComponent = baseConfig(getSeq.getFirst(), 2, true, null, null, null, null, null);
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
    const brokerComponent = baseConfig(getSeq.getNext(), 2, true, null, null, null, null, null);
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
    return Promise.all(serverPromises);
  });
  before('create test clients', async () => {
    _AdminClient = await testclient.create('_ADMIN', 'happn', getSeq.getPort(1));
    await users.add(_AdminClient, 'username', 'password');
    await users.allowMethod(_AdminClient, 'username', 'brokerComponent', 'block');
    await users.allowMethod(_AdminClient, 'username', 'remoteComponent', 'brokeredMethod1');
    testClient = await testclient.create('username', 'password', getSeq.getPort(2));
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
    await test.delay(19000); //wait for component to stop blocking and reconnect to mesh
    let result = await testClient.exchange.remoteComponent.brokeredMethod1(); //mesh deemed healthy if function can be called through mesh
    // } catch (e) {
    //   console.log('GOT ERROR', e);
    // }
    test.expect(result).to.be(getSeq.getMeshName(1) + ':remoteComponent:brokeredMethod1');
  });
});
