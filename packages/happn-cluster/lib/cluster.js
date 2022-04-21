global.PRIMUS_DODGE_MISSING_OPTIONS = true; // see happner/primus /dist/primus
const _ = require('lodash');
const Happn = require('happn-3');
const dface = require('dface');
const path = require('path');
const defaultName = require('./utils/default-name');
const { nodeUtils } = require('happn-commons');

module.exports.create = nodeUtils.promisify(async function (config, callback) {
  let happn;
  if (!config) throw new Error('missing config');
  config = _.defaultsDeep({}, config, getDefaultConfig());
  delete config.services.membership; //backwards compatibility
  config.host = dface(config.host);
  config.name = defaultName(config);

  if (config.services.data.config.datastores.length > 0) {
    // check that a mongodb store is present
    var present = false;
    config.services.data.config.datastores.forEach(function (ds) {
      if (ds.provider === 'happn-db-provider-mongo') {
        present = true;
      }
    });
    if (!present) addMongoDb(config.services.data);
  } else {
    addMongoDb(config.services.data);
  }

  try {
    happn = await Happn.service.create(config);
    await happn.services.orchestrator.start();
    await happn.services.replicator.start();
    await happn.services.orchestrator.stabilised();
    if (config.services.proxy.config.defer) {
      return callback(null, happn);
    }
    await happn.services.proxy.start();
    return callback(null, happn);
  } catch (error) {
    if (!happn) throw error;
    happn.log.fatal(error);
    await happn.stop();
    return callback(error);
  }

  function getDefaultConfig() {
    return {
      port: 57000,
      transport: {
        mode: 'http',
      },
      services: {
        data: {
          config: {
            datastores: [],
          },
        },
        orchestrator: {
          path: __dirname + path.sep + 'services' + path.sep + 'orchestrator.js',
          config: {},
        },
        replicator: {
          path: __dirname + path.sep + 'services' + path.sep + 'replicator.js',
          config: {},
        },
        proxy: {
          path: __dirname + path.sep + 'services' + path.sep + 'proxy.js',
          config: {},
        },
      },
    };
  }

  function addMongoDb(cursor) {
    cursor.config.datastores.push({
      name: 'mongo',
      provider: 'happn-db-provider-mongo',
      isDefault: true,
      settings: {
        collection: 'happn-cluster',
        database: 'happn-cluster',
        url: 'mongodb://127.0.0.1:27017',
      },
    });
  }
});
