const commons = require('happn-commons'),
  LRUCache = require('lru-cache'),
  util = commons.utils,
  fs = commons.fs,
  // eslint-disable-next-line no-unused-vars
  { Sequelize, Model, DataTypes, ModelStatic, Op } = require('sequelize'),
  flatten = require('flat');

module.exports = class SQLiteDataProvider extends commons.BaseDataProvider {
  #pathToModelCache;
  #models = {};
  #delimiter;
  #systemColumns = ['created', 'modified', 'deleted', 'path'];
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
    this.#delimiter = settings.delimiter || '_';
  }

  initialize(callback) {
    this.#pathToModelCache = new LRUCache({ max: 1e3 });
    this.persistenceOn = this.settings.filename != null;
    if (!this.persistenceOn) {
      this.db = new Sequelize('sqlite::memory:');
    } else {
      fs.ensureDirSync(commons.path.dirname(this.settings.filename));
      this.db = new Sequelize({
        dialect: 'sqlite',
        storage: this.settings.filename,
      });
    }
    let modelEnsuredResult;
    let modelEnsuredError;
    this.db
      .authenticate()
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
      let model = this.#createModel(indexConfig.indexes);
      this.#models[indexConfig.name] = this.db.define(indexConfig.name, model, {
        timestamps: true,
      });
    }
    await this.db.sync();
  }
  #createModel(indexes) {
    // ensure we store all configured properties under data.
    let dataModel = Object.keys(indexes).reduce((transformed, key) => {
      transformed[`data${this.#delimiter}${key.replace('.', this.#delimiter)}`] = indexes[key];
      return transformed;
    }, {});
    return commons._.merge(dataModel, {
      path: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      createdAt: { type: DataTypes.DATE, field: 'created' },
      updatedAt: { type: DataTypes.DATE, field: 'modified' },
      deletedAt: { type: DataTypes.DATE, field: 'deleted' },
      json: { type: DataTypes.JSON },
    });
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
        if (commons.utils.wildcardMatch(modelConfig.pattern, path) != null) {
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
      created: instance.dataValues.createdAt,
      modified: instance.dataValues.updatedAt,
      deleted: instance.dataValues.deletedAt,
      data: instance.dataValues.json,
    };
  }
  #getRow(document) {
    const flattened = flatten(document, { delimiter: this.#delimiter });
    flattened.json = document.data;
    return flattened;
  }
  insert(document, callback) {
    let insertResult, insertError;
    const model = this.#getModel(document.path);
    if (model == null) {
      return callback(
        new Error(
          `failed inserting, path ${document.path} does not match available model patterns or data in bad format`
        )
      );
    }
    const row = this.#getRow(document);
    model
      .create(row)
      .then(
        (result) => {
          insertResult = result;
        },
        (error) => {
          insertError = error;
        }
      )
      .finally(() => {
        if (insertError) {
          return callback(insertError);
        }
        const transformed = this.#transformDataValues(insertResult);
        callback(null, transformed);
      });
  }
  merge(path, document, callback) {
    this.upsert(path, document, { merge: true }, callback);
  }
  upsert(path, document, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    //TODO...
  }
  remove(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    //TODO...
  }
  #getOptions(path, options = {}) {
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
          {
            deleted: {
              [Op.is]: null,
            },
          },
        ],
      },
    };
    if (options.criteria) {
      //TODO...
    }
    // skip before count because we may want to get the count of leftovers after skip
    if (extendedOptions.skip) {
      sqlOptions.offset = extendedOptions.skip;
    }
    if (extendedOptions.count === true) {
      sqlOptions.attributes = [[this.db.fn('COUNT', this.db.col('path')), 'value']];
      // just return it, limiting and sorting don't matter
      return sqlOptions;
    }
    // only ever fetch 30 by default
    sqlOptions.limit = extendedOptions.limit || 30;
    if (extendedOptions.sort) {
      sqlOptions.order = commons._.transform(
        extendedOptions.sort,
        (result, value, key) => {
          const direction = value === -1 ? 'DESC' : 'ASC';
          if (this.#systemColumns.includes(key)) {
            result.push([key, direction]);
          } else {
            result.push([
              `data_${this.#delimiter}${key.replaceAll('.', this.#delimiter)}`,
              direction,
            ]);
          }
          return result;
        },
        []
      );
    }
    return sqlOptions;
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
    //TODO...
  }
};
