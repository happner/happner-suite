const db = require('lokijs'),
  readline = require('readline'),
  commons = require('happn-commons'),
  constants = commons.constants,
  async = commons.async,
  util = commons.utils,
  fs = commons.fs,
  _ = commons._,
  path = require('path'),
  pathSep = commons.path.sep;

module.exports = class LokiDataProvider extends commons.BaseDataProvider {
  constructor(settings, logger) {
    super(settings, logger);

    this.initialize = util.maybePromisify(this.initialize);
    this.stop = util.maybePromisify(this.stop);
    this.upsert = util.maybePromisify(this.upsert);
    this.increment = util.maybePromisify(this.increment);
    this.merge = util.maybePromisify(this.merge);
    this.insert = util.maybePromisify(this.insert);
    this.find = util.maybePromisify(this.find);
    this.findOne = util.maybePromisify(this.findOne);
    this.remove = util.maybePromisify(this.remove);
    this.count = util.maybePromisify(this.count);
    this.operationCount = 0;
  }

  initialize(callback) {
    this.dirty = true;
    this.db = new db();
    this.collection = this.db.addCollection('happn', {
      indices: ['path', 'created', 'modified'],
      unique: ['path'],
    });

    this.persistenceOn = this.settings.filename != null;
    if (this.persistenceOn) {
      fs.ensureDirSync(commons.path.dirname(this.settings.filename));
      let pathArray = this.settings.filename.split(pathSep);
      pathArray[pathArray.length - 1] = 'temp_' + pathArray[pathArray.length - 1];
      this.settings.tempDataFilename = pathArray.join(pathSep);
    }
    this.operationQueue = async.queue((operation, cb) => {
      this.processOperation(operation, cb);
    }, 1);
    if (!this.persistenceOn) {
      callback();
      return;
    }
    this.settings.snapshotRollOverThreshold = this.settings.snapshotRollOverThreshold || 1e3; // take a snapshot and compact every 1000 records
    this.reconstruct((e) => {
      if (e) {
        this.logger.error('failed reconstructing database', e);
        callback(e);
        return;
      }
      callback();
    });
  }

  reconstruct(callback) {
    if (!fs.existsSync(this.settings.filename)) {
      return this.snapshot(callback);
    }
    this.readDataFile(this.settings.filename, (error1) => {
      if (!error1) return this.snapshot(callback);
      this.logger.warn(
        `Could not resconstruct loki db from ${
          this.settings.filename
        }, attempting to reconstruct from temp file. ${error1.toString()}`
      );
      this.readDataFile(this.settings.tempDataFilename, (error2) => {
        if (!error2) return this.snapshot(callback);
        this.logger.error(
          `Could not rescpnstruct loki db from file or temp file. Error on tempfile: ${error2.toString()}`
        );
        callback(error1); //Rather callback with the error on the main file (?)
      });
    });
  }

  readDataFile(filename, callback) {
    const reader = readline.createInterface({
      input: fs.createReadStream(filename),
      crlfDelay: Infinity,
    });
    let lineIndex = 0;
    let errorHappened = false;

    reader.on('line', (line) => {
      if (lineIndex === 0) {
        try {
          this.db.loadJSON(JSON.parse(line).snapshot, { retainDirtyFlags: false });
        } catch (e) {
          callback(e);
        }
        this.collection = this.db.collections[0];
      } else {
        try {
          this.mutateDatabase(this.parsePersistedOperation(line), true);
        } catch (e) {
          this.logger.error(`failed reconstructing line ${line}`);
          errorHappened = true;
          reader.close();
          callback(e);
        }
      }
      lineIndex++;
    });

    reader.on('close', () => {
      if (!errorHappened) {
        callback(null);
      }
    });

    reader.on('error', (e) => {
      this.logger.error(`reconstruction reader error ${e.message}`);
      if (!errorHappened) {
        callback(e);
      }
      errorHappened = true;
    });
  }

  parsePersistedOperation(line) {
    let operation = JSON.parse(line).operation;
    if (operation.operationType === constants.DATA_OPERATION_TYPES.INSERT) {
      delete operation.arguments[0].$loki;
      delete operation.arguments[0].meta;
    }
    if (operation.operationType === constants.DATA_OPERATION_TYPES.UPSERT) {
      delete operation.arguments[1]._meta.$loki;
      delete operation.arguments[1]._meta.meta;
    }
    return operation;
  }
  stop(callback) {
    if (this.snapshotTimeout) {
      clearTimeout(this.snapshotTimeout);
    }
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
    callback();
  }
  processOperation(operation, callback) {
    if (operation.operationType === constants.DATA_OPERATION_TYPES.SNAPSHOT) {
      this.snapshot(callback);
      return;
    }
    callback = this.storePlayback(operation, callback);
    let result;
    try {
      result = this.mutateDatabase(operation);
    } catch (e) {
      this.logger.error(`failed mutating database: ${operation.arguments[0]}`, e);
      callback(e);
      return;
    }
    callback(null, result);
  }
  mutateDatabase(operation, preserveTimestamps) {
    switch (operation.operationType) {
      case constants.DATA_OPERATION_TYPES.UPSERT:
        return this.upsertInternal(
          operation.arguments[0],
          operation.arguments[1],
          operation.arguments[2],
          preserveTimestamps
        );
      case constants.DATA_OPERATION_TYPES.UPDATE:
        return this.updateInternal(
          operation.arguments[0],
          operation.arguments[1],
          operation.arguments[2],
          preserveTimestamps
        );
      case constants.DATA_OPERATION_TYPES.INCREMENT:
        return this.incrementInternal(
          operation.arguments[0],
          operation.arguments[1],
          operation.arguments[2]
        );
      case constants.DATA_OPERATION_TYPES.INSERT:
        return this.insertInternal(operation.arguments[0], preserveTimestamps);
      case constants.DATA_OPERATION_TYPES.REMOVE:
        return this.removeInternal(operation.arguments[0], operation.arguments[1]);
      default:
        throw new Error(`unknown data operation type: ${operation.operationType}`);
    }
  }
  upsertInternal(path, upsertDocument, options, preserveTimestamps) {
    if (typeof path !== 'string') {
      throw new Error('argument [path] at position 0 is null or not a string');
    }
    options = options || {};

    let document = this.collection.findOne({ path });
    let result,
      created,
      meta = upsertDocument._meta || {};
    meta.path = path;
    if (document == null) {
      document = meta;
      document.data = upsertDocument.data;
      created = document;
      result = this.insertInternal(document, preserveTimestamps);
    } else {
      if (options.merge) {
        document.data = { ...document.data, ...upsertDocument.data };
      } else {
        document.data = upsertDocument.data;
      }
      _.merge(document, meta);
      result = this.updateInternal(document, preserveTimestamps);
    }
    return { result, document, created };
  }
  insertInternal(document, preserveTimestamps) {
    const now = Date.now();
    document.created = preserveTimestamps && document.created ? document.created : now;
    document.modified = preserveTimestamps && document.modified ? document.modified : now;
    return this.collection.insert(document);
  }
  updateInternal(document, preserveTimestamps) {
    const now = Date.now();
    document.modified = preserveTimestamps && document.modified ? document.modified : now;
    return this.collection.update(document);
  }
  snapshot(callback) {
    this.operationCount = 0;
    this.persistSnapshotData({ snapshot: this.db.serialize() }, (e) => {
      if (e) return callback(e);
      this.copyTempDataToMain(callback);
    });
  }

  copyTempDataToMain(callback) {
    if (fs.existsSync(this.settings.filename)) fs.unlinkSync(this.settings.filename);
    fs.copy(this.settings.tempDataFilename, this.settings.filename, callback);
  }

  storePlayback(operation, callback) {
    return (e, result) => {
      if (e) return callback(e);
      if (!this.persistenceOn) return callback(null, result);

      this.appendOperationData({ operation }, (appendFailure) => {
        if (appendFailure) {
          this.logger.error('failed persisting operation data', appendFailure);
          return callback(appendFailure);
        }
        if (this.operationCount < this.settings.snapshotRollOverThreshold) {
          return callback(null, result);
        }
        this.snapshot((e) => {
          if (e) {
            this.logger.error('snapshot rollover failed', e);
            return callback(e);
          }
          callback(null, result);
        });
      });
    };
  }

  getFileStream(filename) {
    if (this.fileStream == null) {
      let realPath = fs.realpathSync(filename);
      fs.ensureDirSync(path.dirname(realPath));
      this.fileStream = fs.createWriteStream(realPath, { flags: 'a' });
    }
    return this.fileStream;
  }

  appendOperationData(operationData, callback) {
    this.operationCount++;
    const fileStream = this.getFileStream(this.settings.filename);
    fileStream.write(
      `${JSON.stringify(operationData)}\r\n`,
      this.fsync(this.settings.filename, callback)
    );
  }

  persistSnapshotData(snapshotData, callback) {
    fs.writeFile(
      this.settings.tempDataFilename,
      `${JSON.stringify(snapshotData)}\r\n`,
      {
        flag: 'w',
      },
      this.fsync(this.settings.tempDataFilename, callback)
    );
  }

  prepareAdditionalCriteria(additionalCriteria) {
    const transformed = commons._.transform(
      additionalCriteria,
      (result, value, key) => {
        if (key === '$like') {
          result['$regex'] = value.replaceAll('%', '.*');
        } else if (Array.isArray(value)) {
          result[key] = value;
        } else if (typeof value === 'object') {
          result[key] = this.prepareAdditionalCriteria(value);
        } else {
          result[key] = value;
        }
        return result;
      },
      {}
    );
    return transformed;
  }

  fsync(filename, callback) {
    return (e) => {
      if (e) {
        callback(e);
        return;
      }
      if (!this.settings.fsync) {
        callback(null);
        return;
      }
      fs.open(filename, 'r+', (errorOpening, fd) => {
        if (errorOpening) {
          callback(new Error(`failed syncing to storage device: ${errorOpening.message}`));
          return;
        }
        fs.fsync(fd, (errorSyncing) => {
          if (errorSyncing) {
            this.logger.error(`fsync to file ${this.settings.filename} failed`, e);
            callback(errorSyncing);
            return;
          }
          callback(null);
        });
      });
    };
  }
  insert(document, callback) {
    this.operationQueue.push(
      { operationType: constants.DATA_OPERATION_TYPES.INSERT, arguments: [document] },
      callback
    );
  }
  merge(path, document, callback) {
    this.upsert(path, document, { merge: true }, callback);
  }
  upsert(path, document, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (!this.persistenceOn) {
      let responseNoQueue;
      try {
        responseNoQueue = this.upsertInternal(path, document, options);
      } catch (e) {
        return callback(e);
      }
      return callback(null, this.transform(responseNoQueue.result));
    }

    this.operationQueue.push(
      {
        operationType: constants.DATA_OPERATION_TYPES.UPSERT,
        arguments: [path, document, options],
      },
      (e, response) => {
        if (e) {
          callback(e);
          return;
        }
        callback(null, this.transform(response.result));
      }
    );
  }
  remove(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    this.operationQueue.push(
      { operationType: constants.DATA_OPERATION_TYPES.REMOVE, arguments: [path, options.criteria] },
      callback
    );
  }
  removeInternal(path, criteria) {
    const toRemove = this.collection.chain().find(this.getPathCriteria(path, undefined, criteria));
    const removed = toRemove.count();
    if (removed > 0) {
      toRemove.remove();
    }
    return {
      data: {
        removed,
      },
      _meta: {
        timestamp: Date.now(),
        path: path,
      },
    };
  }
  transformSortOptions(mongoSortOptions) {
    return Object.keys(mongoSortOptions).reduce((lokiSortOptions, fieldName) => {
      lokiSortOptions.push([fieldName, mongoSortOptions[fieldName] === -1]);
      return lokiSortOptions;
    }, []);
  }
  findInternal(path, parameters) {
    let finalResult = [];
    let pathCriteria = this.getPathCriteria(path);

    if (!parameters) parameters = {};
    if (parameters.criteria) {
      let preparedCriteria = this.prepareAdditionalCriteria(parameters.criteria);
      pathCriteria = this.addCriteria(pathCriteria, preparedCriteria);
    }
    let results = this.collection.chain().find(pathCriteria);
    let options = parameters.options || {};
    if (results.count() === 0) {
      return options.count ? { data: { value: 0 } } : finalResult;
    }

    const sortOptions = options.sort
      ? this.transformSortOptions(options.sort)
      : [
          ['path', false],
          ['modified', false], //sort by [modified, path] ascending
        ];

    finalResult = results.compoundsort(sortOptions).data({ forceClones: true, removeMeta: true });
    if (options.skip) {
      finalResult = finalResult.slice(options.skip);
    }

    if (options.limit) {
      finalResult = finalResult.slice(0, options.limit);
    }

    if (options.count) {
      return { data: { value: finalResult.length } };
    }

    if (options.fields) {
      finalResult = finalResult.map((item) => {
        return _.pick(item, Object.keys(options.fields));
      });
    }
    return finalResult;
  }
  find(path, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = {};
    }
    if (parameters == null) {
      parameters = {};
    }
    let result = [];
    try {
      result = this.findInternal(path, parameters);
    } catch (e) {
      callback(e);
      return;
    }
    callback(null, result);
  }
  count(path, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = {};
    }
    parameters.options = parameters.options || {};
    parameters.options.count = true;
    this.find(path, parameters, callback);
  }
  findOne(criteria, fields, callback) {
    if (typeof fields === 'function') {
      callback = fields;
      fields = null;
    }
    let result = null;
    try {
      result = this.findOneInternal(criteria, fields);
    } catch (e) {
      callback(e);
      return;
    }
    callback(null, result);
  }
  findOneInternal(criteria, fields) {
    let results = this.findInternal('*', { criteria, fields });
    if (results.length > 0) {
      return results[0];
    }
    return null;
  }
  increment(path, counterName, increment, callback) {
    if (typeof increment === 'function') {
      callback = increment;
      increment = 1;
    }

    this.operationQueue.push(
      {
        operationType: constants.DATA_OPERATION_TYPES.INCREMENT,
        arguments: [path, counterName, increment],
      },
      callback
    );
  }
  incrementInternal(path, counterName, increment) {
    let recordToIncrement = this.findOneInternal({ path }) || {
      data: { [counterName]: { value: 0 } },
    };
    if (recordToIncrement.data[counterName] == null) {
      recordToIncrement.data[counterName] = { value: 0 };
    }
    recordToIncrement.data[counterName].value += increment;
    this.upsertInternal(path, recordToIncrement);
    return recordToIncrement.data[counterName].value;
  }
};
