var Happner = require('../..');
const { fork } = require('child_process');
const path = require('path');
let { isEqual } = require('lodash');
require('happn-commons-test').describe({ timeout: 25e3 }, (test) => {
  let mesh;
  before('Starts mesh, adds users', async () => {
    var meshConfig = {
      name: 'Server',
      happn: {
        secure: true,
        adminPassword: 'xxx',
        encryptPayloads: true,
      },
    };

    mesh = await Happner.create(meshConfig);
    let users = Array.from(Array(10).keys()).map((int) => ({
      username: 'user' + int.toString(),
      password: 'pass',
    }));
    for (let user of users) {
      await mesh.exchange.security.addUser(user);
    }
  });
  after('stop mesh', async () => {
    await mesh.stop({ reconnect: false });
  });
  it('tests', (done) => {
    let attached = [],
      detatched = [];

    mesh._mesh.happn.events.on('attach', (data) => {
      attached.push(data.user.username);
    });
    mesh._mesh.happn.events.on('detatch', (data) => {
      detatched.push(data.user.username);
    });
    let child = fork(path.resolve(__dirname, './_fixtures/karma-start.js'));
    let usernames = Array.from(Array(10).keys()).map((int) => 'user' + int.toString());
    child.on('close', async () => {
      await test.delay(3000);
      test.expect(isEqual(attached, usernames)).to.be(true);
      test.expect(isEqual(detatched.sort(), usernames)).to.be(true);
      done();
    });

    // await client.connect(null, { username: '_ADMIN', password: 'xxx' });
  });
});
