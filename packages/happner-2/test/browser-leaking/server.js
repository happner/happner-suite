const Happner = require('../..');
const { client } = require('happn-3');

const delay = require('happn-commons-test').create().delay;
(async () => {
  let meshConfig = {
    name: 'Server',
    happn: {
      secure: true,
      adminPassword: 'xxx',
    },
  };
  let mesh = await Happner.create(meshConfig);
  let users = Array.from(Array(3).keys()).map((int) => ({
    username: 'user' + int.toString(),
    password: 'pass',
  }));
  for (let user of users) {
    try {
    await mesh.exchange.security.addUser(user);
    } catch (e) {}
  }
  let attached = [];

  mesh._mesh.happn.events.on('attach', async (data) => {
    attached.push(data.user.username);
  });
  process.on('message', async (msg) => {
    if (msg === 'kill') {
      mesh.stop({ reconnect: true, kill: true, wait: 50 });
    }
    if (msg === 'listClients') {
      let connected = Object.keys(mesh._mesh.happn.server.connections);
      await mesh._mesh.happn.server.services.security.listActiveSessions((e, active) => {
        process.send({ attached, active, connected });
      });
    }
  });
  mesh._mesh.happn.server.services.security.activateSessionManagement(() => {
    process.send('started');
  });
})();
