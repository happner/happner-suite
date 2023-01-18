const path = require('path'),
  fs = require('fs-extra'),
  _ = require('lodash'),
  libAsync = require('async');
const [constantsPath, utilsPath] = ['constants', 'utils'].map((fileName) => {
  return path.resolve(__dirname, `./lib/${fileName}.js`);
});
module.exports = {
  maybePromisify: require('./lib/maybe-promisify'),
  constants: require('./lib/constants-builder'),
  utils: require('./lib/utils'),
  web: {
    constants: () => {
      return fs.readFileSync(constantsPath, 'utf8').replace('module.exports = ', '');
    },
    utils: () => {
      return fs.readFileSync(utilsPath, 'utf8').replace('module.exports = ', '');
    },
  },
  fs,
  _,
  async: libAsync,
  hyperid: require('happner-hyperid'),
  sift: require('sift'),
  mongoFilter: require('./lib/mongo-filter'),
  uuid: require('uuid'),
  nanoid: require('nanoid').nanoid,
  sillyname: require('happn-sillyname'),
  nodeUtils: require('util'),
  rimraf: require('rimraf'),
  path: require('path'),
  BaseDataProvider: require('./lib/base-data-provider'),
  lruCache: require('lru-cache'),
  fastClone: require('fast-clone'),
  HashRingSemaphore: require('./lib/concurrency/hashring-semaphore'),
  lock: require('async-lock'),
};
// must be declared after we have attached other deps
module.exports.clone = require('./lib/clone');
