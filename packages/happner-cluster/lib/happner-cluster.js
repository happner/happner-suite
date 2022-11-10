let Happner = require('happner-2');
let HappnCluster = require('happn-cluster');
let ClusterPlugin = require('./cluster-plugin');
let filterEventVersions = require('./filter-event-versions');
let localDb = require('./local-db');

module.exports.create = require('util').promisify(function (config, callback) {
  var happner, cursor;

  if (typeof config === 'function') {
    callback = config;
    return callback(new Error('missing config'));
  }

  Happner.AssignedHappnServer = HappnCluster; // Switch happner datalayer to cluster

  // happner listens before initializing
  // to allow for inter-cluster replication bridges to connect
  config.listenFirst = true;

  config.happn = config.happn || {};
  config.happn.services = config.happn.services || {};
  config.happn.services.orchestrator = config.happn.services.orchestrator || {};

  cursor = config.happn.services.orchestrator;
  cursor.config = cursor.config || {};

  if (cursor.config.replicate === false) {
    // we are explicitly not interested in cluster events
    cursor.config.replicate = [];
  } else {
    if (cursor.config.replicate == null) {
      cursor.config.replicate = [];
    }
    if (!Array.isArray(cursor.config.replicate)) {
      throw new Error('[happn.services.orchestrator.replicate] must be an array');
    }
    //receive replicated events from the configured cluster domain
    cursor.config.replicate = cursor.config.replicate.concat([
      `/_events/${config.domain}/*/*`,
      `/_events/${config.domain}/*/*/*`,
      `/_events/${config.domain}/*/*/*/*`,
      `/_events/${config.domain}/*/*/*/*/*`,
      `/_events/${config.domain}/*/*/*/*/*/*`,
      `/_events/${config.domain}/*/*/*/*/*/*/*`, // replication will work for topics with up to 6 segments
    ]);
  }
  config.happn.services.proxy = config.happn.services.proxy || {};
  cursor = config.happn.services.proxy;
  cursor.config = cursor.config || {};

  // proxy is started manually after happner is up
  // so that clients do not connect until component startMethods are run
  cursor.config.defer = true;

  config.happn.services.subscription = config.happn.services.subscription || {};
  cursor = config.happn.services.subscription;
  cursor.config = cursor.config || {};
  cursor.config.filter = filterEventVersions;
  if ((config.port || config.port) === 0 && !config.happn.port) config.happn.port = config.port;
  config.plugins = config.plugins || [];
  config.cluster = config.cluster || {};

  config.plugins.push(ClusterPlugin(config.cluster));

  if (!localDb.gotConfig(config)) {
    localDb.addConfig(config);
  }

  Happner.create(config)

    .then(function (_happner) {
      happner = _happner;
    })

    .then(function () {
      let brokerage = require('./brokerage').instance(config.name);
      if (brokerage && config.cluster.dependenciesSatisfiedDeferListen)
        return brokerage.deferProxyStart(happner._mesh.happn.server.services.proxy);
      return happner._mesh.happn.server.services.proxy.start();
    })
    .then(function () {
      let brokerWebProxy = require('./broker-web-proxy').instance(config.name);
      if (brokerWebProxy)
        return brokerWebProxy.attachToClusterMiddlewareServer(happner._mesh.happn.server.connect);
      return Promise.resolve();
    })

    .then(function () {
      callback(null, happner);
    })

    .catch(function (error) {
      if (!happner) return callback(error);
      happner.log.fatal(error);
      happner.stop(function (e) {
        if (e) happner.log.error(e);
        callback(error);
      });
    });
});
