const { fork } = require('child_process');
const path = require('path');
const baseConfig = require('../_lib/base-config');
const HappnerCluster = require('../..');
const libDir = require('../_lib/lib-dir');
const clearMongoCollection = require('../_lib/drop-mongo-db');
require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  let broker1Proc, broker2Proc, broker3Proc, remoteMesh;
  let delayTime = 5e3;
  before('clear mongo collection', async () => {
    await clearMongoCollection('happn-cluster');
  });

  before('starts mesh and first broker', async () => {
    let done;
    let remoteMeshPromise = HappnerCluster.create(remoteInstanceConfig(0, 2));

    broker1Proc = fork(path.resolve(__dirname, './broker.js'), [1]);
    broker1Proc.on('message', async (data) => {
      if (data === 'started') {
        remoteMesh = await remoteMeshPromise;
        let users = Array.from(Array(3).keys()).map((int) => ({
          username: 'user' + int.toString(),
          password: 'pass',
        }));
        for (let user of users) {
          await remoteMesh.exchange.security.addUser(user);
        }
        await test.delay(1000);
        return done();
      }
    });
    await new Promise((res) => {
      done = res;
    });
  });
  after('stop remote mesh', async () => {
    await remoteMesh.stop();
  });
  it('tests the amount of active sessions, attached sessions, and connections on repeated restart of a broker', async () => {
    let done;
    let stats = [];
    fork(path.resolve(__dirname, './_fixtures/karma-start.js'));
    broker1Proc.on('message', async (data) => {
      if (typeof data === 'object') {
        stats.push({
          connected: data.connected.length,
          active: data.active.length,
          attached: data.attached.length,
        });
        broker1Proc.send('kill');
        await test.delay(delayTime);
        return done();
      }
    });
    await test.delay(6000);
    broker1Proc.send('listClients');
    await new Promise((res) => {
      done = res;
    });

    broker2Proc = fork(path.resolve(__dirname, './broker.js'), [1]);

    broker2Proc.on('message', async (data) => {
      if (data === 'started') {
        await test.delay(6000);
        broker2Proc.send('listClients');
      }
      if (typeof data === 'object') {
        stats.push({
          connected: data.connected.length,
          active: data.active.length,
          attached: data.attached.length,
        });
        broker2Proc.send('kill');
        await test.delay(delayTime);

        return done();
      }
    });
    await new Promise((res) => {
      done = res;
    });
    broker3Proc = fork(path.resolve(__dirname, './broker.js'), [1]);

    broker3Proc.on('message', async (data) => {
      if (data === 'started') {
        await test.delay(8000);
        broker3Proc.send('listClients');
      }
      if (typeof data === 'object') {
        stats.push({
          connected: data.connected.length,
          active: data.active.length,
          attached: data.attached.length,
        });
        broker3Proc.send('kill');
        await test.delay(delayTime);

        return done();
      }
    });
    await new Promise((res) => {
      done = res;
    });
    let broker4Proc = fork(path.resolve(__dirname, './broker.js'), [1]);
    broker4Proc.on('message', async (data) => {
      if (data === 'started') {
        await test.delay(8000);
        broker4Proc.send('listClients');
      }
      if (typeof data === 'object') {
        stats.push({
          connected: data.connected.length,
          active: data.active.length,
          attached: data.attached.length,
        });
        broker4Proc.send('kill');
        return done();
      }
    });
    await new Promise((res) => {
      done = res;
    });

    test
      .expect(stats.every((stat) => stat.connected <= 1 && stat.active <= 3 && stat.attached <= 1))
      .to.be(true);
  });

  function remoteInstanceConfig(seq, sync, replicate) {
    var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-09-remote-component',
      },
      remoteComponent1: {
        path: libDir + 'integration-09-remote-component-1',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
      remoteComponent1: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    config.port = 57000;
    config.happn.services.proxy = config.happn.services.proxy || {};
    config.happn.services.proxy.config = config.happn.services.proxy.config || {};
    config.happn.services.proxy.config.port = 55000;
    config.happn.services.cache = { config: { statisticsIntervals: 0 } };
    return config;
  }
});
