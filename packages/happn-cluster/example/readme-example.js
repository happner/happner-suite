const HappnCluster = require('happn-cluster');
const defaultConfig = {
  host: '0.0.0.0', // happn service ip
  port: 0,    // external port member will listen on, if left as 0 will pick a port from the system
  secure: true,  // to enable security
  services: {
    membership: {
      config: {
        deploymentId: 'production-81f8084e-7e09-4cd2-a875-8b3fc5d10711', // required - this is the unique deployment id for your cluster
        clusterName: 'happn-cluster', // defaults to happn-cluster, this configures your member as a member of a sub-cluster for the same deployment
        serviceName: 'historian', // defaults to default-service, this indicates the service your member provides
        memberName: 'historian-81f8084e-7e09-4cd2-a875-8b3fc5d10711', // config.name || `${serviceName}-${commons.uuid.v4()}`
        // membership pulse and scanning and health
        discoverTimeoutMs: 60e3, // cluster member will die if it cannot finish dscovery in 1 minute
        pulseIntervalMs: 1e3, // updates the membership database every second, for other members to discover and maintain this member
        memberScanningIntervalMs: 3e3, // scans the membership database for new members - or members falling away
        memberScanningErrorThreshold: 3, // how many scan errors that can be tolerated in a row before your member fails
        dependencies: {
          historian: 2 // our cluster needs 3 historian services started before it is ready to run
        },
        replicationPaths: ['**'], // what paths we want to replicate events across - defaults to all events
        // security stuff
        securityChangeSetReplicateInterval: 3e3, // how often security changesets are replicated throughout the cluster
        // clusterUsername: 'MY-CLUSTER-USER', // for inter-cluster access
        // clusterPassword: 'MY-CLUSTER-PWD', // for inter-cluster access
        // clusterPrivateKey: '[private key]', // for inter-cluster access - using keypair auth
        // clusterPublicKey: '[public key]', // for inter-cluster access - using keypair auth
      }
    },
    // proxy sub-config (defaults displayed)
    proxy: {
      config: {
        port: 0, // internal port for cluster communication - if zero an available port will be selected
        host: '0.0.0.0',
        allowSelfSignedCerts: false,
        // timeout: 20 * 60 * 1000, // request socket idle timeout
        // defer: false,
        // keyPath: 'path/to/key',
        // certPath: 'path/to/cert'
      }
    },
    transport: {
      config: {
        mode: 'http', // listen on http
      }
    },

    // // security sub-config (to enable security)
    security: {
      config: {
        adminUser: {
          username: '_ADMIN', // <---- leave this as _ADMIN
          password: 'happn'
        }
      }
    },

    // shared data plugin sub-config (defaults displayed)
    data: {
      config: {
        datastores: [
          //mongo is defaulted:
          // {
          //     name: 'mongo',
          //     provider: 'happn-db-provider-mongo',
          //     settings: {
          //         collection: process.env.MONGO_COLLECTION || 'happn-cluster',
          //         database: process.env.MONGO_DATABASE || 'happn-cluster',,
          //         url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
          //     },
          //     isDefault: true,
          // },
        ]
      }
    },      
  }
};

let startedMembers;

Promise.all([
    // start the cluster - we have 3 horizontally scalable historian services - each requiring 2 others to be available
    HappnCluster.create(defaultConfig),
    HappnCluster.create(defaultConfig),
    HappnCluster.create(defaultConfig)])
    .then((members) => {
        startedMembers = members;
        console.log('cluster up :)');
        // wait 10 seconds for stabilisation
       return new Promise(resolve => setTimeout(resolve, 10e3));
    })
    .then(() => {
        // stop them all
        return Promise.all(startedMembers.map(member => {
            return member.stop();
        }));
    })
    .then(() => {
        console.log('cluster down :(');
    });