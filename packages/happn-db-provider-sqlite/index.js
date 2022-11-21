const commons = require('happn-commons'),
  LRUCache = require('lru-cache'),
  util = commons.utils,
  fs = commons.fs,
  // eslint-disable-next-line no-unused-vars
  { Sequelize, Model, DataTypes, ModelStatic, Op } = require('sequelize'),
  flatten = require('flat'),
  unflatten = flatten.unflatten;

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
    this.findOne = util.maybePromisify(this.findOne);
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
    if (this.settings.schema == null && this.settings.schema.length === 0) {
      throw new Error(
        'schema with model configurations must be defined for Sqlite provider settings'
      );
    }
    for (let modelConfig of this.settings.schema) {
      let mergedModel = this.#mergeDefaultModel(modelConfig.model);
      this.#models[modelConfig.name] = this.db.define(modelConfig.name, mergedModel, {
        timestamps: true,
      });
    }
    await this.db.sync();
  }
  #mergeDefaultModel(model) {
    // ensure we store all configured properties under data.
    let dataModel = commons._.transform(
      model,
      (result, value, key) => {
        result[`data${this.#delimiter}${key}`] = value;
        return result;
      },
      {}
    );
    return commons._.merge(dataModel, {
      path: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      createdAt: { type: Sequelize.DATE, field: 'created' },
      updatedAt: { type: Sequelize.DATE, field: 'modified' },
      deletedAt: { type: Sequelize.DATE, field: 'deleted' },
    });
  }
  #exec(query) {
    return new Promise((resolve, reject) => {
      this.db.exec(query, (e, result) => {
        if (e) {
          return reject(e);
        }
        resolve(result);
      });
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
    return commons._.transform(
      instance.dataValues,
      (result, value, key) => {
        if (key === 'createdAt') {
          result[`created`] = value;
          return result;
        }
        if (key === 'deletedAt') {
          result[`deleted`] = value;
          return result;
        }
        if (key === 'updatedAt') {
          result[`modified`] = value;
          return result;
        }
        if (key.includes(this.#delimiter)) {
          result = commons._.merge(
            result,
            unflatten({ [key]: value }, { delimiter: this.#delimiter })
          );
          return result;
        }
        result[key] = value;
        return result;
      },
      {}
    );
  }
  #getRow(document) {
    return flatten(document, { delimiter: this.#delimiter });
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
    if (extendedOptions.skip) {
      sqlOptions.offset = extendedOptions.skip;
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
          const transformed = this.#transformDataValues(found);
          if (Array.isArray(transformed)) {
            findResult = transformed;
          } else {
            findResult = [transformed];
          }
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
