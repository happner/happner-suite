const db = require('happn-nedb'),
  commons = require('happn-commons'),
  fs = commons.fs,
  utils = commons.utils;

module.exports = class NedbProvider extends commons.BaseDataProvider {
  constructor(settings, logger) {
    if (settings.dbfile) settings.filename = settings.dbfile; //backward compatable
    if (settings.filename) {
      settings.autoload = true; //we definately autoloading
    }
    if (settings.timestampData == null) settings.timestampData = true;
    super(settings, logger);
    this.initialize = utils.maybePromisify(this.initialize);
    this.stop = utils.maybePromisify(this.stop);
    this.upsert = utils.maybePromisify(this.upsert);
    this.increment = utils.maybePromisify(this.increment);
    this.find = utils.maybePromisify(this.find);
    this.findOne = utils.maybePromisify(this.findOne);
    this.remove = utils.maybePromisify(this.remove);
    this.count = utils.maybePromisify(this.count);
    this.db = null;
  }
  static create(settings) {
    return new NedbProvider(settings);
  }
  initialize(callback) {
    this.db = new db(this.settings);

    if (this.settings.compactInterval)
      return this.startCompacting(this.settings.compactInterval, callback);
    else callback();
  }

  __ensureFileSync(callback) {
    return (...args) => {
      if (!this.settings.filename || !this.settings.fsync) {
        callback(...args);
        return;
      }

      fs.open(this.settings.filename, 'r+', (err, fd) => {
        if (err) {
          callback(new Error(`failed syncing to storage device: ${err.message}`));
          return;
        }

        fs.fsync(fd, (err) => {
          if (err) {
            callback(new Error(`failed syncing to storage device: ${err.message}`));
            return;
          }

          callback(...args);
        });
      });
    };
  }

  /** @this NedbProvider */
  increment(path, counterName, increment, callback) {
    if (typeof increment === 'function') {
      callback = increment;
      increment = 1;
    }
    const incrementField = `data.${counterName}.value`;
    this.db.update(
      {
        path,
      },
      {
        $inc: {
          [incrementField]: increment,
        },
      },
      { upsert: true },
      this.__ensureFileSync((e) => {
        if (e) return callback(e);
        this.findOne(
          { path },
          {
            fields: { [incrementField]: 1 },
          },
          function (e, found) {
            if (e) {
              return callback(
                new Error('increment happened but fetching new value failed: ' + e.toString())
              );
            }
            callback(null, found.data[counterName].value);
          }
        );
      })
    );
  }

  upsert(path, document, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (options == null) {
      options = {};
    }
    const setParameters = utils.clone({
      $set: {
        data: document.data,
        _id: path,
        path: path,
        modifiedBy: options.modifiedBy, //stripped out if undefined by _utils.clone
      },
    });

    options.upsert = true;

    this.db.update(
      {
        _id: path,
      },
      setParameters,
      options,
      //err, response, created, upserted, meta
      this.__ensureFileSync((err, _result, document) => {
        if (err) {
          //data with circular references can cause callstack exceeded errors
          if (err.toString() === 'RangeError: Maximum call stack size exceeded')
            return callback(
              new Error('callstack exceeded: possible circular data in happn set method')
            );
          return callback(err);
        }

        let data = document || setParameters.$set;
        let meta = this.getMeta(data, '_id');

        if (setParameters.$set.modifiedBy != null) {
          meta.modifiedBy = setParameters.$set.modifiedBy;
        }

        callback(null, this.transform(data, meta));
      })
    );
  }

  remove(path, callback) {
    return this.db.remove(
      this.getPathCriteria(path, '_id'),
      {
        multi: true,
      },
      function (e, removed) {
        if (e) return callback(e);

        callback(null, {
          data: {
            removed: removed,
          },
          _meta: {
            timestamp: Date.now(),
            path: path,
          },
        });
      }
    );
  }

  parseSortOptions(sortOptions) {
    return Object.keys(sortOptions).reduce((parsedOptions, key) => {
      if (key === 'path') {
        parsedOptions['_id'] = sortOptions[key];
      } else {
        parsedOptions[key] = sortOptions[key];
      }
      return parsedOptions;
    }, {});
  }

  find(path, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = {};
    }
    if (parameters == null) {
      parameters = {};
    }
    let pathCriteria = this.getPathCriteria(path, '_id');
    if (parameters.criteria) {
      pathCriteria = this.addCriteria(pathCriteria, parameters.criteria);
    }
    const sortOptions = parameters.options ? parameters.options.sort : { _id: 1 };
    const searchOptions = {};
    if (parameters.options) {
      if (parameters.options.fields) searchOptions.fields = parameters.options.fields;
      if (parameters.options.limit) searchOptions.limit = parameters.options.limit;
      if (parameters.options.skip) searchOptions.skip = parameters.options.skip;
    }

    let cursor = this.db.find(pathCriteria, searchOptions.fields);

    if (sortOptions) cursor = cursor.sort(this.parseSortOptions(sortOptions));
    if (searchOptions.skip) cursor = cursor.skip(searchOptions.skip);
    if (searchOptions.limit) cursor = cursor.limit(searchOptions.limit);

    cursor.exec(function (e, items) {
      if (e) return callback(e);
      callback(null, items);
    });
  }

  count(path, parameters, callback) {
    var pathCriteria = this.getPathCriteria(path, '_id');

    if (parameters.criteria) pathCriteria = this.addCriteria(pathCriteria, parameters.criteria);

    var searchOptions = {};

    if (parameters.options) {
      if (parameters.options.fields) searchOptions.fields = parameters.options.fields;
      if (parameters.options.limit) searchOptions.limit = parameters.options.limit;
      if (parameters.options.skip) searchOptions.skip = parameters.options.skip;
    }

    var cursor = this.db.count(pathCriteria, searchOptions.fields);

    if (searchOptions.skip) cursor = cursor.skip(searchOptions.skip);
    if (searchOptions.limit) cursor = cursor.limit(searchOptions.limit);

    cursor.exec(function (e, items) {
      if (e) return callback(e);

      callback(null, {
        data: {
          value: items,
        },
      });
    });
  }

  findOne(criteria, fields, callback) {
    return this.db.findOne(criteria, fields, callback);
  }

  startCompacting(interval, callback, compactionHandler) {
    try {
      if (typeof interval === 'function') {
        compactionHandler = callback;
        callback = interval;
        interval = 60 * 1000 * 5; //5 minutes
      }

      interval = parseInt(interval.toString());

      if (interval < 5000) throw new Error('interval must be at least 5000 milliseconds');

      if (this.db.inMemoryOnly) return callback();

      this.__attachCompactionHandler(compactionHandler);
      this.db.persistence.setAutocompactionInterval(interval);

      this.__busyCompacting = true;

      callback();
    } catch (e) {
      callback(e);
    }
  }

  transform(document) {
    const transformed = super.transform(document);
    transformed._meta.path = document._id;
    return transformed;
  }

  stopCompacting(callback) {
    this.db.persistence.stopAutocompaction();
    this.__busyCompacting = false;
    callback();
  }

  compact(callback) {
    if (this.db.inMemoryOnly) return callback();
    this.__attachCompactionHandler(callback, true);
    this.db.persistence.compactDatafile();
  }

  stop(callback) {
    if (this.__busyCompacting) return this.stopCompacting(callback);
    callback();
  }

  __attachCompactionHandler(handler, once) {
    var _this = this;

    var handlerFunc = function (data) {
      _this.emit('compaction-successful', data); //emit as provider
      if (typeof this.handler === 'function') this.handler(data); //do locally bound handler
    }.bind({
      handler: handler,
    });

    if (once) return _this.db.once('compaction.done', handlerFunc);

    _this.db.on('compaction.done', handlerFunc);
  }
};
