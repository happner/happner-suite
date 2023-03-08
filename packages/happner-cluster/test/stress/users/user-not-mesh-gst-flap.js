/* eslint-disable no-console */
const baseConfig = require('../../_lib/base-config');
const stopCluster = require('../../_lib/stop-cluster');
const clearMongoCollection = require('../../_lib/clear-mongo-collection');
const { fork } = require('child_process');
const path = require('path');
let addUser = async function (server, username) {
  var user = {
    username: username,
    password: 'password',
  };
  return server.exchange.security.addUser(user);
};

require('../../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let servers;

  beforeEach('clear mongo', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', function (e) {
      done(e);
    });
  });

  beforeEach('start cluster', async function () {
    this.timeout(20000);
    servers = await Promise.all([
      test.HappnerCluster.create(baseConfig(0, 2, true)),
      test.HappnerCluster.create(baseConfig(1, 2, true)),
    ]);
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, done);
  });

  it('tests adding a user that is not linked to _MESH_GST group', async () => {
    let done, user;
    let child;
    try {
      user = await addUser(servers[0], 'user1');
      console.log({ user });
      await servers[0].exchange.security.unlinkGroupName('_MESH_GST', user);
      child = fork(path.resolve(__dirname, './child-client'), [], { silent: true });
      child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
      });

      child.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
      });
      child.on('message', (data) => {
        if (data[0] === 'dead') {
          console.log('CHILD ERROR : ', { data });
        }
        done();
      });
      await new Promise((res) => (done = res));
    } catch (e) {
      console.log('ERROR IN CLUSTER ', e);
      if (!child) {
        console.log('STARTING CHILD IN CATCH');
        child = fork(path.resolve(__dirname, './child-client'), [], { silent: true });

        child.stdout.on('data', (data) => {
          console.log(`child stdout:\n${data}`);
        });

        child.stderr.on('data', (data) => {
          console.error(`child stderr:\n${data}`);
        });
      }
      child.on('message', (data) => {
        console.log(data);
        if (data[0] === 'dead') {
          console.log('CHILD ERROR : ', { e });
        }
        done();
      });
      await new Promise((res) => (done = res));
    }
  });
});
