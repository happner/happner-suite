const path = require('path'),
  fs = require('fs-extra'),
  _ = require('lodash'),
  libAsync = require('async'),
  utils = require('./lib/utils');
const [constantsPath, utilsPath] = ['constants', 'utils'].map((fileName) => {
  return path.resolve(__dirname, `./lib/${fileName}.js`);
});
module.exports = {
  maybePromisify: utils.maybePromisify,
  constants: require('./lib/constants-builder'),
  utils,
  web: {
    constants: () => {
      return fs.readFileSync(constantsPath, 'utf8').replace('module.exports = ', '');
    },
    utils: () => {
      return fs.readFileSync(utilsPath, 'utf8').replace('module.exports = ', '');
    },
    maybePromisifyPath: require.resolve('./lib/maybe-promisify'),
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
};
