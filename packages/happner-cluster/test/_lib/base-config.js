const PORT_CONSTANTS = require('./helpers/port-constants');
module.exports = function (
  extendedSeq,
  minPeers,
  secure,
  requestTimeout,
  responseTimeout,
  hosts,
  joinTimeout,
  replicate,
  logFile,
  cacheStatisticsInterval
) {
  let [first, seq] = extendedSeq;
  var clusterRequestTimeout = requestTimeout ? requestTimeout : 10 * 1000;
  var clusterResponseTimeout = responseTimeout ? responseTimeout : 20 * 1000;

  hosts = hosts ? hosts.split(',') : ['127.0.0.1:' + (PORT_CONSTANTS.SWIM_BASE + first).toString()];
  joinTimeout = joinTimeout || 300;
  if (logFile) {
    process.env.LOG_FILE = logFile;
    // eslint-disable-next-line no-console
    console.log(`LOG FILE: ${logFile}`);
  }

  const result = {
    name: 'MESH_' + seq,
    domain: 'DOMAIN_NAME',
    port: PORT_CONSTANTS.HAPPN_BASE + seq,
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
          config: {},
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
        membership: {
          config: {
            host: '127.0.0.1',
            port: PORT_CONSTANTS.SWIM_BASE + seq,
            seed: seq === first,
            seedWait: 1000,
            hosts,
            joinTimeout,
          },
        },
        proxy: {
          config: {
            port: PORT_CONSTANTS.PROXY_BASE + seq,
          },
        },
        orchestrator: {
          config: {
            minimumPeers: minPeers || 3,
            replicate,
          },
        },
      },
    },
  };

  if (cacheStatisticsInterval)
    result.happn.services.cache.config.statisticsInterval = cacheStatisticsInterval;

  return result;
};
