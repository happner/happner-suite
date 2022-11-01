/* eslint-disable no-console */
let commons = require('happn-commons');
let async = commons.async;
let utils = commons.utils;

module.exports = class MongoProvider extends commons.BaseDataProvider {
  constructor(settings, logger) {
    let ConfigManager = require('./lib/config');
    let configManager = new ConfigManager();
    super(configManager.parse(settings), logger);
    //feeds back to provider interface, so a not implemented exception can be raised
    //if someone tries to aggregate with an old provider
    this.featureset = {
      aggregate: true,
      count: true,
      collation: true,
      projection: true,
    };
    this.batchData = {};
    this.initialize = utils.maybePromisify(this.initialize);
    this.stop = utils.maybePromisify(this.stop);
    this.upsert = utils.maybePromisify(this.upsert);
    this.increment = utils.maybePromisify(this.increment);
    this.insert = utils.maybePromisify(this.insert);
    this.find = utils.maybePromisify(this.find);
    this.findOne = utils.maybePromisify(this.findOne);
    this.remove = utils.maybePromisify(this.remove);
    this.count = utils.maybePromisify(this.count);
  }

  initialize(callback) {
    require('./lib/datastore').create(this.settings, (err, store) => {
      if (err) return callback(err);
      this.db = store;
      this.__createIndexes(this.settings, callback);
    });
  }

  __createIndexes(config, callback) {
    let doCallback = function (e) {
      if (e) return callback(new Error('failed to create indexes: ' + e.toString(), e));
      callback();
    };

    try {
      if (config.index === false) {
        console.warn(
          'no path index configured for datastore with collection: ' +
            config.collection +
            ' this could result in duplicates and bad performance, please make sure all data items have a unique "path" property'
        );
        return doCallback();
      }

      if (config.index == null) {
        config.index = {
          happn_path_index: {
            fields: {
              path: 1,
            },
            options: {
              unique: true,
              w: 1,
            },
          },
        };
      }

      this.find('/_SYSTEM/INDEXES/*', {}, (e, indexes) => {
        if (e) return doCallback(e);

        //indexes are configurable, but we always use a default unique one on path, unless explicitly specified
        async.eachSeries(
          Object.keys(config.index),
          (indexKey, indexCB) => {
            let found = false;
            indexes.every(function (indexConfig) {
              if (indexConfig.path === '/_SYSTEM/INDEXES/' + indexKey) found = true;
              return !found;
            });
            if (found) return indexCB();
            let indexConfig = config.index[indexKey];

            this.db.data.createIndex(indexConfig.fields, indexConfig.options, (e, result) => {
              if (e) return indexCB(e);
              this.upsert(
                '/_SYSTEM/INDEXES/' + indexKey,
                {
                  data: indexConfig,
                  creation_result: result,
                },
                indexCB
              );
            });
          },
          doCallback
        );
      });
    } catch (e) {
      doCallback(e);
    }
  }

  findOne(criteria, fields, callback) {
    return this.db.findOne(criteria, fields, callback);
  }

  count(path, parameters, callback) {
    let findParameters = Object.assign({}, parameters);
    findParameters.count = true;
    return this.find(path, findParameters, callback);
  }

  find(path, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = {};
    }
    let searchOptions = {};
    if (!parameters) parameters = {};
    if (!parameters.options) parameters.options = {};
    let pathCriteria = this.getPathCriteria(path);

    if (parameters.criteria) {
      pathCriteria = this.addCriteria(pathCriteria, parameters.criteria);
    }
    if (parameters.options.collation) {
      searchOptions.collation = parameters.options.collation;
    }

    if (parameters.options.aggregate) {
      this.db.aggregate(
        pathCriteria,
        parameters.options.aggregate,
        searchOptions,
        function (e, result) {
          if (e) return callback(e);
          callback(null, {
            data: {
              value: result,
            },
          });
        }
      );
      return;
    }

    if (parameters.options.limit) searchOptions.limit = parameters.options.limit;
    if (parameters.options.skip) searchOptions.skip = parameters.options.skip;
    if (parameters.options.maxTimeMS) searchOptions.maxTimeMS = parameters.options.maxTimeMS;

    if (parameters.count || parameters.options.count) {
      this.db.count(pathCriteria, searchOptions, function (e, count) {
        if (e) return callback(e);
        callback(null, {
          data: {
            value: count,
          },
        });
      });
      return;
    }

    if (parameters.options.fields) searchOptions.projection = parameters.options.fields;
    if (parameters.options.projection) searchOptions.projection = parameters.options.projection;

    let sortOptions = parameters.options ? parameters.options.sort : null;

    this.db.find(pathCriteria, searchOptions, sortOptions, function (e, items) {
      if (e) return callback(e);
      callback(null, items);
    });
  }

  update(criteria, data, options, callback) {
    return this.db.update(criteria, data, options, callback);
  }

  increment(path, counterName, increment, callback) {
    return this.db.increment(path, counterName, increment, callback);
  }

  upsert(path, setData, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (options == null) {
      options = {};
    }
    let modifiedOn = Date.now();

    let setParameters = {
      $set: {
        data: setData.data,
        path: path,
        modified: modifiedOn,
      },
      $setOnInsert: {
        created: modifiedOn,
      },
    };

    if (options.modifiedBy) setParameters.$set.modifiedBy = options.modifiedBy;
    if (!options) options = {};

    options.upsert = true;

    if (options.upsertType === commons.constants.UPSERT_TYPE.INSERT) {
      setParameters.$set.created = modifiedOn;

      return this.db.insert(setParameters.$set, options, (err, response) => {
        if (err) return callback(err);
        callback(null, { result: response, document: setParameters.$set });
      });
    }

    if (options.upsertType === commons.constants.UPSERT_TYPE.UPDATE) {
      return this.db.update(
        {
          path: path,
        },
        setParameters,
        options,
        (err, result) => {
          if (err) return callback(err);
          callback(null, result, this.__getMeta(result));
        }
      );
    }

    this.db.findAndModify(
      {
        path: path,
      },
      setParameters,
      (err, result) => {
        if (err) {
          if (err.message.indexOf('duplicate key') > -1) {
            //1 retry - as mongo doesn't seem to understand how upsert:true on a unique index should work...
            return this.db.findAndModify(
              {
                path: path,
              },
              setParameters,
              (err, result) => {
                if (err) return callback(err);
                callback(null, this.transform(result));
              }
            );
          }
          return callback(err);
        }
        callback(null, this.transform(result));
      }
    );
  }

  remove(path, callback) {
    return this.db.remove(this.getPathCriteria(path), function (e, removed) {
      if (e) return callback(e);
      callback(null, {
        data: {
          removed: removed.deletedCount,
        },
        _meta: {
          timestamp: Date.now(),
          path: path,
        },
      });
    });
  }

  batchInsert(data, options, callback) {
    options.batchTimeout = options.batchTimeout || 500;
    //keyed by our batch sizes
    if (!this.batchData[options.batchSize]) {
      this.batchData[options.batchSize] = new BatchDataItem(options, this.db);
    }
    this.batchData[options.batchSize].insert(data, callback);
  }

  insert(data, options, callback) {
    if (options.batchSize > 0) return this.batchInsert(data, options, callback);
    this.db.insert(data, options, callback);
  }

  stop(callback) {
    this.db.disconnect(callback);
  }
};

