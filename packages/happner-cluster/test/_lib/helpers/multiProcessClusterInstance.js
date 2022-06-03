const HappnerCluster = require('../../..');
var config = JSON.parse(process.argv[2]);
let meshInstance = null;

HappnerCluster.create(config)
  .then(function (instance) {
    meshInstance = instance;
    if (typeof process.send === 'function') process.send('ready');
  })
  .catch(function () {
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
