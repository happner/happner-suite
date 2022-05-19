var HappnerCluster = require('happner-cluster');
const path = require('path');
let config = {
  name: 'MESH_1',
  // name: 'UNIQUE_NAME', // allow default uniqie name
  domain: 'DOMAIN_NAME', // same as other cluster nodes, used for event replication - allows clusters to be segmented by domain
  modules: {
    timer: {
      path: path.resolve(__dirname, './timer'),
    },
  },
  components: {
    timer: {},
  },
};

(async () => {
  let node = await HappnerCluster.create(config);
  console.log(Object.keys(node.exchange.timer));
  let time = await node.exchange.timer.getSystemTime();
  console.log('THE TIME IS', time);
})();
