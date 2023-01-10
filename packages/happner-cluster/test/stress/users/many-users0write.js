const baseConfig = require('../../_lib/base-config');
const stopCluster = require('../../_lib/stop-cluster');
const clearMongoCollection = require('../../_lib/clear-mongo-collection');
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

require('../../_lib/test-helper').describe({ timeout: 680e3 }, (test) => {
  let servers;

  beforeEach('clear mongo', function (done) {
    clearMongoCollection('mongodb://localhost', 'happn-cluster', function (e) {
      done(e);
    });
  });

  beforeEach('start cluster', async function () {
    this.timeout(20000);
    servers = await Promise.all([
      test.HappnerCluster.create(0, 2, true),
      test.HappnerCluster.create(1, 2, true),
    ]);
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, done);
  });
  it('adds 10000 users in batches of 50.', async () => {
    let userPrefixes = [];

    for (let i = 0; i < 200; i++) {
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

    await test.delay(2000);
    for (let j = 0; j < 50; j++) {
      let username = _.sample(userPrefixes) + '-' + j;
      let user = await fetchUser(servers[1], username);
      test.expect(user.groups._MESH_GST).to.be.ok();
    }
  });
});
