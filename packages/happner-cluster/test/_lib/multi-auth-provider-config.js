module.exports = function (
  seq,
  minPeers,
  secure,
  requestTimeout,
  responseTimeout,
  hosts,
  joinTimeout,
  replicate,
  logFile
) {
  const path = require('path');
  const config = require('./base-config')(
    seq,
    minPeers,
    secure,
    requestTimeout,
    responseTimeout,
    hosts,
    joinTimeout,
    replicate,
    logFile
  );

  config.happn.services.security = {
    config: {
      authProviders: {
        second: path.resolve(__dirname, './workingAuth.js'),
      },
      defaultAuthProvider: 'second',
      sessionTokenSecret: 'TEST-SESSION-TOKEN-SECRET',
    },
  };
  return config;
};
