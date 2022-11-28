const commons = require('happn-commons'),
  LRUCache = require('lru-cache'),
  util = commons.utils,
  fs = commons.fs,
  // eslint-disable-next-line no-unused-vars
  { Sequelize, Model, DataTypes, ModelStatic, Op } = require('sequelize'),
  flatten = require('flat'),
  queryBuilder = require('./lib/sqlize-query-builder');

module.exports = class SQLiteDataProvider extends commons.BaseDataProvider {
  #pathToModelCache;
  #models = {};
  #delimiter;
  #systemColumns = ['created', 'modified', 'deleted', 'path'];
  #hashRingSemaphore;
  constructor(settings = {}, logger) {
    super(settings, logger);

    this.initialize = util.maybePromisify(this.initialize);
    this.stop = util.maybePromisify(this.stop);
    this.upsert = util.maybePromisify(this.upsert);
    this.increment = util.maybePromisify(this.increment);
    this.merge = util.maybePromisify(this.merge);
    this.insert = util.maybePromisify(this.insert);
    this.find = util.maybePromisify(this.find);
    this.remove = util.maybePromisify(this.remove);
    this.count = util.maybePromisify(this.count);
    this.findOne = util.maybePromisify(this.findOne);
    this.#delimiter = settings.delimiter || '___';
    // 100MB soft heap limit
    this.settings.heapLimit = this.settings.heapLimit || 100e6;
    this.#hashRingSemaphore = require('happn-commons').HashRingSemaphore.create({
      slots: settings.mutateSlots || 30, // 30 parallel mutations
    });
  }

  initialize(callback) {
    this.#pathToModelCache = new LRUCache({ max: 1e3 });
    this.persistenceOn = this.settings.filename != null;
    const logging = this.settings.logging || false;
    if (!this.persistenceOn) {
      this.db = new Sequelize('sqlite::memory:', { logging });
    } else {
      fs.ensureDirSync(commons.path.dirname(this.settings.filename));
      this.db = new Sequelize({
        dialect: 'sqlite',
        storage: this.settings.filename,
        logging,
      });
    }
    let modelEnsuredResult;
    let modelEnsuredError;
    this.db
      .authenticate()
      .then(() => {
        return this.db.query(`PRAGMA soft_heap_limit=${this.settings.heapLimit};`);
      })
      .then(() => {
        return this.db.query(`PRAGMA soft_heap_limit=${this.settings.heapLimit};`);
      })
      .then(() => {
        return this.db.query(`PRAGMA optimize;`);
      })
      .then(() => {
        return this.#ensureModel();
      })
      .then(
        (result) => {
          modelEnsuredResult = result;
        },
        (error) => {
          modelEnsuredError = error;
        }
      )
      .finally(() => {
        callback(modelEnsuredError, modelEnsuredResult);
      });
  }

  stop(callback) {
    this.db.close();
    callback();
  }

  async #ensureModel() {
    if (this.settings.schema == null || this.settings.schema.length === 0) {
      throw new Error(
        'schema with model configurations must be defined for Sqlite provider settings'
      );
    }
    for (let indexConfig of this.settings.schema) {
      let modelAndIndexes = this.#createModel(indexConfig.indexes);
      this.#models[indexConfig.name] = this.db.define(indexConfig.name, modelAndIndexes.model, {
        timestamps: true,
        indexes: modelAndIndexes.indexes,
      });
    }
    await this.db.sync();
  }

  #createModel(indexes) {
    const configuredIndexes = [];
    // ensure we store all configured properties under data.
    let dataModel = Object.keys(indexes).reduce((transformed, key) => {
      const dataKey = `data${this.#delimiter}${key.replaceAll('.', this.#delimiter)}`;
      configuredIndexes.push({
        name: `${dataKey}_index`,
        fields: [dataKey],
      });
      transformed[dataKey] = indexes[key];
      return transformed;
    }, {});
    return {
      model: commons._.merge(dataModel, {
        path: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        createdAt: { type: DataTypes.DATE, field: 'created' },
        updatedAt: { type: DataTypes.DATE, field: 'modified' },
        deletedAt: { type: DataTypes.DATE, field: 'deleted' },
        modifiedBy: { type: DataTypes.STRING },
        json: { type: DataTypes.JSON },
      }),
      indexes: configuredIndexes,
      timestamps: true,
    };
  }

  /**
   *
   * @param {*} path
   * @returns { Model }
   */
  #matchPathToModel(path) {
    let found = this.#pathToModelCache.get(path);
    if (!found) {
      for (let modelConfig of this.settings.schema) {
        if (commons.utils.wildcardMatch(modelConfig.pattern, path) === true) {
          const activeModel = this.#models[modelConfig.name];
          this.#pathToModelCache.set(path, activeModel);
          found = activeModel;
          break;
        }
      }
    }
    return found;
  }

  /**
   *
   * @param {*} path
   * @returns { ModelStatic<M> }
   */
  #getModel(path) {
    let matchingModel;
    try {
      matchingModel = this.#matchPathToModel(path);
      if (!matchingModel) {
        throw new Error(`model config with matching pattern to ${path} not found`);
      }
      return matchingModel;
    } catch (e) {
      this.logger.error(e);
    }
    return null;
  }

  #transformDataValues(instance) {
    if (Array.isArray(instance)) {
      return instance.map((item) => this.#transformDataValues(item));
    }
    return {
      path: instance.dataValues.path,
      created: instance.createdAt,
      modified: instance.dataValues.updatedAt,
      deleted: instance.dataValues.deletedAt,
      data: instance.dataValues.json,
    };
  }

  #getRow(document, path) {
    const flattened = flatten(document, { delimiter: this.#delimiter });
    flattened.json = document.data;
    if (path) {
      flattened.path = path;
    }
    return flattened;
  }

  #mutate(path, fn, callback) {
    let mutateResult, mutateError;
    this.#hashRingSemaphore
      .lock(path, fn)
      .then(
        (result) => {
          mutateResult = result;
        },
        (error) => {
          mutateError = error;
        }
      )
      .finally(() => {
        if (mutateError) {
          return callback(mutateError);
        }
        callback(null, mutateResult);
      });
  }

  // when merging, we need to be able to call insert directly without a further lock
  #insert(model, row) {
    return async () => {
      const result = await model.create(row);
      const transformed = this.#transformDataValues(result);
      return transformed;
    };
  }

  insert(document, callback) {
    const model = this.#getModel(document.path);
    if (model == null) {
      return callback(
        new Error(
          `failed inserting, path ${document.path} does not match available model patterns or data in bad format`
        )
      );
    }
    const row = this.#getRow(document);
    this.#mutate(document.path, this.#insert(model, row), callback);
  }

  merge(path, document, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (!options) {
      options = {};
    }
    if (path.includes('*')) {
      return callback(new Error('merge does not support * wildcards in path'));
    }
    this.#mutate(
      path,
      async () => {
        const found = await this.findOne(path);
        if (!found) {
          const model = this.#getModel(path);
          const row = this.#getRow(document, path);
          await this.#insert(model, row)();
          return document;
        }
        let merged = commons._.merge(found, document);
        return await this.#upsert(path, merged, options)();
      },
      callback
    );
  }
  // when merging, we need to be able to call upsert directly without a further lock
  #upsert(path, document, options) {
    return async () => {
      const model = this.#getModel(path);
      const row = this.#getRow(document, path);
      await model.upsert(row, this.#getOptions(path, options));
      return document;
    };
  }
  upsert(path, document, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (!options) {
      options = {};
    }
    if (path.includes('*')) {
      return callback(new Error('upsert does not support * wildcards in path'));
    }
    if (options.merge === true) {
      return this.merge(path, document, callback);
    }
    this.#mutate(path, this.#upsert(path, document, options), callback);
  }

  remove(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    this.#mutate(
      path,
      async () => {
        const model = this.#getModel(path);
        const parsedOptions = this.#getOptions(path, options, false);
        const removed = await model.destroy(parsedOptions);
        return {
          data: {
            removed,
          },
          _meta: {
            timestamp: Date.now(),
            path: path,
          },
        };
      },
      callback
    );
  }

  #getOptions(path, options = {}, isQuery = true) {
    // ugly but that is the external contracts
    const extendedOptions = options.options || {};
    const sqlOptions = {
      where: {
        [Op.and]: [
          {
            path: {
              [Op.like]: path.replaceAll('*', '%'),
            },
          },
        ],
      },
    };

    if (options.criteria) {
      sqlOptions.where[Op.and].push(queryBuilder.build(this.#delimiter, options.criteria));
    }

    if (!isQuery) {
      return sqlOptions;
    }

    sqlOptions.where[Op.and].push({
      deleted: {
        [Op.is]: null,
      },
    });

    // skip before count because we may want to get the count of leftovers after skip
    if (extendedOptions.skip) {
      sqlOptions.offset = extendedOptions.skip;
    }
    if (extendedOptions.count === true) {
      sqlOptions.attributes = [[this.db.fn('COUNT', this.db.col('path')), 'value']];
      // just return it, limiting and sorting don't matter
      return sqlOptions;
    }
    if (extendedOptions.limit) sqlOptions.limit = extendedOptions.limit;
    if (extendedOptions.sort) {
      sqlOptions.order = commons._.transform(
        extendedOptions.sort,
        (result, value, key) => {
          const direction = value === -1 ? 'DESC' : 'ASC';
          if (this.#systemColumns.includes(key)) {
            result.push([key, direction]);
          } else {
            result.push([`${key.replaceAll('.', this.#delimiter)}`, direction]);
          }
          return result;
        },
        []
      );
    }
    return sqlOptions;
  }

  findOne(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (options == null) {
      options = {};
    }
    options.limit = 1;
    this.find(path, options, (e, result) => {
      if (e) return callback(e);
      if (Array.isArray(result)) {
        if (result.length === 0) {
          return callback(null, undefined);
        }
        return callback(null, result[0]);
      }
      return callback(null, result);
    });
  }

  find(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (options == null) {
      options = {};
    }
    const extendedOptions = options.options || {};
    let findError, findResult;
    const model = this.#getModel(path);
    if (model == null) {
      return callback(
        new Error(
          `failed finding, path ${path} does not match available model patterns or data in bad format`
        )
      );
    }
    let findMethod = path.includes('*') ? 'findAll' : 'findOne';
    let sqlOptions = this.#getOptions(path, options);
    model[findMethod](sqlOptions)
      .then(
        (found) => {
          if (!extendedOptions.count) {
            if (found == null) {
              findResult = [];
              return;
            }
            const transformed = this.#transformDataValues(found);
            if (Array.isArray(transformed)) {
              findResult = transformed;
            } else {
              findResult = [transformed];
            }
            return;
          }
          findResult = {
            data: {
              value: (Array.isArray(found) ? found[0] : found).dataValues.value,
            },
          };
        },
        (error) => {
          findError = error;
        }
      )
      .finally(() => {
        callback(findError, findResult);
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

  increment(path, counterName, increment, callback) {
    if (typeof increment === 'function') {
      callback = increment;
      increment = 1;
    }
    this.#mutate(
      path,
      async () => {
        const model = this.#getModel(path);
        const found = await this.findOne(path);
        if (!found) {
          await this.#insert(
            model,
            this.#getRow(
              {
                data: {
                  [counterName]: { value: increment },
                },
              },
              path
            )
          )();
          return increment;
        }
        if (!found.data[counterName]) {
          found.data[counterName] = { value: 0 };
        }
        found.data[counterName].value += increment;
        await this.#upsert(path, found, {
          merge: true,
        })();
        return found.data[counterName].value;
      },
      callback
    );
  }
};
