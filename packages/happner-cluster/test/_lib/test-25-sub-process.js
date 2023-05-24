const baseConfig = require('./base-config');
const libDir = require('./lib-dir');
const HappnerCluster = require('../..');
const users = require('./users');
let localInstance;

let deploymentId = process.argv.pop();
let seq = process.argv.pop();

(async () => {
  if (seq === 1) {
    await startInternal(seq, 2);
    await users.add(localInstance, 'username', 'password');
    await users.allowMethod(localInstance, 'username', 'breakingComponent', 'happyMethod');
    await users.allowMethod(localInstance, 'username', 'breakingComponent', 'breakingMethod');
  } else {
    await startInternal(seq, 2);
  }
})();
async function startInternal(id, clusterMin) {
  const server = await HappnerCluster.create(remoteInstanceConfig(id, clusterMin));
  localInstance = server;
}

function remoteInstanceConfig(seq, sync) {
  var config = baseConfig(seq, sync, true);
  config.modules = {
    breakingComponent: {
      path: libDir + 'integration-25-breaking-component',
    },
  };
  config.components = {
    breakingComponent: {
      startMethod: 'start',
      stopMethod: 'stop',
    },
  };
  config.happn.services.membership = {
    config: {
      deploymentId,
      securityChangeSetReplicateInterval: 20, // 50 per second
    },
  };
  return config;
}
