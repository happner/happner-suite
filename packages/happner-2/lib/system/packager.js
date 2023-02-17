// BUG: more than one meshnode in same process and packager does not apply
// post-start changes to script package into all mesh nodes.

// A preliminary work toward asset packaging (minify, gzip, etag, etc.)
// The ideal would be a per component widget assembly line.
// Allows for serving individual scripts development.
// This one packages only the core /client/api script from ./api.js and it's dependancies
// Make it not do all this on every startup.

module.exports = Packager;

const commons = require('happn-commons'),
  fs = commons.fs,
  utils = commons.utils,
  zlib = require('zlib'),
  md5 = require('md5'),
  { minify } = require('terser'),
  normalize = require('path').normalize,
  dirname = require('path').dirname,
  sep = require('path').sep,
  Happn = require('happn-3'),
  homedir = require('homedir'),
  version = require('../../package.json').version,
  cachedDirname = homedir() + sep + '.happner',
  cachedFilename = cachedDirname + sep + 'api-client-' + version + '.min.js.gz',
  util = require('util'),
  semver = require('happner-semver');

function Packager(mesh) {
  this.mesh = mesh;
  this.log = mesh.log.createLogger('Packager');
  mesh.tools.packages = this.packages = {};
  this.merged = {}; // final product, merges scripts
}

Packager.prototype.ensureCacheDirectory = function () {
  fs.ensureDirSync(cachedDirname);
};

Packager.prototype.loadCachedScript = function () {
  try {
    fs.lstatSync(cachedFilename);
  } catch (e) {
    return false;
  }

  this.merged = {
    gzip: true,
  };

  try {
    this.merged.data = fs.readFileSync(cachedFilename);
  } catch (e) {
    return false;
  }

  this.merged.md5 = md5(this.merged.data);

  var _this = this;
  Object.defineProperty(this.packages, 'api', {
    get: function () {
      return _this.merged;
    },
    enumerable: true,
    configurable: true,
  });

  return true;
};

Packager.prototype.saveCachedScript = function (merged) {
  fs.writeFileSync(cachedFilename, merged.data);
};

Packager.prototype.readFile = async function (file) {
  return await util.promisify(fs.readFile)(typeof file.then === 'function' ? await file : file);
};

Packager.prototype.resolveScript = async function (script) {
  if (utils.isPromise(script.file)) {
    script.file = await script.file;
  }
  return script;
};

Packager.prototype.initializeScripts = function (callback) {
  const happnerClientPath = dirname(require.resolve('happner-client'));
  let error;
  if (process.env.NODE_ENV === 'production') {
    this.ensureCacheDirectory();
    if (this.loadCachedScript()) {
      return callback(null, true);
    }
  }
  Happn.packager
    .browserClient()
    .then(
      (result) => {
        this.scripts = [
          {
            min: false,
            file: normalize(this.mesh._mesh.happn.server.services.session.script),
          },
          { min: false, file: result },
          {
            min: false,
            file: normalize([__dirname, 'shared', 'logger.js'].join(sep)),
          },
          {
            min: false,
            file: normalize([__dirname, 'shared', 'promisify.js'].join(sep)),
          },
          {
            min: false,
            file: normalize([__dirname, 'shared', 'mesh-error.js'].join(sep)),
          },
          {
            min: false,
            file: normalize([__dirname, 'shared', 'messenger.js'].join(sep)),
          },
          {
            min: false,
            file: normalize([__dirname, 'shared', 'internals.js'].join(sep)),
          },
          {
            min: false,
            file: normalize([__dirname, 'shared', 'mesh-client.js'].join(sep)),
          },
          { min: false, file: require.resolve('happner-semver') },
          {
            min: false,
            file: [happnerClientPath, 'lib', 'builders', 'request-builder.js'].join(sep),
          },
          {
            min: false,
            file: [happnerClientPath, 'lib', 'providers', 'connection-provider.js'].join(sep),
          },
          {
            min: false,
            file: [happnerClientPath, 'lib', 'providers', 'implementors-provider.js'].join(sep),
          },
          {
            min: false,
            file: [happnerClientPath, 'lib', 'providers', 'operations-provider.js'].join(sep),
          },
          {
            min: false,
            file: [happnerClientPath, 'lib', 'happner-client.js'].join(sep),
          },
        ];

        //backwards compatible with older versions of happner-client
        let happnerClientVersion = require(happnerClientPath + sep + 'package.json').version;
        if (semver.coercedSatisfies(happnerClientVersion, '>=11.3.0')) {
          this.scripts.push({
            min: false,
            file: [happnerClientPath, 'lib', 'providers', 'light-implementors-provider.js'].join(
              sep
            ),
          });
          this.scripts.push({
            min: false,
            file: [happnerClientPath, 'lib', 'light-client.js'].join(sep),
          });
        } else {
          this.log.warn(
            `light client functionality not available with installed client version ${happnerClientVersion}, must be >= 11.3.0`
          );
        }
      },
      (e) => {
        error = e;
      }
    )
    .finally(() => {
      callback(error);
    });
};

