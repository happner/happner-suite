const { fork } = require('child_process');
const path = require('path');

require('happn-commons-test').describe({ timeout: 45e3 }, (test) => {
  let server1, server2;
  let stats = [];
  before('starts mesh', async () => {
    server1 = fork(path.resolve(__dirname, './server.js'));
    let done;
    server1.on('message', async (data) => {
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

    let usernames = Array.from(Array(3).keys()).map((int) => 'user' + int.toString()); // test.expect(isEqual(data.attached, usernames)).to.be(true);

    await test.delay(3000);
    fork(path.resolve(__dirname, './_fixtures/karma-start.js'));
    server1.on('message', (data) => {
      if (typeof data === 'object') {
        stats.push({
          connected: data.connected.length,
          active: data.active.length,
          attached: data.attached.length,
        });
      }
    });
    await test.delay(5000);
    server1.send('listClients');
    server1.send('kill');
    server2 = fork(path.resolve(__dirname, './server.js'));
    server2.on('message', async (data) => {
      if (data === 'started') {
        await test.delay(7000);
        server2.send('listClients');
      }
      if (typeof data === 'object') {
        stats.push({
          connected: data.connected.length,
          active: data.active.length,
          attached: data.attached.length,
        });
        server2.send('kill');
        await test.delay(1000);

        return done();
      }
    });
    await new Promise((res) => {
      done = res;
    });
    server3 = fork(path.resolve(__dirname, './server.js'));

    server3.on('message', async (data) => {
      if (data === 'started') {
        await test.delay(7000);
        server3.send('listClients');
      }
      if (typeof data === 'object') {
        stats.push({
          connected: data.connected.length,
          active: data.active.length,
          attached: data.attached.length,
        });
        server3.send('kill');
        await test.delay(1000);

        return done();
      }
    });
    await new Promise((res) => {
      done = res;
    });
    // console.log(stats)
    test.expect(stats[1]).to.eql(stats[2]) //There is an additional socker in stats[0]
  });
});
