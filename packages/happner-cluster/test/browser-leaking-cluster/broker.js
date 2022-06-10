const HappnerCluster = require('../..');
const baseConfig = require('../_lib/base-config');
const libDir = require('../_lib/lib-dir');
let seq = [parseInt(process.argv[2]), parseInt(process.argv[3])];
(async () => {
  let meshConfig = brokerConfig(seq, 2);
  let mesh = await HappnerCluster.create(meshConfig);

  let attached = [];

  mesh._mesh.happn.events.on('attach', async (data) => {
    attached.push(data.user.username);
  });
  process.on('message', async (msg) => {
    if (msg === 'kill') {
      mesh.stop({ reconnect: true, kill: true, wait: 50 });
    }
    if (msg === 'listClients') {
      mesh._mesh.happn.server.services.security.listActiveSessions((e, active) => {
        let connected = Object.keys(mesh._mesh.happn.server.connections);
        process.send({ attached, active, connected });
      });
    }
  });
  mesh._mesh.happn.server.services.security.activateSessionManagement(() => {
    process.send('started');
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
  // config.happn.services.orchestrator.config.minimumPeers = 2;
  config.happn.services.cache = { config: { statisticsIntervals: 0 } };
  config.port = 57000;
  config.happn.services.proxy = config.happn.services.proxy || {};
  config.happn.services.proxy.config = config.happn.services.proxy.config || {};
  config.happn.services.proxy.config.port = 55000;
  return config;
}
