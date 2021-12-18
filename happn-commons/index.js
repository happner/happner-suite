const path = require('path'), fs = require('fs-extra'), _ = require('lodash'), libAsync  = require('async');
const [constantsPath, utilsPath] = ['constants', 'utils'].map(fileName => {
    return path.resolve(__dirname, `./lib/${fileName}.js`);
  });
module.exports = {
    maybePromisify: require("./lib/maybe-promisify"),
    constants: require("./lib/constants-builder"),
    utils: require("./lib/utils"),
    web: {
        constants: () => {
            return fs.readFileSync(constantsPath, 'utf8').replace('module.exports = ', '');
        },
        utils: () => {
            return fs.readFileSync(utilsPath, 'utf8').replace('module.exports = ', '');
        }
    },
    fs,
    _,
    async: libAsync,
    hyperid: require('happner-hyperid'),
    sift: require('sift'),
    mongoFilter: require('./lib/mongo-filter'),
    uuid: require('uuid')
}