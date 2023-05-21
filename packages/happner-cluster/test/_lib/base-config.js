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
    port: 0,
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
            statisticsInterval: 0,
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
            port: 0,
          },
        },
        membership: {
          config: {
            clusterName: 'clusterName',
            // the identifier for this member, NB: config.name overrides this in utils/default-name
            memberName: 'memberName',
            // abort start and exit, as dependencies and members not found on startup cycle
            discoverTimeoutMs: 5e3,
            healthReportIntervalMs: 1e3,
            // announce presence every 500ms
            pulseIntervalMs: 5e2,
            // check membership registry every 3 seconds
            memberScanningIntervalMs: 3e3,
            // intra-cluster credentials
            clusterUsername: '_CLUSTER',
            clusterPassword: 'PASSWORD',
            // event paths we want to replicate on, by default everything
            replicationPaths: replicate === false ? false : replicate || ['**'],
          },
        },
        // orchestrator: {
        //   config: {
        //     minimumPeers: minPeers || 3,
        //     replicate,
        //     timing: {
        //       keepAlive: 2e3,
        //       memberRefresh: 2e3,
        //       keepAliveThreshold: 3e3,
        //       stabilisedTimeout: 10e3,
        //     },
        //   },
        // },
      },
    },
  };
};
