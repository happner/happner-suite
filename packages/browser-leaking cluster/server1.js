const HappnerCluster = require('../..');
const baseConfig = require('../_lib/base-config');
const libDir = require('../_lib/lib-dir');
let seq = [parseInt(process.argv[2]), parseInt(process.argv[3])];
(async () => {
  let meshConfig = brokerConfig(seq);
  let mesh = await HappnerCluster.create(meshConfig);
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
    if (attached.length === 10) await mesh.stop({ reconnect: false, kill: true, wait: 1000 });
  });
})();

function brokerConfig(seq, sync, replicate) {
  var config = baseConfig(seq, sync, true, null, null, null, null, replicate);
  config.modules = {
    localComponent: {
      path: libDir + 'integration-09-local-component',
    },
    brokerComponent: {
      path: libDir + 'integration-09-broker-component',
    },
  };
  config.components = {
    localComponent: {
      startMethod: 'start',
      stopMethod: 'stop',
    },
    brokerComponent: {
      startMethod: 'start',
      stopMethod: 'stop',
    },
  };
  return config;
}
