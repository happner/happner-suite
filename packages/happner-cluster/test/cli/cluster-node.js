var HappnerCluster = require('../..');
var mongoUrl = 'mongodb://127.0.0.1:27017';
var mongoCollection = 'happn-cluster';

var processarguments = {};

if (process.argv.length > 2) {
  for (var i = 2; i < process.argv.length; i++) {
    var arg = process.argv[i];
    processarguments[arg.split('=')[0]] = arg.split('=')[1];
  }
}

if (!processarguments.domain) processarguments.domain = 'DOMAIN_NAME';

if (processarguments.hosts) processarguments.hosts = processarguments.hosts.split(',');
else processarguments.hosts = [];

if (!processarguments.port) processarguments.port = 55000;
else processarguments.port = parseInt(processarguments.port);

if (!processarguments.membershipport) processarguments.membershipport = 56000;
else processarguments.membershipport = parseInt(processarguments.membershipport);

if (!processarguments.proxyport) processarguments.proxyport = 57000;
else processarguments.proxyport = parseInt(processarguments.proxyport);

if (!processarguments.clusterName) processarguments.clusterName = 'happn-cluster';
if (processarguments.seed == null) processarguments.seed = true;
else processarguments.seed = processarguments.seed === 'true';

if (processarguments.secure == null) processarguments.secure = false;
else processarguments.secure = processarguments.secure === 'true';

processarguments.persistMembers = processarguments.persistMembers === 'true';

if (processarguments.seedWait == null) processarguments.seedWait = 0;
if (processarguments.randomWait == null) processarguments.randomWait = 0;
if (processarguments.joinTimeout == null) processarguments.joinTimeout = 1000;
if (processarguments.pingInterval == null) processarguments.pingInterval = 1000;
if (processarguments.pingTimeout == null) processarguments.pingTimeout = 200;
if (processarguments.pingReqTimeout == null) processarguments.pingReqTimeout = 600;
if (processarguments.pingReqGroupSize === 3) processarguments.pingReqGroupSize = 3;
if (processarguments.maxDgramSize == null) processarguments.maxDgramSize = 512;
if (processarguments.disseminationFactor == null) processarguments.disseminationFactor = 15;

var config = {
  name: processarguments.membername,
  domain: processarguments.domain,
  port: processarguments.port,
  happn: {
    secure: processarguments.secure,
    services: {
      data: {
        config: {
          datastores: [
            {
              name: 'mongo',
              provider: 'happn-db-provider-mongo',
              isDefault: true,
              settings: {
                collection: mongoCollection,
                database: mongoCollection,
                url: mongoUrl,
              },
            },
          ],
        },
      },
      security: {
        config: {
          sessionTokenSecret: 'TEST-SESSION-TOKEN-SECRET',
        },
      },
      membership: {
        config: {
          persistMembers: processarguments.persistMembers,
          clusterName: processarguments.clusterName,
          seed: processarguments.seed,
          seedWait: processarguments.seedWait,
          randomWait: processarguments.randomWait,
          host: processarguments.host, // defaults to first public IPv4 address
          port: processarguments.membershipport,
          hosts: processarguments.hosts,
          joinTimeout: processarguments.joinTimeout,
          pingInterval: processarguments.pingInterval,
          pingTimeout: processarguments.pingTimeout,
          pingReqTimeout: processarguments.pingReqTimeout,
          pingReqGroupSize: processarguments.pingReqGroupSize,
          udp: {
            maxDgramSize: processarguments.maxDgramSize,
          },
          disseminationFactor: processarguments.disseminationFactor,
        },
      },
      proxy: {
        config: {
          host: '0.0.0.0',
          port: processarguments.proxyport,
          allowSelfSignedCerts: true,
        },
      },
    },
  },
};

config.happn.services.orchestrator = {
  config: {
    replicate: ['test/**'],
  },
};

HappnerCluster.create(config)
  .then(function (server) {
    server._mesh.happn.server.services.membership.on('update', function (memberInfo) {
      if (process.send)
        process.send({
          operation: 'update',
          data: {
            memberId: memberInfo.memberId,
          },
        });
    });

    server._mesh.happn.server.services.membership.on('add', function (memberInfo) {
      if (process.send)
        process.send({
          operation: 'add',
          data: {
            memberId: memberInfo.memberId,
          },
        });
    });
  })
  .catch(function () {});
