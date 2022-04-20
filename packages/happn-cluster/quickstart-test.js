const { client } = require('happn-3');

(async () => {
  let config = {
    port: 1234, //int, on a single device, use a differetn port for each node.
    services: {
      orchestrator: {
        config: {
          deployment: 'DEPLOYMENT_123', //String, happn-path
          minimumPeers: 3,
        },
      },
      proxy: {
        config: {
          port: 4567,
        },
      },
    },
  };
  let nodes = [];
  for (let port of [9000, 9100, 9200]) {
    config.port = port;
    config.services.proxy.config.port = port + 50;
    nodes.push(require('happn-cluster').create(config));
  }
  nodes = await Promise.all(nodes);

  await nodes[0].services.data.upsert('/some/happn/path', { an: 'object' });
  let data = await nodes[2].services.data.get('/some/happn/path');
  console.log({data})
  let client1 = await require('happn-3').client.create({ port: 9000 });
  let client2 = await require('happn-3').client.create({ port: 9200 });
  client1.on('test/data', (data, meta) => console.log({ data, meta }));
  await client2.set('test/data', { data: 'one' });
  let result = await client1.get('test/data');
  console.log(result);
  await client2.publish('test/data', { data: 'two' });

  //   my_client_instance.publish('e2e_test1/testsubscribe/data/', {property1:'property1',property2:'property2',property3:'property3'}, function(e, result){
})();