Packager.prototype.initialize = function (callback) {
  this.log.$$TRACE('Building /api/client package');
  this.initializeScripts((e, cached) => {
    if (e) return callback(e);
    if (cached) return callback();
    const lstatPromise = util.promisify(fs.lstat);
    return (
      Promise.all(
        this.scripts.map((script) => {
          return new Promise((resolve) => {
            // handle each script object

            if (process.env.NODE_ENV === 'production' && !script.min) {
              return this.resolveScript(script).then((resolvedScript) => {
                var gotMinFile = resolvedScript.file.replace(/\.js$/, '.min.js');
                // Production
                lstatPromise(gotMinFile)
                  .then(() => {
                    resolvedScript.file = gotMinFile;
                    resolvedScript.min = true;
                    resolve(resolvedScript);
                  })
                  .catch(() => {
                    resolvedScript.min = false;
                    resolve(resolvedScript);
                  });
              });
            }
            // Not production
            return resolve(script);
          });
        })
      )

        // Read the files
        .then((scripts) => {
          return Promise.all(
            scripts.map((script) => {
              this.log.$$TRACE('reading script %s', script.file);
              return this.readFile(script.file);
            })
          );
        })

        // Load the buffer data onto the scripts array
        .then((buffers) => {
          buffers.forEach((buf, i) => {
            this.scripts[i].buf = buf;
          });
        })

        // Minify if production or script.min is true
        .then(() => {
          return Promise.all(
            this.scripts.map((script) => {
              if (process.env.NODE_ENV === 'production' && !script.min) {
                this.log.$$TRACE('minify script %s', script.file);
                return minify(script.buf.toString());
              }
              return { code: script.buf.toString() };
            })
          );
        })

        // Set minified code
        .then((minified) => {
          this.scripts.forEach((script, scriptIndex) => {
            script.code = minified[scriptIndex].code;
          });
        })

        // Assemble the package.
        .then(() => {
          return this.assemble();
        })

        .then(function () {
          callback(null);
        })

        .catch(callback)
    );
  });
};

Packager.prototype.stop = function () {
  // future use
};

Packager.prototype.assemble = function () {
  var _this = this;
  var gzip = util.promisify(zlib.gzip);

  return new Promise(function (resolve) {
    _this.merged.script = '';

    _this.scripts.forEach(function (script) {
      _this.merged.script += script.code.toString() + '\n';
    });

    _this.merged.md5 = md5(_this.merged.script);

    _this.log.$$TRACE('gzip package');

    gzip(_this.merged.script)
      .then(function (zipped) {
        _this.merged.data = zipped;
        _this.merged.gzip = true;
        resolve();
      })

      .then(function () {
        if (process.env.NODE_ENV === 'production') {
          _this.saveCachedScript(_this.merged);
        }
      })

      .catch(function () {
        _this.merged.data = _this.merged.script;
        _this.merged.gzip = false;
        resolve();
      });
  }).then(function () {
    return new Promise(function (resolve) {
      Object.defineProperty(_this.packages, 'api', {
        get: function () {
          return _this.merged;
        },
        enumerable: true,
        configurable: true,
      });
      _this.log.$$TRACE('done');
      resolve();
    });
  });
};
