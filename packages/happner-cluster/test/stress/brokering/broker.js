/* eslint-disable no-console */
const HappnerCluster = require('../../..');
const baseConfig = require('../../_lib/base-config');
const libDir = require('../../_lib/lib-dir');
const commander = require('commander');
const path = require('path');
commander
  .option('--seq [number]', 'sequence number')
  .option('--min [number]', 'minimum peers')
  .option('--seed [number]', 'minimum peers')
  .option('--hosts [number]', 'hosts')
  .option('--join-timeout [number]', 'join timeout')
  .parse(process.argv);

commander.seq = parseInt(commander.seq || 1);
commander.hosts = commander.hosts || '127.0.0.1:9001,127.0.0.1:9002,127.0.0.1:9003,127.0.0.1:9004';
commander.joinTimeout = commander.joinTimeout || 300;

console.log(`BROKER ${commander.seq}: ${process.pid}`);

function brokerInstanceConfig(seq, sync) {
  var config = baseConfig(
    [seq, seq],
    sync,
    true,
    null,
    null,
    commander.hosts,
    commander.joinTimeout,
    null,
    path.resolve(__dirname, `../logs/log-${seq}`)
  );
  config.authorityDelegationOn = true;
  config.modules = {
    localComponent: {
      path: libDir + 'integration-09-local-component',
    },
    brokerComponent: {
      path: libDir + 'integration-10-broker-component-dynamic',
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
    data: {},
  };
  return config;
}

HappnerCluster.create(brokerInstanceConfig(commander.seq, commander.min)).then((instance) => {
  setInterval(() => {
    // eslint-disable-next-line no-console
    console.log(
      `active sessions: ${instance._mesh.happn.server.services.session.__activeSessions.size()}`
    );
  }, 5000);
});
