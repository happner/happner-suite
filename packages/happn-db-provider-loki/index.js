const LokiArchiveDataProvider = require('./archived');

const db = require('lokijs'),
  readline = require('readline'),
  AdmZip = require('adm-zip'),
  commons = require('happn-commons'),
  constants = commons.constants,
  async = commons.async,
  util = commons.utils,
  fs = commons.fs,
  _ = commons._,
  path = require('path'),
  pathSep = commons.path.sep;

module.exports = class LokiDataProvider extends commons.BaseDataProvider {
  #plugin;
  #fileStream;
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
    this.archive = util.maybePromisify(this.archive);
    this.operationCount = 0;
    // attach our plugin
    if (settings?.plugin) {
      this.#plugin = settings.plugin;
      settings.plugin.attach(this);
    }
  }

  initialize(callback) {
    this.dirty = true;
    this.db = new db();
    this.collection = this.db.addCollection('happn', {
      indices: ['path', 'created', 'modified'],
      unique: ['path'],
    });

    this.archiveCollection = this.db.addCollection('archives', {
      indices: ['sequence'],
      unique: ['sequence'],
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

    if (!this.settings.archiveFolder) {
      const lastForwardSlashIdx = this.settings.filename.lastIndexOf('/');
      this.settings.archiveFolder = this.settings.filename.slice(0, lastForwardSlashIdx);
    }

    this.reconstruct((e) => {
      if (e) {
        this.logger.error('failed reconstructing database', e);
        callback(e);
        return;
      }
      callback();
    });
  }

  //#region external mutate interface

  increment(path, counterName, increment, callback) {
    this.#checkIfReadonly();

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

  remove(path, options, callback) {
    this.#checkIfReadonly(options);

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

  insert(document, callback) {
    if (!document.path) {
      return callback(new Error('path not specified for insert'));
    }
    this.#checkIfReadonly();
    this.operationQueue.push(
      { operationType: constants.DATA_OPERATION_TYPES.INSERT, arguments: [document] },
      callback
    );
  }

  archive(callback) {
    this.#checkIfReadonly();
    this.operationQueue.push({ operationType: constants.DATA_OPERATION_TYPES.ARCHIVE }, callback);
  }

  merge(path, document, callback) {
    this.#checkIfReadonly();
    this.upsert(path, document, { merge: true }, callback);
  }

  upsert(path, document, options, callback) {
    this.#checkIfReadonly(options);

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

  //#endregion

  //#region query external interface

  find(path, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = {};
    }

    if (parameters == null) {
      parameters = {};
    }

    this.loadArchiveInternal(parameters, (error) => {
      if (error) {
        return callback(error);
      }

      let result = [];
      try {
        result = this.findInternal(path, parameters);
      } catch (e) {
        callback(e);
        return;
      }
      callback(null, result);
    });
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

  //#endregion

  reconstruct(callback) {
    if (!fs.existsSync(this.settings.filename)) {
      return this.snapshot(callback);
    }
    this.readDataFile(this.settings.filename, (error1, lastLineNumber) => {
      if (!error1) {
        if (this.settings.readOnly) {
          // dont snapshot, just allow reads
          return callback();
        }
        return this.snapshot(callback);
      }
      if (lastLineNumber > 1) {
        // means the file is broken due to an issue other than an incomplete snapshot, throw the error
        return callback(error1);
      }
      // this is because the snapshot was big and may have not been copied completely before the system was powered down
      this.logger.warn(
        `Attempting to reconstruct from temp file: ${this.settings.tempDataFilename}`
      );
      this.readDataFile(this.settings.tempDataFilename, (error2) => {
        if (!error2) return this.snapshot(callback);
        this.logger.error(
          `Could not reconstruct loki db from file or temp file: ${error2.toString()}`
        );
        callback(error1); // rather callback with the error on the main file
      });
    });
  }

  readDataFile(filename, callback) {
    const reader = readline.createInterface({
      input: fs.createReadStream(filename),
      crlfDelay: Infinity,
    });

    let error = null;
    let lineNumber = 0;
    reader.on('line', (line) => {
      try {
        if (++lineNumber === 1) {
          this.logger.info('loading snapshot...');
          this.db.loadJSON(JSON.parse(line).snapshot, { retainDirtyFlags: false });
          this.collection = this.db.collections.find((collection) => collection.name === 'happn');
          this.archiveCollection = this.db.collections.find(
            (collection) => collection.name === 'archives'
          );
          this.archiveCollection ??= this.db.addCollection('archives', {
            indices: ['sequence'],
            unique: ['sequence'],
          });
          this.logger.info('loaded snapshot...');
        } else {
          if (lineNumber % 10 === 0) {
            this.logger.info('parsing line ', lineNumber);
          }
          const parsedOperation = this.parsePersistedOperation(line);
          if (parsedOperation == null) {
            // skip empty or corrupted
            this.logger.warn(`line ${lineNumber} is empty or corrupt, skipping`);
          } else {
            this.mutateDatabase(parsedOperation, true);
          }
        }
      } catch (e) {
        error = e;
        this.logger.error(
          `failed reconstructing line at index ${lineNumber}: ${
            lineNumber > 1 ? line : '[snapshot]'
          }`
        );
        reader.close();
        reader.removeAllListeners();
        return callback(e, lineNumber);
      }
    });

    reader.on('close', () => {
      callback(error ?? null);
    });

    reader.on('error', (e) => {
      if (error) return;
      callback(e);
    });
  }

  parsePersistedOperation(line) {
    try {
      let operation = JSON.parse(line).operation;
      if (operation.operationType === constants.DATA_OPERATION_TYPES.INSERT) {
        delete operation.arguments[0].$loki;
        delete operation.arguments[0].meta;
      }
      if (operation.operationType === constants.DATA_OPERATION_TYPES.UPSERT) {
        if (operation.arguments[1]._meta) {
          delete operation.arguments[1]._meta.$loki;
          delete operation.arguments[1]._meta.meta;
        }
      }
      return operation;
    } catch (e) {
      this.logger.warn(`failed parsing operation: ${e.message}`);
      return null;
    }
  }

  stop(callback) {
    if (this.snapshotTimeout) {
      clearTimeout(this.snapshotTimeout);
    }
    this.#destroyFileStream();
    callback();
  }

  getCollectionBasedOnParameters(parameters) {
    if (parameters?.archiveId) {
      if (!this.loadedArchiveDB) {
        throw new Error('Cannot read from archive: no archive loaded');
      }

      return this.loadedArchiveDB.collection;
    }

    if (parameters?.queryArchiveCollection === true) return this.archiveCollection;
    return this.collection;
  }

  processOperation(operation, callback) {
    switch (operation.operationType) {
      case constants.DATA_OPERATION_TYPES.SNAPSHOT:
        this.snapshot(callback);
        break;

      case constants.DATA_OPERATION_TYPES.ARCHIVE:
        {
          if (!this.persistenceOn) break;
          this.archiveInternal(callback);
        }
        break;

      default:
        {
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
        break;
    }
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
        return this.updateInternal(operation.arguments[0], preserveTimestamps);
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

  archiveInternal(callback) {
    const archiveCount = this.archiveCollection.count();
    const sequence = archiveCount + 1;

    const lastForwardSlashIdx = this.settings.filename.lastIndexOf('/');
    const archivedFileName = this.settings.filename.slice(lastForwardSlashIdx + 1);
    const zipFileName = path.resolve(
      this.settings.archiveFolder,
      `${archivedFileName}.${sequence}.zip`
    );

    const snapshot = this.snapshot.bind(this);

    const copyData = (callback) => {
      this.copyMainDataToArchive(sequence, callback);
    };

    const createZip = (callback) => {
      const zip = new AdmZip();
      zip.addLocalFile(this.settings.filename, undefined, archivedFileName);
      zip.writeZip(zipFileName, (error) => {
        fs.unlinkSync(`${this.settings.filename}.${sequence}`);

        if (error) {
          return callback(error);
        }

        callback();
      });
    };

    const cleanup = (callback) => {
      this.collection.clear();
      this.archiveCollection.insert({
        id: sequence,
        data: {
          sequence: sequence,
          archive: zipFileName,
        },
      });

      callback();
    };

    commons.async.series([snapshot, copyData, createZip, cleanup, snapshot], (error) => {
      if (error) return callback(error);
      callback(null, sequence);
    });
  }

  loadArchiveInternal(parameters, callback) {
    const archiveId = parameters?.archiveId;
    if (!archiveId) return callback();

    if (this.loadedArchiveDB && this.loadedArchiveDB.archiveId !== archiveId) {
      return this.unloadArchiveInternal((error) => {
        if (error) {
          return callback(error);
        }

        this.loadArchiveInternal(parameters, callback);
      });
    }

    const [archiveDetails, ...archives] = this.archiveCollection.find({ id: archiveId });

    if (!archiveDetails) {
      return callback(new Error('Archive ID does not exist'));
    }

    if (archives.length > 0) {
      return callback(new Error('Only one archive can be loaded at any given time'));
    }

    const filePath = this.settings.filename.split(pathSep);
    const archivedFileName = filePath[filePath.length - 1];

    const zip = new AdmZip(archiveDetails.data.archive);
    this.loadedArchiveDB = new LokiArchiveDataProvider(this.settings, this.logger, archiveId);
    this.loadedArchiveDB.initialize(
      zip.getEntry(archivedFileName).getData().toString().trim(),
      (error) => {
        if (error) return callback(error);
        callback();
      }
    );
  }

  unloadArchiveInternal(callback) {
    if (!this.loadedArchiveDB) {
      return callback(new Error('No archive is loaded'));
    }

    let calledBack = false;
    try {
      this.loadedArchiveDB.stop();
      delete this.loadedArchiveDB;

      try {
        callback();
      } finally {
        calledBack = true;
      }
    } catch (e) {
      if (!calledBack) {
        callback(e);
      }
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

  clearInternal() {
    return new Promise((resolve, reject) => {
      this.removeInternal('*'); // clear everything
      this.operationCount = 0;
      return this.persistSnapshotData({ snapshot: this.db.serialize() }, (e) => {
        if (e) return reject(e);
        this.copyTempDataToMain((e) => {
          if (e) return reject(e);
          resolve();
        });
      });
    });
  }

  snapshot(callback) {
    if (typeof this.#plugin?.snapshotBeforeRolloverHandler === 'function') {
      let handlerContinueResult, handlerErrorResult;
      return this.#plugin
        .snapshotBeforeRolloverHandler()
        .then(
          (handlerContinue) => {
            handlerContinueResult = handlerContinue;
          },
          (handlerError) => {
            handlerErrorResult = handlerError;
          }
        )
        .finally(() => {
          if (handlerErrorResult) {
            return callback(handlerErrorResult);
          }
          if (handlerContinueResult) {
            // returned true - continue snapshotting
            return this.#completeSnapshot(callback);
          }
          callback();
        });
    }
    this.#completeSnapshot(callback);
  }

  copyTempDataToMain(callback) {
    if (fs.existsSync(this.settings.filename)) {
      fs.unlinkSync(this.settings.filename);
    }
    fs.copy(this.settings.tempDataFilename, this.settings.filename, callback);
  }

  copyMainDataToArchive(suffix, callback) {
    if (fs.existsSync(`${this.settings.filename}.${suffix}`))
      fs.unlinkSync(`${this.settings.filename}.${suffix}`);
    fs.copy(this.settings.filename, `${this.settings.filename}.${suffix}`, callback);
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
    if (this.#fileStream == null) {
      let realPath = fs.realpathSync(filename);
      fs.ensureDirSync(path.dirname(realPath));
      this.#fileStream = fs.createWriteStream(realPath, { flags: 'a' });
    }
    return this.#fileStream;
  }

  #destroyFileStream() {
    if (this.#fileStream) {
      this.#fileStream.end();
      this.#fileStream = null;
    }
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
    this.#destroyFileStream();
    fs.writeFile(
      this.settings.tempDataFilename,
      `${JSON.stringify(snapshotData)}\r\n`,
      {
        flag: 'w',
      },
      this.fsync(this.settings.tempDataFilename, callback)
    );
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
    const collection = this.getCollectionBasedOnParameters(parameters);

    let finalResult = [];
    let pathCriteria = this.getPathCriteria(path);

    if (!parameters) parameters = {};
    if (parameters.criteria) pathCriteria = this.addCriteria(pathCriteria, parameters.criteria);
    let results = collection.chain().find(pathCriteria);
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

  findOneInternal(criteria, fields) {
    let results = this.findInternal('*', { criteria, fields });
    if (results.length > 0) {
      return results[0];
    }
    return null;
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

  #completeSnapshot(callback) {
    this.operationCount = 0;
    this.persistSnapshotData({ snapshot: this.db.serialize() }, (e) => {
      if (e) return callback(e);
      this.copyTempDataToMain(callback);
    });
  }

  #checkIfReadonly(parameters) {
    if (this.settings.readOnly) {
      throw new Error('Database is read-only!');
    }
    if (parameters?.archiveId) {
      throw new Error('Loaded archives only support read-only operations!');
    }
  }
};
