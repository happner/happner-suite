const HappnerCluster = require('happner-cluster');

const config = {
  // domain: 'DOMAIN_NAME', // same as other cluster nodes, used for event replication - allows clusters to be segmented by domain
  //
  cluster: {
    //  requestTimeout: 20 * 1000, // exchange timeouts
    //  responseTimeout: 30 * 1000
  },

  happn: {
    port: 0, // listen on any available port
    services: {
      data: {
        // see detailed data sub-config in happn-cluster docs
        config: {
          datastores: [
            // defaulted by happn-cluster
            //{
            //  name: 'mongo',
            //  provider: 'happn-service-mongo-2',
            //  isDefault: true,
            //  settings: {
            //    collection: 'happn-cluster',
            //    database: 'happn-cluster',
            //    url: 'mongodb://127.0.0.1:27017'
            //    url: 'mongodb://username:password@127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/happn?replicaSet=test-set&ssl=true&authSource=admin'
            //  }
            //},
            // defaulted by happner-cluster to prevent overwrites in shared db
            // where each cluster server requires unique data at certain paths
            //{
            //  name: 'nedb-own-schema',
            //  settings: {},
            //  patterns: [
            //    '/mesh/schema/*',
            //    '/_SYSTEM/_NETWORK/_SETTINGS/NAME',
            //    '/_SYSTEM/_SECURITY/_SETTINGS/KEYPAIR'
            //  ]
            //}
          ],
        },
      },
      membership: {
        config: {
          deploymentId: 'production-81f8084e-7e09-4cd2-a875-8b3fc5d10711', // required - this is the unique deployment id for your cluster
          clusterName: 'happn-cluster', // defaults to happn-cluster, this configures your member as a member of a sub-cluster for the same deployment
          serviceName: 'historian', // defaults to default-service, this indicates the service your member provides
          // membership pulse and scanning and health
          discoverTimeoutMs: 60e3, // cluster member will die if it cannot finish dscovery in 1 minute
          pulseIntervalMs: 1e3, // updates the membership database every second, for other members to discover and maintain this member
          memberScanningIntervalMs: 3e3, // scans the membership database for new members - or members falling away
          memberScanningErrorThreshold: 3, // how many scan errors that can be tolerated in a row before your member fails
          dependencies: {
            historian: 2, // our cluster needs 3 historian services started before it is ready to run
          },
          replicationPaths: ['**'], // what paths we want to replicate events across - defaults to all events
          // security stuff
          securityChangeSetReplicateInterval: 3e3, // how often security changesets are replicated throughout the cluster
          // clusterUsername: 'MY-CLUSTER-USER', // for inter-cluster access
          // clusterPassword: 'MY-CLUSTER-PWD', // for inter-cluster access
          // clusterPrivateKey: '[private key]', // for inter-cluster access - using keypair auth
          // clusterPublicKey: '[public key]', // for inter-cluster access - using keypair auth
        },
      },
    },
  },

  modules: {},
  components: {},
};

let startedMembers;

Promise.all([
  // start the cluster - we have 3 horizontally scalable historian services wrapped in happner - each requiring 2 others to be available
  HappnerCluster.create(config),
  HappnerCluster.create(config),
  HappnerCluster.create(config),
])
  .then((members) => {
    startedMembers = members;
    /* eslint-disable no-console */
    console.log('cluster up :)');
    // wait 10 seconds for stabilisation
    return new Promise((resolve) => setTimeout(resolve, 10e3));
  })
  .then(() => {
    // stop them all
    return Promise.all(
      startedMembers.map((member) => {
        return member.stop();
      })
    );
  })
  .then(() => {
    /* eslint-disable no-console */
    console.log('cluster down :(');
  });
