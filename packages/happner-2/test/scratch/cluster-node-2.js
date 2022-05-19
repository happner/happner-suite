var HappnerCluster = require('happner-cluster');
const delay = require('await-delay');
const path = require('path');
let config = {
  // name: 'UNIQUE_NAME', // allow default uniqie name
  domain: 'DOMAIN_NAME', // same as other cluster nodes, used for event replication - allows clusters to be segmented by domain
  happn: {
    port: 57001,
    services: {
      proxy: {
        config: {
          port: 55001,
        },
      },
    },
  },
  modules: {
    watch: {
      path: path.resolve(__dirname, './watch'),
    },
  },
  components: {
    watch: {},
  },
};

(async () => {
  let node = await HappnerCluster.create(config);
  await delay(3000)
  let time = await node.exchange.watch.getHumanTime();
  console.log('THE TIME IS', time);
})();
