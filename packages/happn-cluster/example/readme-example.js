const HappnCluster = require('happn-cluster');
const HappnClient = require('happn-3').client;
const deploymentId = `production-${Date.now().toString()}`;
const defaultConfig = {
  host: '0.0.0.0', // happn service ip
  port: 0, // external port member will listen on, if left as 0 will pick a port from the system
  secure: true, // to enable security
  services: {
    membership: {
      config: {
        deploymentId, // required - this is the unique deployment id for your cluster
        clusterName: 'happn-cluster', // defaults to happn-cluster, this configures your member as a member of a sub-cluster for the same deployment
        serviceName: 'historian', // defaults to default-service, this indicates the service your member provides
        memberName: undefined, // defaults to ${serviceName}-${commons.uuid.v4()}
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
      },
    },
    transport: {
      config: {
        mode: 'http', // listen on http
      },
    },

    // // security sub-config (to enable security)
    security: {
      config: {
        adminUser: {
          username: '_ADMIN', // <---- leave this as _ADMIN
          password: 'happn',
        },
      },
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
        ],
      },
    },
  },
};

async function startAndStopExampleCluster() {
  let startedMembers = await Promise.all([
    // start the cluster - we have 3 horizontally scalable historian services - each requiring 2 others to be available
    HappnCluster.create(defaultConfig),
    HappnCluster.create(defaultConfig),
    HappnCluster.create(defaultConfig),
  ]);
  // start another member - listening on the default happn port, so our client can connect
  defaultConfig.port = 55000;
  startedMembers.push(await HappnCluster.create(defaultConfig));
  /* eslint-disable no-console */
  console.log('cluster up :)');
  // wait for cluster stabilisation
  await new Promise((resolve) => setTimeout(resolve, 8e3));

  // create and connect our client
  const happnClient = await HappnClient.create({
    username: '_ADMIN',
    password: 'happn',
  });

  // subscribe and publish
  await happnClient.on('/test/topic/*', (payload) => {
    /* eslint-disable no-console */
    console.log(`hello ${payload.message}`);
  });

  await happnClient.set('/test/topic/1', {
    message: 'world!',
  });

  // wait for message to propagate
  await new Promise((resolve) => setTimeout(resolve, 2e3));

  // stop client & cluster
  await happnClient.disconnect();
  await Promise.all(
    startedMembers.map((member) => {
      return member.stop();
    })
  );
  /* eslint-disable no-console */
  console.log('cluster down :(');
}

startAndStopExampleCluster();
