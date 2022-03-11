const libDir = require('../../_lib/lib-dir');
const baseConfig = require('../../_lib/base-config');
const stopCluster = require('../../_lib/stop-cluster');
const users = require('../../_lib/users');
const testclient = require('../../_lib/client');
const clearMongoCollection = require('../../_lib/clear-mongo-collection');
const getSeq = require('../../_lib/helpers/getSeq');
const _ = require('lodash');

let addUser = function (server, username) {
  var user = {
    username: username,
    password: 'password',
  };
  return server.exchange.security.addUser(user);
};

let fetchUser = async function (server, username) {
  return await server.exchange.security.getUser(username);
};

require('../../_lib/test-helper').describe({ timeout:680e3 }, (test) => {
  let servers;

  beforeEach('clear mongo', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', function (e) {
      done(e);
    });
  });

  beforeEach('start cluster', async function () {
    this.timeout(20000);
    [baseConfig(getSeq.getFirst(), 2, true), baseConfig(getSeq.getNext(), 2, true)];
    servers = await Promise.all([
      test.HappnerCluster.create(baseConfig(getSeq.getFirst(), 2, true)),
      test.HappnerCluster.create(baseConfig(getSeq.getNext(), 2, true)),
    ]);
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, done);
  });
  it('adds 10000 users in batches of 50.', async () => {
    let userPrefixes = [];


    for (let i = 0; i < 200; i++) {
      console.log({i})
      let userPrefix = Date.now().toString();
      userPrefixes.push(userPrefix);
      await Promise.all(
        Array(50)
          .fill(1)
          .map((i, o) => {
            return addUser(servers[0], userPrefix + '-' + o.toString());
          })
      );
    }

    // let userPrefix = userPrefixes[0]
    // // userPrefixes.push(userPrefix);
    // await Promise.all(
    //   Array(50)
    //     .fill(1)
    //     .map((i, o) => {
    //       return addUser(servers[0], userPrefix + '-' + o.toString());
    //     })
    // );
    await test.delay(2000);
    for (let j = 0; j < 50; j++) {
      let username = _.sample(userPrefixes) + '-' + j;
      let user = await fetchUser(servers[1], username);
      if (!user.groups._MESH_GST) console.log(user);
      test.expect(user.groups._MESH_GST).to.be.ok();
    }
  });
  // it.only('fetches users', async() => {
  //   for (let j = 0; j < 50; j++) {
  //     //   let username = _.sample(userPrefixes) + '-' + j;
  //     let user = await fetchUser(servers[1], '1646823186729' + '-' + j);
  //     if (!user.groups._MESH_GST) console.log(user);
  //     test.expect(user.groups._MESH_GST).to.be.ok();
  //   }
  // })
});
