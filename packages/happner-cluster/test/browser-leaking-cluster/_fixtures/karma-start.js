var Server = require('karma').Server;
const { fork } = require('child_process');
var karma = new Server(
  {
    configFile: __dirname + '/01.karma.conf.js',
    singleRun: true,
  },
  function () {
    // process.send('clients up');
  }
);

karma.start();
