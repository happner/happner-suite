const { fork } = require('child_process');
const path = require('path');
const baseConfig = require('../_lib/base-config');
const getSeq = require('../_lib/helpers/getSeq');
const HappnerCluster = require('../..');
const libDir = require('../_lib/lib-dir');
require('happn-commons-test').describe({ timeout: 45e3 }, (test) => {
  let broker1Proc, broker2Proc;
  let brokerSeq 
  before('starts mesh', async () => {
    let done;
    HappnerCluster.create(remoteInstanceConfig(getSeq.getFirst(), 2));
    brokerSeq = getSeq.getNext();
    let broker1Proc = fork(path.resolve(__dirname, './server.js'), brokerSeq);
    broker1Proc.on('message', async (data) => {
      if (data === 'started') {
        await test.delay(2000);
        done();
      }
    });
    await new Promise((res) => {
      done = res;
    });
  });

  it('tests', async () => {
    let listed1, listed2;
    let done;

    let usernames = Array.from(Array(3).keys()).map((int) => 'user' + int.toString()); 

    await test.delay(3000);
    let child = fork(path.resolve(__dirname, './_fixtures/karma-start.js'));
    broker1Proc.on('message', (data) => {
      if (typeof data === 'object') {
        test.expect(data.attached.length).to.eql(3);
        test.expect(data.active.length).to.eql(4); //Additional intra-proc session
        listed1 = true;
      }
    });
    await test.delay(5000);
    broker1Proc.send('listClients');
    broker1Proc.send('kill');
    broker2Proc = fork(path.resolve(__dirname, './server.js'), brokerSeq);
    let sent = false;
    broker2Proc.on('message', async (data) => {
      if (data === 'started') {
        await test.delay(7000);
        if (!sent) {
          sent = true;
          broker2Proc.send('listClients');
        }
      }
      if (typeof data === 'object') {
        test.expect(data.attached.length).to.eql(3);
        test.expect(data.active.length).to.eql(4); //Additional intra-proc session
        listed2 = true;
        test.expect(listed1 && listed2).to.be(true);
        broker2Proc.send('kill');
        return done();
      }
    });
    await new Promise((res) => {
      done = res;
    });
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
    return config;
  }
});
