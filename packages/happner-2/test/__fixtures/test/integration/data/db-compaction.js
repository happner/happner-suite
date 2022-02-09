var Happner = require('../../../../..');
var path = require('path');

Happner.create({
  name: 'MESH_NAME',
  happn: {
    services: {
      data: {
        config: {
          autoUpdateDBVersion: true,
          datastores: [
            {
              name: 'nedb',
              provider: 'happn-db-provider-nedb',
              settings: {
                filename: path.join(__dirname, 'test.nedb'),
                compactInterval: 5000
              },
            },
          ],
        },
      },
    },
  }
})
.then(function (server) {
  // stop the mesh after 2 seconds.
  // The process should exit but it currently does not.
  setTimeout(function () {
    server.stop({reconnect: false}, function (err) {
      if (err) console.error(err);
    });
  }, 2000);
})
.catch(function (err) {
  console.error(err);
});
