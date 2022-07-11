const { fork } = require('child_process');
const path = require('path');
let { isEqual } = require('lodash');
require('happn-commons-test').describe({ timeout: 45e3 }, (test) => {
  it('tests', (done) => {
    let server1 = fork(path.resolve(__dirname, './server1.js'));
    test.delay(3000).then(() => {
      server1.on('close', () => {
        let server2 = fork(path.resolve(__dirname, './server2.js'));
        server2.on('message', (data) => {
          console.log('Got Data from server 2', data);
          let usernames = Array.from(Array(10).keys()).map((int) => 'user' + int.toString());
          test.expect(isEqual(data.attached, usernames)).to.be(true);
          server2.kill()
          done();
        });
      });
      let child = fork(path.resolve(__dirname, './_fixtures/karma-start.js'));
    });
    // child.on('messgae', (data) => {
    // await test.delay(3000);
    // // if (data === 'clients up')
    // console.log('Clients up');
    // attached = [];
    // console.log('STOPPING');
    // try {
    // } catch (e) {}
    // console.log('INIUTIALIZINGF AGAIN');

    // await mesh.initialize(meshConfig);
    // console.log('STARTINGAGAIN');

    // await mesh.start();
    // await test.delay(13000);
    // console.log({ attached });

    // await test.delay(3000);
    // test.expect(isEqual(attached, usernames)).to.be(true);
    // test.expect(isEqual(detatched.sort(), usernames)).to.be(true);
    // done();

    // await client.connect(null, { username: '_ADMIN', password: 'xxx' });
  });
});
