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
});
