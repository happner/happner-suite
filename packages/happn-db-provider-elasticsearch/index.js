const commons = require('happn-commons');
const mongoToElastic = require('./lib/mongo-to-elastic');
const async = commons.async;
const traverse = require('traverse');
const Cache = require('redis-lru-cache');
const nanoid = commons.nanoid;
const micromustache = require('micromustache');
const mongoFilter = commons.mongoFilter;
const utils = commons.utils;

module.exports = class ElasticProvider extends commons.BaseDataProvider {
  UPSERT_TYPE = commons.constants.UPSERT_TYPE;
  constructor(settings, logger) {
    super(settings, logger);
    if (!this.settings.dataroutes) {
      this.settings.dataroutes = [
        {
          pattern: '*',
          index: 'happner',
        },
      ];
    }
    if (this.settings.cache) {
      if (this.settings.cache === true) this.settings.cache = {};
      if (!this.settings.cache.cacheId) this.settings.cache.cacheId = this.settings.name;
    }
    if (!this.settings.defaultIndex) this.settings.defaultIndex = 'happner';
    if (!this.settings.defaultType) this.settings.defaultType = 'happner';
    if (!this.settings.wildcardCache) this.settings.wildcardCache = { cache: 1000 };
    if (!this.settings.elasticCallConcurrency) this.settings.elasticCallConcurrency = 20;
    if (!this.settings.bulkBatchSizes) this.settings.bulkBatchSizes = 1000;
    if (!this.settings.bulkMaxSize) this.settings.bulkMaxSize = 100000;
    Object.defineProperty(this, '__dynamicRoutes', { value: {} });
    this.initialize = utils.maybePromisify(this.initialize);
    this.stop = utils.maybePromisify(this.stop);
    this.upsert = utils.maybePromisify(this.upsert);
    this.find = utils.maybePromisify(this.find);
    this.findOne = utils.maybePromisify(this.findOne);
    this.remove = utils.maybePromisify(this.remove);
    this.count = utils.maybePromisify(this.count);
  }

  static create(settings, logger) {
    return new ElasticProvider(settings, logger);
  }

  initialize(callback) {
    const _this = this;
    const elasticsearch = require('elasticsearch');
    try {
      _this.__initializeRoutes();
      // yada yada yada: https://github.com/elastic/elasticsearch-js/issues/196
      const AgentKeepAlive = require('agentkeepalive');
      _this.settings.createNodeAgent = function (connection, config) {
        return new AgentKeepAlive(connection.makeAgentConfig(config));
      };
      const client = new elasticsearch.Client(_this.settings);
      client.ping(
        {
          requestTimeout: 30000,
        },
        function (e) {
          if (e) return callback(e);

          Object.defineProperty(_this, 'db', { value: client });

          Object.defineProperty(_this, '__elasticCallQueue', {
            value: async.queue(
              _this.__executeElasticMessage.bind(_this),
              _this.settings.elasticCallConcurrency
            ),
          });

          if (_this.settings.cache) _this.setUpCache();
          _this.__createIndexes(callback);
        }
      );
    } catch (e) {
      callback(e);
    }
  }

  stop(callback) {
    this.db.close();
    if (this.cache) {
      this.cache.disconnect(callback);
      return;
    }
    callback();
  }

  __initializeRoutes() {
    const _this = this;
    _this.settings.dataroutes.forEach(function (route) {
      if (!route.index) route.index = _this.settings.defaultIndex;
      if (!route.type) route.type = _this.settings.defaultType;
    });
  }

  upsert(path, document, options, callback) {
    try {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (options == null) {
        options = {};
      }
      options.refresh = options.refresh ? options.refresh.toString() : 'true';

      if (options.upsertType === this.UPSERT_TYPE.BULK) {
        // dynamic index is generated automatically using "index" in bulk inserts
        return this.__bulk(path, document, options, callback);
      }

      const modifiedOn = Date.now();
      const timestamp = document.data.timestamp ? document.data.timestamp : modifiedOn;
      if (options.upsertType == null) options.upsertType = this.UPSERT_TYPE.UPSERT;

      const route = this.__getRoute(path, document.data);
      this.__ensureDynamic(route) // upserting so we need to make sure our index exists

        .then(() => {
          if (options.retries == null) {
            options.retries = this.settings.elasticCallConcurrency + 20;
          } // retry_on_conflict: same size as the max amount of concurrent calls to elastic and some.
          if (options.upsertType === this.UPSERT_TYPE.INSERT) {
            return this.__insert(path, document, options, route, timestamp, modifiedOn, callback);
          }
          this.__update(path, document, options, route, timestamp, modifiedOn, callback);
        })

        .catch(callback);
    } catch (e) {
      callback(e);
    }
  }

  __ensureDynamic(route) {
    const _this = this;

    return new Promise(function (resolve, reject) {
      if (!route.dynamic || _this.__dynamicRoutes[route.index]) return resolve();

      _this
        .__createIndex(_this.__buildIndexObj(route))
        .then(function () {
          _this.__dynamicRoutes[route.index] = true;

          resolve();
        })
        .catch(reject);
    });
  }

  __insert(path, setData, options, route, timestamp, modifiedOn, callback) {
    const _this = this;

    // [start:{"key":"__update", "self":"_this"}:start]

    const elasticMessage = {
      index: route.index,
      type: route.type,
      id: path,

      body: {
        created: modifiedOn,
        modified: modifiedOn,
        timestamp: timestamp,
        path: path,
        data: setData.data,
        modifiedBy: options.modifiedBy,
        createdBy: options.modifiedBy,
      },

      refresh: options.refresh,
      opType: 'create',
    };

    _this
      .__pushElasticMessage('index', elasticMessage)

      .then(function (response) {
        const inserted = elasticMessage.body;

        inserted._index = response._index;
        inserted._type = response._type;
        inserted._id = response._id;
        inserted._version = response._version;

        callback(null, this.transform(inserted, _this.getMeta(inserted)));
      })

      .catch(callback);
  }

  __bulk(path, setData, options, callback) {
    const _this = this;

    let bulkData = setData;

    // coming in from happn, not an object but a raw [] so assigned to data.value
    if (setData.data && setData.data.value) bulkData = setData.data.value;
    if (bulkData.length > _this.settings.bulkMaxSize)
      throw new Error(
        `bulk batches can only be ${_this.settings.bulkMaxSize} entries or less amount ${bulkData.length}`
      );

    const bulkDataToPush = [];

    this.__chunkBulkMessage(bulkData, bulkDataToPush, _this.settings.bulkBatchSizes);

    const bulkResponse = {
      took: 0,
      errors: false,
      items: [],
    };

    async.eachSeries(
      bulkDataToPush,
      (bulkItem, bulkItemCB) => {
        _this
          .__createBulkMessage(path, bulkItem, options, setData)
          .then(function (bulkMessage) {
            return _this.__pushElasticMessage('bulk', bulkMessage);
          })
          .then(function (response) {
            bulkResponse.took += response.took;
            bulkResponse.errors = bulkResponse.errors || response.errors;
            bulkResponse.items.push(...response.items);
            bulkItemCB();
          })
          .catch(bulkItemCB);
      },
      (err) => {
        if (err) return callback(err);
        callback(null, bulkResponse);
      }
    );
  }
  __chunkBulkMessage(bulkData, returArr = [], chunkAmount = 1000) {
    if (bulkData.length === 0) return;
    if (bulkData.length <= chunkAmount) {
      returArr.push(bulkData);
      return;
    }
    returArr.push(bulkData.splice(0, chunkAmount));
    return this.__chunkBulkMessage(bulkData, returArr);
  }

  __createBulkMessage(path, setData, options) {
    const _this = this;

    // [start:{"key":"__createBulkMessage", "self":"_this", "error":"e"}:start]

    return new Promise(function (resolve, reject) {
      const bulkMessage = { body: [], refresh: options.refresh, _source: true };

      const modifiedOn = Date.now();

      async.eachSeries(
        setData,
        function (bulkItem, bulkItemCB) {
          let route;

          if (bulkItem.path) route = _this.__getRoute(bulkItem.path, bulkItem.data);
          else route = _this.__getRoute(path, bulkItem.data);
          let timestamp = modifiedOn;
          if (bulkItem.data && bulkItem.data.timestamp) timestamp = bulkItem.data.timestamp;

          _this
            .__ensureDynamic(route) // upserting so we need to make sure our index exists

            .then(function () {
              bulkMessage.body.push({
                index: {
                  _index: route.index,
                  _type: route.type,
                  _id: route.path,
                },
              });

              bulkMessage.body.push({
                created: modifiedOn,
                modified: modifiedOn,
                timestamp: timestamp,
                path: route.path,
                data: bulkItem.data,
                modifiedBy: options.modifiedBy,
                createdBy: options.modifiedBy,
              });

              bulkItemCB();
            })

            .catch(bulkItemCB);
        },
        function (e) {
          // [end:{"key":"__createBulkMessage", "self":"_this", "error":"e"}:end]

          if (e) return reject(e);

          resolve(bulkMessage);
        }
      );
    });
  }

  __update(path, setData, options, route, timestamp, modifiedOn, callback) {
    const _this = this;

    // [start:{"key":"__update", "self":"_this"}:start]

    const elasticMessage = {
      index: route.index,
      type: route.type,
      id: path,

      body: {
        doc: {
          modified: modifiedOn,
          timestamp: timestamp,
          path: path,
          data: setData.data,
        },

        upsert: {
          created: modifiedOn,
          modified: modifiedOn,
          timestamp: timestamp,
          path: path,
          data: setData.data,
        },
      },
      _source: options.source ? options.source : true,
      refresh: options.refresh,
      retryOnConflict: options.retries,
    };

    if (options.modifiedBy) {
      elasticMessage.body.upsert.modifiedBy = options.modifiedBy;
      elasticMessage.body.doc.modifiedBy = options.modifiedBy;
      elasticMessage.body.upsert.createdBy = options.modifiedBy;
    }

    _this
      .__pushElasticMessage('update', elasticMessage)

      .then(function (response) {
        let data = null;
        let metadata = null;
        if (response.get && response.get._source) {
          data = response.get._source;
          metadata = _this.getMeta(response.get._source);
        }
        let created = null;

        if (response.result === 'created' && data)
          created = _this.__partialTransform(response.get, route.index, route.type);

        callback(null, _this.transform(created || data, metadata));
      })

      .catch(callback);
  }

  remove(path, callback) {
    const _this = this;

    const multiple = path.indexOf('*') > -1;

    let deletedCount = 0;

    const route = _this.__getRoute(path);

    const handleResponse = function (e) {
      if (e) return callback(e);

      const deleteResponse = {
        data: {
          removed: deletedCount,
        },
        _meta: {
          timestamp: Date.now(),
          path: path,
        },
      };

      callback(null, deleteResponse);
    };

    // we cannot delete what does not exist yet
    if (route.noIndexYet) return handleResponse(null);

    const elasticMessage = {
      index: route.index,
      type: route.type,
      refresh: true,
    };

    if (multiple) {
      elasticMessage.body = {
        query: {
          wildcard: {
            path: path,
          },
        },
      };

      // deleteOperation = this.db.deleteByQuery.bind(this.db);
    } else elasticMessage.id = path;

    _this.count(path, function (e, count) {
      if (e) {
        if (e.status !== 404)
          return callback(new Error('count operation failed for delete: ' + e.toString()));
        else return handleResponse(null);
      }

      deletedCount = count.data.value;

      let method = 'delete';

      if (multiple) method = 'deleteByQuery';

      _this
        .__pushElasticMessage(method, elasticMessage)

        .then(function (response) {
          handleResponse(null, response);
        })

        .catch(handleResponse);
    });
  }

  find(path, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = {};
    }
    if (parameters == null) {
      parameters = {};
    }
    if (parameters.options == null) {
      parameters.options = {};
    }
    const _this = this;

    const searchPath = _this.preparePath(path);

    // [start:{"key":"find", "self":"_this"}:start]

    const route = _this.__getRoute(searchPath);

    if (route.noIndexYet) {
      // [end:{"key":"find", "self":"_this"}:end]
      return callback(null, []);
    }
    if (!parameters.criteria) parameters.criteria = {};
    if (!parameters.criteria.path) parameters.criteria.path = route.path;

    let searchString = '';
    try {
      searchString = mongoToElastic.convertCriteria(parameters.criteria);
    } catch (e) {
      callback(e);
    }
    const query = {
      query: {
        constant_score: {
          filter: {
            query_string: {
              query: searchString,
            },
          },
        },
      },
    };

    const elasticMessage = {
      index: route.index,
      type: route.type,
      body: query,
    };

    mongoToElastic.convertOptions(parameters.options, elasticMessage, [
      {
        path: {
          order: 'asc',
        },
      },
    ]); // this is because the $not keyword works in nedb and mongoFilter, but not in elastic

    if (elasticMessage.body.from == null) elasticMessage.body.from = 0;

    if (elasticMessage.body.size == null) elasticMessage.body.size = 10000;

    _this
      .__pushElasticMessage('search', elasticMessage)

      .then(function (resp) {
        if (resp.hits && resp.hits.hits && resp.hits.hits.length > 0) {
          let found = resp.hits.hits;

          callback(null, _this.__partialTransformAll(found));
        } else callback(null, []);
      })
      .catch((e) => {
        callback(e);
      });
  }

  count(path, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = {};
    }
    if (parameters == null) {
      parameters = {};
    }
    if (parameters.options == null) {
      parameters.options = {};
    }
    const _this = this;

    const searchPath = _this.preparePath(path);
    const route = _this.__getRoute(searchPath);

    if (route.noIndexYet) {
      // [end:{"key":"find", "self":"_this"}:end]
      return callback(null, []);
    }
    if (!parameters.criteria) parameters.criteria = {};
    if (!parameters.criteria.path) parameters.criteria.path = route.path;

    let searchString = '';
    try {
      searchString = mongoToElastic.convertCriteria(parameters.criteria);
    } catch (e) {
      callback(e);
    }
    const query = {
      query: {
        constant_score: {
          filter: {
            query_string: {
              query: searchString,
            },
          },
        },
      },
    };

    const elasticMessage = {
      index: route.index,
      type: route.type,
      body: query,
    };

    if (parameters.options) mongoToElastic.convertOptions(parameters.options, elasticMessage); // this is because the $not keyword works in nedb and mongoFilter, but not in elastic

    _this
      .__pushElasticMessage('count', elasticMessage)

      .then(function (resp) {
        callback(null, { data: { value: resp.count } });
      })
      .catch((e) => {
        callback(e);
      });
  }

  findOne(criteria, fields, callback) {
    if (typeof fields === 'function') {
      callback = fields;
      fields = null;
    }
    const _this = this;
    const path = criteria.path;
    delete criteria.path;
    _this.find(path, { options: fields, criteria: criteria }, function (e, results) {
      if (e) return callback(e);

      if (results.length > 0) {
        callback(null, results[0]); // already partially transformed
      } else callback(null, null);
    });
  }

  __partialTransformAll(dataItems) {
    const _this = this;

    return dataItems.map(function (dataItem) {
      return _this.__partialTransform(dataItem);
    });
  }

  __partialTransform(dataItem, index, type) {
    return {
      _id: dataItem._id ? dataItem._id : dataItem._source.path,
      _index: dataItem._index ? dataItem._index : index,
      _type: dataItem._type ? dataItem._type : type,
      _score: dataItem._score,
      _version: dataItem._version,
      path: dataItem._id ? dataItem._id : dataItem._source.path,
      created: dataItem._source.created,
      deleted: dataItem._source.deleted,
      modified: dataItem._source.modified,
      createdBy: dataItem._source.createdBy,
      modifiedBy: dataItem._source.modifiedBy,
      deletedBy: dataItem._source.deletedBy,
      data: dataItem._source.data,
      timestamp: dataItem._source.timestamp,
    };
  }

  __partialInsertTransform(createdObj, response) {
    return {
      _id: response._id,
      _index: response._index,
      _type: response._type,
      _version: response._version,
      created: createdObj.created,
      deleted: createdObj.deleted,
      modified: createdObj.modified,
      createdBy: createdObj.createdBy,
      modifiedBy: createdObj.modifiedBy,
      deletedBy: createdObj.deletedBy,
      data: createdObj.data,
    };
  }

  __parseFields(fields) {
    traverse(fields).forEach(function (value) {
      if (value) {
        const _thisNode = this;

        // ignore elements in arrays
        if (_thisNode.parent && Array.isArray(_thisNode.parent.node)) return;

        if (typeof _thisNode.key === 'string') {
          // ignore directives
          if (_thisNode.key.indexOf('$') === 0) return;

          if (_thisNode.key === '_id') {
            _thisNode.parent.node['_source._id'] = value;
            return _thisNode.remove();
          }

          if (_thisNode.key === 'path' || _thisNode.key === '_meta.path') {
            _thisNode.parent.node['_source.path'] = value;
            return _thisNode.remove();
          }

          if (_thisNode.key === 'created' || _thisNode.key === '_meta.created') {
            _thisNode.parent.node['_source.created'] = value;
            return _thisNode.remove();
          }

          if (_thisNode.key === 'modified' || _thisNode.key === '_meta.modified') {
            _thisNode.parent.node['_source.modified'] = value;
            return _thisNode.remove();
          }

          if (_thisNode.key === 'timestamp' || _thisNode.key === '_meta.timestamp') {
            _thisNode.parent.node['_source.timestamp'] = value;
            return _thisNode.remove();
          }

          const propertyKey = _thisNode.key;

          if (propertyKey.indexOf('data.') === 0)
            _thisNode.parent.node['_source.' + propertyKey] = value;
          else if (propertyKey.indexOf('_data.') === 0)
            _thisNode.parent.node['_source.' + propertyKey] = value;
          // prepend with data.
          else _thisNode.parent.node['_source.data.' + propertyKey] = value;

          return _thisNode.remove();
        }
      }
    });

    return fields;
  }

  __wildcardMatch(pattern, matchTo) {
    return utils.wildcardMatch(pattern, matchTo);
  }

  __filter(criteria, items) {
    try {
      return mongoFilter(criteria, items);
    } catch (e) {
      throw new Error('filter failed: ' + e.toString(), e);
    }
  }

  setUpCache() {
    const _this = this;

    const cache = new Cache(_this.settings.cache);

    Object.defineProperty(this, 'cache', { value: cache });

    _this.__oldFind = _this.find;

    _this.find = function (path, parameters, callback) {
      if (path.indexOf && path.indexOf('*') === -1) {
        return _this.cache.get(path, function (e, item) {
          if (e) return callback(e);

          if (item) return callback(null, [item]);

          _this.__oldFind(path, parameters, function (e, items) {
            if (e) return callback(e);

            if (!items || items.length === 0) return callback(null, []);

            _this.cache.set(path, items[0], function (e) {
              return callback(e, items);
            });
          });
        });
      }

      return this.__oldFind(path, parameters, callback);
    }.bind(this);

    this.__oldFindOne = this.findOne;

    _this.findOne = function (criteria, fields, callback) {
      if (criteria.path && criteria.path.indexOf('*') > -1)
        return this.__oldFindOne(criteria, fields, callback);

      _this.cache.get(criteria.path, function (e, item) {
        if (e) return callback(e);

        if (item) return callback(null, item);

        _this.__oldFindOne(criteria, fields, function (e, item) {
          if (e) return callback(e);

          if (!item) return callback(null, null);

          return callback(e, item);
        });
      });
    }.bind(this);

    this.__oldRemove = this.remove;

    this.remove = function (path, callback) {
      if (path.indexOf && path.indexOf('*') === -1) {
        // its ok if the actual remove fails, as the cache will refresh
        _this.cache.remove(path, function (e) {
          if (e) return callback(e);

          _this.__oldRemove(path, callback);
        });
      } else {
        _this.find(path, { fields: { path: 1 } }, null, function (e, items) {
          if (e) return callback(e);

          // clear the items from the cache
          async.eachSeries(
            items,
            function (item, itemCB) {
              _this.cache.remove(item.path, itemCB);
            },
            function (e) {
              if (e) return callback(e);

              _this.__oldRemove(path, callback);
            }
          );
        });
      }
    };

    this.__oldUpdate = this.update;

    _this.update = function (criteria, data, options, callback) {
      _this.__oldUpdate(criteria, data, options, function (e, response) {
        if (e) return callback(e);

        _this.cache.set(criteria.path, data, function (e) {
          if (e) return callback(e);

          return callback(null, response);
        });
      });
    };
    // eslint-disable-next-line
    console.warn('data caching is on, be sure you have redis up.');
  }

  __matchRoute(path, pattern) {
    if (this.__wildcardMatch(pattern, path)) return true;

    let baseTagPath = '/_TAGS';

    if (path.substring(0, 1) !== '/') baseTagPath += '/';

    return this.__wildcardMatch(baseTagPath + pattern, path);
  }

  __getRoute(path, obj) {
    const _this = this;

    // [start:{"key":"__getRoute", "self":"_this"}:start]

    let route = null;

    let routePath = path.toString();

    if (obj) routePath = micromustache.render(routePath, obj);

    if (routePath.indexOf('{id}') > -1) routePath = routePath.replace('{id}', nanoid());

    _this.settings.dataroutes.every(function (dataStoreRoute) {
      let pattern = dataStoreRoute.pattern;
      if (dataStoreRoute.dynamic) pattern = dataStoreRoute.pattern.split('{')[0] + '*';
      if (_this.__matchRoute(routePath, pattern)) route = dataStoreRoute;
      return route == null;
    });

    if (!route) {
      // [end:{"key":"__getRoute", "self":"_this"}:end]
      throw new Error('route for path ' + routePath + ' does not exist');
    }

    if (route.dynamic) {
      // [end:{"key":"__getRoute", "self":"_this"}:end]
      route = _this.__getDynamicParts(route, routePath);
    }

    // [end:{"key":"__getRoute", "self":"_this"}:end]

    route.path = routePath;

    return route;
  }

  __getDynamicParts(dataStoreRoute, path) {
    const dynamicParts = { dynamic: true };
    const pathSegments = path.split('/');

    if (!dataStoreRoute.pathLocations) {
      const locations = {};

      dataStoreRoute.pattern.split('/').every(function (segment, segmentIndex) {
        if (segment === '{{index}}') locations.index = segmentIndex;
        if (segment === '{{type}}') locations.type = segmentIndex;
        return !(locations.index && locations.type);
      });

      dataStoreRoute.pathLocations = locations;
    }

    if (dataStoreRoute.pathLocations.index)
      dynamicParts.index = pathSegments[dataStoreRoute.pathLocations.index];

    if (dataStoreRoute.pathLocations.type)
      dynamicParts.type = pathSegments[dataStoreRoute.pathLocations.type];

    if (!dynamicParts.index) dynamicParts.index = dataStoreRoute.index;
    if (!dynamicParts.type) dynamicParts.type = dataStoreRoute.type;
    return dynamicParts;
  }

  __createIndex(indexConfig) {
    const _this = this;
    return new Promise(function (resolve, reject) {
      _this
        .__pushElasticMessage('indices.create', indexConfig)
        .then(function () {
          resolve();
        })

        .catch(function (e) {
          if (
            e &&
            !utils.stringContainsAny(
              e.message,
              'resource_already_exists_exception',
              'index_already_exists_exception'
            )
          ) {
            return reject(
              new Error('failed creating index ' + indexConfig.index + ':' + e.toString(), e)
            );
          }

          resolve();
        });
    });
  }

  __buildIndexObj(indexConfig) {
    const _this = this;

    // [start:{"key":"__buildIndexObj", "self":"_this"}:start]

    if (indexConfig.index == null) indexConfig.index = _this.settings.defaultIndex;

    if (indexConfig.type == null) indexConfig.type = _this.settings.defaultType;

    const indexJSON = {
      index: indexConfig.index,
      body: {
        mappings: {},
      },
    };

    const typeJSON = {
      properties: {
        path: { type: 'keyword' },
        data: { type: 'object' },
        created: { type: 'date' },
        timestamp: { type: 'date' },
        modified: { type: 'date' },
        modifiedBy: { type: 'keyword' },
        createdBy: { type: 'keyword' },
      },
    };

    indexJSON.body.mappings[indexConfig.type] = typeJSON;

    // add any additional mappings
    if (
      indexConfig.body &&
      indexConfig.body.mappings &&
      indexConfig.body.mappings[indexConfig.type]
    ) {
      Object.keys(indexConfig.body.mappings[indexConfig.type].properties).forEach(function (
        fieldName
      ) {
        const mappingFieldName = fieldName;

        if (indexJSON.body.mappings[indexConfig.type].properties[mappingFieldName] == null) {
          indexJSON.body.mappings[indexConfig.type].properties[mappingFieldName] =
            indexConfig.body.mappings[indexConfig.type].properties[fieldName];
        }
      });
    }

    // [end:{"key":"__buildIndexObj", "self":"_this"}:end]

    return indexJSON;
  }

  __createIndexes(callback) {
    const _this = this;

    if (!_this.settings.indexes) _this.settings.indexes = [];

    let defaultIndexFound = false;

    _this.settings.indexes.forEach(function (indexConfig) {
      if (indexConfig.index === _this.settings.defaultIndex) defaultIndexFound = true;
    });

    let indexJSON = _this.__buildIndexObj({
      index: _this.settings.defaultIndex,
      type: _this.settings.defaultType,
    });

    if (!defaultIndexFound) {
      _this.settings.indexes.push(indexJSON);
    }

    async.eachSeries(
      _this.settings.indexes,
      function (index, indexCB) {
        if (index.index !== _this.defaultIndex) indexJSON = _this.__buildIndexObj(index);

        _this.__createIndex(indexJSON).then(indexCB).catch(indexCB);
      },
      function (e) {
        if (e) return callback(e);

        if (!_this.settings.dataroutes) _this.settings.dataroutes = [];

        // last route goes to default index

        let defaultRouteFound = false;

        _this.settings.dataroutes.forEach(function (route) {
          if (route.pattern === '*') defaultRouteFound = true;
        });

        if (!defaultRouteFound)
          _this.settings.dataroutes.push({ pattern: '*', index: _this.settings.defaultIndex });

        callback();
      }
    );
  }

  __pushElasticMessage(method, message) {
    const _this = this;

    return new Promise(function (resolve, reject) {
      _this.__elasticCallQueue.push({ method: method, message: message }, function (e, response) {
        if (e) return reject(e);

        resolve(response);
      });
    });
  }

  __executeElasticMessage(elasticCall, callback) {
    try {
      if (elasticCall.method === 'indices.create')
        return this.db.indices.create(elasticCall.message, callback);

      this.db[elasticCall.method].call(this.db, elasticCall.message, callback);
    } catch (e) {
      callback(e);
    }
  }
};