function BatchDataItem(options, db) {
  this.options = options;
  this.queued = [];
  this.callbacks = [];
  this.db = db;
}

BatchDataItem.prototype.empty = function () {
  clearTimeout(this.timeout);

  let opIndex = 0;
  let _this = this;
  let emptyQueued = [];
  let callbackQueued = [];

  //copy our insertion data to local scope

  emptyQueued.push.apply(emptyQueued, this.queued);
  callbackQueued.push.apply(callbackQueued, this.callbacks);

  //reset our queues
  this.queued = [];
  this.callbacks = [];

  //insert everything in the queue then loop through the results
  _this.db.insert(
    emptyQueued,
    this.options,
    function (e, response) {
      // do callbacks for all inserted items
      callbackQueued.forEach(function (cb) {
        if (e) return cb.call(cb, e);
        cb.call(cb, null, {
          ops: [response.ops[opIndex]],
        });
        opIndex++;
      });
    }.bind(this)
  );
};

BatchDataItem.prototype.insert = function (data, callback) {
  this.queued.push(data);

  this.callbacks.push(callback);

  //epty the queue when we have reached our batch size
  if (this.queued.length >= this.options.batchSize) return this.empty();

  //as soon as something lands up in the queue we start up a timer to ensure it is emptied even when there is a drop in activity
  if (this.queued.length === 1) this.initialize(); //we start the timer now
};

BatchDataItem.prototype.initialize = function () {
  //empty our batch based on the timeout
  this.timeout = setTimeout(this.empty.bind(this), this.options.batchTimeout);
};
