const commons = require('happn-commons');
const BaseTestHelper = require('happn-commons-test');
class TestHelper extends BaseTestHelper {
  #instances = [];
  #sessions = [];
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
    this.homedir = require('homedir');
    this.mockLogger = {
      createLogger: () => {
        return {
          $$TRACE: this.log,
          $$DEBUG: this.log,
          info: this.log,
          debug: this.log,
          warn: this.log,
          error: this.log,
        };
      }
    };
  }

  static create() {
    return new TestHelper();
  }

  /**
   * 
   * @param {*} options 
   * @param {(test: TestHelper)=>void} handler 
   * @returns 
   */
  static describe(options, handler) {
    return BaseTestHelper.extend(TestHelper).describe(options, handler);
  }

  get sessions () {
    return this.#sessions;
  }

  get instances () {
    return this.#instances;
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
      this.happn.service.create(config, (e, happnInst) => {
        if (e) return reject(e);
        this.#instances.push(happnInst);
        resolve(happnInst);
      });
    });
  }

  createInstanceBefore(config = {}) {
    before('it creates an instance', async () => {
      return await this.createInstance(config);
    });
  };

  destroyInstance(instance) {
    return new Promise((resolve, reject) => {
      if (!instance) return resolve();
      this.#instances.splice(this.#instances.indexOf(instance), 1);
      instance.stop(function(e) {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  async destroyAllInstances() {
    await Promise.all(this.#instances.map(instance => {
      return this.destroyInstance(instance);
    }));
  }

  destroyAllInstancesAfter() {
    after('it destroys all test instances', async () => {
      await this.destroyAllInstances();
    });
  }

  createAdminWSSession(options = {}) {
    return new Promise((resolve, reject) => {
      this.happn.client.create(this._.merge({ username: '_ADMIN', password: 'happn' }, options), (e, session) => {
        if (e) return reject(e);
        this.#sessions.push(session);
        resolve(session);
      });
    });
  }

  createAdminWSSessionBefore() {
    before('it creates an admin session', this.createAdminWSSession.bind(this));
  }

  async destroySessions(sessions) {
    sessions = sessions || this.#sessions;
    for (let session of sessions.slice()) {
      await this.destroySession(session);
    }
  }

  destroyAllSessionsAfter() {
    after('it destroys all sessions', async () => {
      await this.destroySessions();
    });
  }

  destroySession(session) {
    return new Promise((resolve, reject) => {
      if (!session) return resolve();
      session.disconnect((e) => {
        if (e) return reject(e);
        this.#sessions.splice(this.#sessions.indexOf(session), 1);
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
