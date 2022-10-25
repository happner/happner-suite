global.PRIMUS_DODGE_MISSING_OPTIONS = true; // see happner/primus /dist/primus
const _ = require('lodash');
const Happn = require('happn-3');
const dface = require('dface');
const path = require('path');
const defaultName = require('./utils/default-name');
const { nodeUtils } = require('happn-commons');
const databaseConfigurator = require('./configurators/database-configurator').create();

module.exports.create = nodeUtils.promisify(async function (config, callback) {
  let happn;
  if (!config) throw new Error('missing config');
  config = _.defaultsDeep({}, config, getDefaultConfig());
  delete config.services.membership; //backwards compatibility
  config.host = dface(config.host);
  config.name = defaultName(config);

  databaseConfigurator.configure(config);

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
});
