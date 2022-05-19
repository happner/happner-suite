const Mesh = require('happner-2');
const path = require('path');
let config = {
  name: 'FirstMesh',
  modules: {
    whoAmI: {
      path: path.resolve(__dirname, './whoami'),
    },
  },
  components: {
    whoAmI: {},
  },
};
let happner2mesh = new Mesh();
(async () => {
  await happner2mesh.initialize(config);
  await happner2mesh.start();
  // let result = await happner2mesh.exchange.whoAmI.getHappnName();
  // console.log(result);
})();
