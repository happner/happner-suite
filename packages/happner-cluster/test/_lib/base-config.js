const PORT_CONSTANTS = require('./helpers/port-constants');
module.exports = function (
  seq,
  minPeers,
  secure,
  requestTimeout,
  responseTimeout,
  hosts,
  joinTimeout,
  replicate,
  logFile
) {
  
  var clusterRequestTimeout = requestTimeout ? requestTimeout : 10 * 1000;
  var clusterResponseTimeout = responseTimeout ? responseTimeout : 20 * 1000;

  joinTimeout = joinTimeout || 300;
  if (logFile) {
    process.env.LOG_FILE = logFile;
    // eslint-disable-next-line no-console
    console.log(`LOG FILE: ${logFile}`);
  }

  return {
    name: 'MESH_' + seq,
    domain: 'DOMAIN_NAME',
    port: 0, // PORT_CONSTANTS.HAPPN_BASE + seq,
    ignoreDependenciesOnStartup: true,
    cluster: {
      requestTimeout: clusterRequestTimeout,
      responseTimeout: clusterResponseTimeout,
    },
    happn: {
      secure: secure,
      utils: {
        logFile,
      },
      services: {
        cache: {
          config: {
            statisticsInterval: 0e3,
          },
        },
        security: {
          config: {
            sessionTokenSecret: 'TEST-SESSION-TOKEN-SECRET',
          },
        },
        data: {
          config: {
            autoUpdateDBVersion: true,
          },
        },
        proxy: {
          config: {
            port: 0, //PORT_CONSTANTS.PROXY_BASE + seq,
          },
        },
        orchestrator: {
          config: {
            minimumPeers: minPeers || 3,
            replicate,
            timing: {
              keepAlive: 2e3,
              memberRefresh: 2e3,
              keepAliveThreshold: 3e3,
              stabilisedTimeout: 10e3,
            },
          },
        },
      },
    },
  };
};
