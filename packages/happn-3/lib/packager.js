const commons = require('happn-commons'),
  fs = commons.fs,
  Utils = require('./services/utils/service'),
  utils = new Utils(),
  path = require('path'),
  happnPackage = require('../package.json'),
  md5 = require('md5'),
  { minify } = require('terser');

module.exports = {
  package: happnPackage,
  protocol: happnPackage.protocol,
  version: happnPackage.version,
  __cachedBrowserClient: null,
  __createBrowserClient: async function (options) {
    var protocol = happnPackage.protocol;
    var buf = fs.readFileSync(path.resolve(__dirname, './client.js'));

    var constantsbuf = `\r\nCONSTANTS = ${commons.web.constants()}\r\n`;

    var clientScript = buf
      .toString()
      .replace('{{protocol}}', protocol) //set the protocol here
      .replace('{{version}}', happnPackage.version) //set the happn version here
      .replace('//{{constants}}', constantsbuf)
      .replace('//{{utils}}', () => {
        return `\r\nutils = ${commons.web.utils()}\r\n`;
      });

    if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production') {
      this.__cachedBrowserClient =
        '//happn client v' +
        happnPackage.version +
        '\r\n' +
        '//protocol v' +
        protocol +
        '\r\n' +
        '//id ' +
        options.id +
        '\r\n' +
        clientScript;
    } else {
      this.__cachedBrowserClient =
        '//happn client v' +
        happnPackage.version +
        '\r\n' +
        '//protocol v' +
        protocol +
        '\r\n' +
        clientScript;
    }

    if (options.min) {
      try {
        const minified = await minify(this.__cachedBrowserClient);
        this.__cachedBrowserClient = minified.code;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`minify failure: ${e.message}`);
        throw e;
      }
    }
  },

  browserClient: async function (options) {
    if (!options) options = {};
    var clientDirPath;
    var clientFilePath;
    var dirPath = require('homedir')();

    if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production') {
      if (!options.id) options.id = Date.now().toString();
    }

    clientDirPath = `${utils.removeLast(dirPath, path.sep)}${path.sep}.happner${path.sep}`;
    clientFilePath = clientDirPath + 'happn-3-browser-client-' + this.version + '.js';

    if (options.overwrite) {
      this.__cachedBrowserClient = null;
      try {
        fs.unlinkSync(clientFilePath);
      } catch (e) {
        // ignore
      }
    }

    //return a cached version if we are in production
    if (options.contentsOnly && this.__cachedBrowserClient) return this.__cachedBrowserClient;

    //we delete the file, so a new one is always generated
    //but only if it's not the same (md5)
    if (!process.env.NODE_ENV || process.env.NODE_ENV.toLowerCase() !== 'production') {
      await this.__createBrowserClient(options);

      if (utils.fileExists(clientFilePath)) {
        var oldMd5 = md5(fs.readFileSync(clientFilePath, 'utf8'));
        var newMd5 = md5(this.__cachedBrowserClient);

        if (oldMd5 !== newMd5) {
          try {
            fs.unlinkSync(clientFilePath);
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (utils.fileExists(clientFilePath)) {
      if (!options.contentsOnly) return clientFilePath;
      this.__cachedBrowserClient = fs.readFileSync(clientFilePath, 'utf8').toString();
      return this.__cachedBrowserClient;
    }

    if (!this.__cachedBrowserClient) await this.__createBrowserClient(options);
    if (!dirPath) {
      return this.__cachedBrowserClient;
    }
    fs.ensureDirSync(clientDirPath);
    fs.writeFileSync(clientFilePath, this.__cachedBrowserClient, 'utf8');
    if (!options.contentsOnly) {
      return clientFilePath;
    }
    return this.__cachedBrowserClient;
  },
};
