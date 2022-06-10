const { fork } = require('child_process');
const path = require('path');

require('happn-commons-test').describe({ timeout: 45e3 }, (test) => {
  let server1, server2, server3;
  let stats = [];
  before('starts mesh', async () => {
    server1 = fork(path.resolve(__dirname, './server.js'));
    await new Promise((done) => {
      server1.on('message', async (data) => {
        if (data === 'started') {
          await test.delay(2000);
          done();
        }
      });
    });
  });

  it('tests killing and replacing a happner server while browser clients are connected, should not have extra sockets or sessions', async () => {
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
    await new Promise((done) => {
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
    });
    server3 = fork(path.resolve(__dirname, './server.js'));

    await new Promise((done) => {
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
    });
    test.expect(stats[1].connected).to.be(3);
    test.expect(stats[1].active).to.be(4);
    test.expect(stats[1].attached).to.be(3);

    test.expect(stats[1]).to.eql(stats[2]); //There is an additional socket in stats[0]
    test.expect(stats[0]).to.eql({ ...stats[1], connected: 4 }); // I think this is karma fetching the client JS
  });
});
