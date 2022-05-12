const StaticCache = require('./cache-static');
const LRUCache = require('./cache-lru');
const PersistedCache = require('./cache-persist');
const commons = require('happn-commons');
const async = commons.async;
module.exports = class CacheService extends require('events').EventEmitter {
  #caches;
  #config;
  constructor(opts) {
    super();
    let Logger;

    if (opts && opts.logger) {
      Logger = opts.logger.createLogger('Cache');
    } else {
      Logger = require('happn-logger');
      Logger.configure({
        logLevel: 'info',
      });
    }

    this.log = Logger.createLogger('Cache');
    this.log.$$TRACE('construct(%j)', opts);

    this.#caches = {};
  }

  initialize(config, callback) {
    try {
      if (typeof config === 'function') {
        callback = config;
        config = {};
      }

      if (!config) config = {};
      if (!config.defaultTTL) config.defaultTTL = 0; //one minute
      if (!config.defaultCacheName) config.defaultCacheName = 'default'; //one minute

      if (!config.defaultCacheOpts) {
        config.defaultCacheOpts = {
          type: 'static',
          cache: {},
        };
      }

      this.#config = config;
      this.#caches = {};
      callback();
    } catch (e) {
      callback(e);
    }
  }

  create(name, opts) {
    opts = opts || this.#config.defaultCacheOpts;
    opts.cache = opts.cache || {};
    opts.type = opts.type || commons.constants.CACHE_TYPES.STATIC;
    if (this.#caches[name] && !opts.overwrite) {
      throw new Error('a cache by this name already exists');
    }
    const cacheType = opts.type.toLowerCase();
    if (cacheType === commons.constants.CACHE_TYPES.LRU) {
      this.#caches[name] = new LRUCache(name, opts.cache);
    } else if (cacheType === commons.constants.CACHE_TYPES.PERSIST) {
      opts.cache.key_prefix = name;
      this.#caches[name] = new PersistedCache(name, opts.cache);
    } else {
      this.#caches[name] = new StaticCache(name, opts.cache);
    }
    Object.defineProperty(this.#caches[name], 'utilities', {
      value: this.happn.services.utils,
    });
    return this.#caches[name];
  }

  clearAll(callback) {
    async.eachSeries(
      Object.keys(this.#caches),
      (cacheKey, cacheKeyCB) => {
        this.clear(cacheKey, cacheKeyCB);
      },
      callback
    );
  }

  clear(cache, callback) {
    var cacheToClear;

    if (typeof cache === 'function') {
      callback = cache;
      cache = null;
    }

    //make empty callback
    if (!callback) callback = () => {};

    if (!cache || cache === this.#config.defaultCacheName) cacheToClear = this.__defaultCache;
    else cacheToClear = this.#caches[cache];

    if (!cacheToClear) return callback();

    cacheToClear.clear((e) => {
      if (e) return callback(e);
      delete this.#caches[cache];
      this.__emit('cache-cleared', cache);
      callback();
    });
  }

  stopAll() {
    Object.values(this.#caches).forEach((cache) => cache.stop());
  }

  stop(callback) {
    this.stopAll();
    callback();
  }

  getStats() {
    Object.values(this.#caches).reduce((stats, cache) => {
      const cacheStats = cache.stats();
      stats[cache.name] = cacheStats;
      return stats;
    }, {});
  }
};
