const Happner = require('happner-2');
var testClient = new Happner.MeshClient();
(async () => {
  await testClient.login({
    port: 55001,
    // username: '_ADMIN',
    // password: 'happn',
  });
  await testClient.event.whoAmI.on('Message', (data) => {
    console.log("Happner client got 'Message' Event from whoAmI component, with data: ", data);
  });
  //   console.log(Object.keys(testClient.exchange.FirstMesh))
  let result = await testClient.exchange.FirstMesh.whoAmI.getHappnName();

  console.log('HAPPNER CLIENT GOT result: ', result);
})();
