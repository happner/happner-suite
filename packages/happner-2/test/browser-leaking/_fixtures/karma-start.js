var Server = require('karma').Server;
var karma = new Server(
  {
    configFile: __dirname + '/01.karma.conf.js',
    singleRun: true,
  },
  function () {}
);

karma.start();
