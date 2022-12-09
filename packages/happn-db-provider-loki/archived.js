const db = require('lokijs'),
  commons = require('happn-commons'),
  util = commons.utils;

module.exports = class LokiArchiveDataProvider extends commons.BaseDataProvider {
  constructor(settings, logger, archiveId) {
    super(settings, logger);

    this.archiveId = archiveId;

    this.initialize = util.maybePromisify(this.initialize);
    this.stop = util.maybePromisify(this.stop);
  }

  initialize(data, callback) {
    let error = null;
    try {
      this.db = new db();
      this.db.loadJSON(JSON.parse(data).snapshot, { retainDirtyFlags: false });
      this.collection = this.db.collections.find((collection) => collection.name === 'happn');
    } catch (e) {
      error = e;
    } finally {
      callback(error);
    }
  }

  stop(callback) {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }

    delete this.db;
    callback();
  }
};
