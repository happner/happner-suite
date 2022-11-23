const HappnerCluster = require('../../..');
var config = JSON.parse(process.argv[2]);
let meshInstance = null;
let peerEvents = [];

HappnerCluster.create(config)
  .then(function (instance) {
    meshInstance = instance;
    if (typeof process.send === 'function') process.send('ready');
  })
  .catch(function (e) {
    console.log(e);
    if (typeof process.send === 'function') process.send('error');
    process.exit(1);
  });

process.on('message', async (m) => {
  if (m === 'stopMesh') {
    if (meshInstance) {
      await meshInstance.stop();
    }
    process.exit(0);
  }
  if (m === 'getPort') {
    process.send({ port: meshInstance._mesh.happn.server.config.services.proxy.port });
  }
  if (m === 'listenOnPeers') {
    meshInstance._mesh.happn.server.services.orchestrator.on('peer/add', (name) => {
      peerEvents.push({ action: 'added', name });
    });
    meshInstance._mesh.happn.server.services.orchestrator.on('peer/remove', (name) => {
      peerEvents.push({ action: 'removed', name });
    });
  }
  if (m === 'getPeerEvents') {
    process.send({ peerEvents });
  }
  if (m === 'listMembers') {
    process.send(
      JSON.stringify({
        peers: Object.keys(meshInstance._mesh.happn.server.services.orchestrator.peers),
        peerEndpoints: Object.values(
          meshInstance._mesh.happn.server.services.orchestrator.peers
        ).map((peer) => peer.endpoint),
        members: Object.keys(meshInstance._mesh.happn.server.services.orchestrator.members),
      })
    );
  }
});
