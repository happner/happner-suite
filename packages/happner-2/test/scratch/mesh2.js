const Mesh = require('happner-2');
let config = {
  name: 'SecondMesh',
  happn: {
    port: 55001, //First mesh is on default 55000
  },
  endpoints: {
    FirstMesh: 55000,
  },
};
let happner2mesh = new Mesh();
(async () => {
  await happner2mesh.initialize(config);
  await happner2mesh.start();
//   await happner2mesh.exchange.whoAmI.on('Message', console.log);
  //   let result = await happner2mesh.exchange.FirstMesh.whoAmI.getHappnName();
  //   console.log(result);
  // result = {name: "whoAmI"}
})();
