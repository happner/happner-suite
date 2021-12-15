const path = require('path'), fs = require('fs');
const [constantsPath, utilsPath] = ['constants', 'utils'].map(fileName => {
    return path.resolve(__dirname, `./lib/${fileName}.js`);
  });
module.exports = {
    maybePromisify: require("./lib/maybe-promisify"),
    constants: require("./lib/constants"),
    utils: require("./lib/utils"),
    web: {
        constants: () => {
            return fs.readFileSync(constantsPath, 'utf8').replace('module.exports = ', '');
        },
        utils: () => {
            return fs.readFileSync(utilsPath, 'utf8').replace('module.exports = ', '');
        }
    }
}