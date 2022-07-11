const delay = require('await-delay');
const Happner = require('../..');
(async () => {
  let meshConfig = {
    name: 'Server',
    happn: {
      secure: true,
      adminPassword: 'xxx',
      encryptPayloads: true,
    },
  };

  let mesh = await Happner.create(meshConfig);
  let users = Array.from(Array(10).keys()).map((int) => ({
    username: 'user' + int.toString(),
    password: 'pass',
  }));
  for (let user of users) {
    await mesh.exchange.security.addUser(user);
  }
  let attached = [];

  mesh._mesh.happn.events.on('attach', async (data) => {
    attached.push(data.user.username);
    // console.log(attached);
    if (attached.length === 10)
      setTimeout(() => {
        process.send({ attached });
      }, 2000);
  });
})();
