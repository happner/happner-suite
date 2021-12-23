const readline = require('readline');
const commons = require('happn-commons');
const BaseTestHelper = require('happn-commons-test');
class TestHelper extends BaseTestHelper {
  constructor() {
    super();
    this.__testFiles = [];
    this.package = require('../../../package.json');
    this.npm = require('npm-programmatic');
    this.utils = commons.utils;
    this.server = require('./server-helper').create();
    this.security = require('./security-helper').create();
    this.async = commons.async;
    this.findRecordInDataFileCallback = this.nodeUtils.callbackify(this.findRecordInDataFile);
    this.happn = require('../../../lib/index');
    this.request = require('request');
    //backward compatability
    this.shortid = this.newid;
  }

  static create() {
    return new TestHelper();
  }

  static describe(options, handler) {
    return BaseTestHelper.extend(TestHelper).describe(options, handler);
  }

  newTestFile(options) {
    if (!options) options = {};
    if (!options.dir) options.dir = 'test' + this.path.sep + 'tmp';
    if (!options.ext) options.ext = 'txt';
    if (!options.name) options.name = this.newid();
    const fileName = this.ensureTmpPath(options.name + '.' + options.ext);
    this.fs.writeFileSync(fileName, '');
    this.__testFiles.push(fileName);
    return fileName;
  }

  async cleanup(sessions = [], instances = []) {
    this.deleteFiles();
    for (let session of sessions) {
      await this.destroySession(session);
    }
    for (let instance of instances) {
      await this.destroyInstance(instance);
    }
  }
  deleteFiles() {
    var errors = 0;
    var deleted = 0;
    var lastError;
    this.__testFiles.forEach(filename => {
      try {
        this.fs.unlinkSync(filename);
        deleted++;
      } catch (e) {
        lastError = e;
        errors++;
      }
    });
    return { deleted, errors, lastError };
  }
  //eslint-disable-next-line
doRequest (path, token) {
    return new Promise((resolve, reject) => {
      let options = {
        url: 'http://127.0.0.1:55000' + path
      };
      options.headers = {
        Cookie: ['happn_token=' + token]
      };
      this.request(options, function(error, response) {
        if (error) return reject(error);
        resolve(response);
      });
    });
  }

  async lineCount(filePath) {
    if (!this.fs.existsSync(filePath)) {
      return 0;
    }
    const reader = readline.createInterface({
      input: this.fs.createReadStream(filePath),
      crlfDelay: Infinity
    });
    let lineIndex = 0;
    // eslint-disable-next-line no-unused-vars
    for await (const _line of reader) {
      lineIndex++;
    }
    return lineIndex;
  }

  ensureTmpPath(suffix) {
    const tmpPath = this.path.resolve(__dirname, '../tmp');
    this.fs.ensureDirSync(tmpPath);
    if (!suffix) return tmpPath;
    return `${tmpPath}${this.path.sep}${suffix}`;
  }

  findRecordInDataFile(path, filepath) {
    return new Promise((resolve, reject) => {
      let found = false;
      let stream;
      try {
        const byline = require('byline');
        stream = byline(this.fs.createReadStream(filepath, { encoding: 'utf8' }));
      } catch (e) {
        reject(e);
        return;
      }
      stream.on('data', function(line) {
        if (found) return;

        var record = JSON.parse(line);

        if (
          record.operation != null &&
          ['UPSERT', 'INSERT'].includes(record.operation.operationType) &&
          record.operation.arguments[0] === path
        ) {
          found = true;
          stream.end();
          return resolve(record);
        }
      });

      stream.on('error', function(e) {
        if (!found) reject(e);
      });

      stream.on('end', function() {
        if (!found) resolve(null);
      });
    });
  }
  createInstance(config = {}) {
    return new Promise((resolve, reject) => {
      this.happn.service.create(config, function(e, happnInst) {
        if (e) return reject(e);
        resolve(happnInst);
      });
    });
  }

  destroyInstance(instance) {
    return new Promise((resolve, reject) => {
      if (!instance) return resolve();
      instance.stop(function(e) {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  createAdminWSSession() {
    return new Promise((resolve, reject) => {
      this.happn.client.create({ username: '_ADMIN', password: 'happn' }, function(e, session) {
        if (e) return reject(e);
        resolve(session);
      });
    });
  }

  async destroySessions(sessions) {
    for (let session of sessions) {
      await this.destroySession(session);
    }
  }

  destroySession(session) {
    return new Promise((resolve, reject) => {
      if (!session) return resolve();
      session.disconnect(function(e) {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  createAdminSession(instance) {
    return new Promise((resolve, reject) => {
      instance.services.session.localAdminClient(function(e, session) {
        if (e) return reject(e);
        resolve(session);
      });
    });
  }
}

module.exports = TestHelper;
