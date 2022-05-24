const StaticCache = require('./cache-static');
const LRUCache = require('./cache-lru');
const PersistedCache = require('./cache-persist');
const commons = require('happn-commons');
module.exports = class CacheService extends require('events').EventEmitter {
  #caches;
  #config;
  #statisticsInterval;
  #lastStats;
  constructor(opts = {}) {
    super();
    this.initialize = commons.utils.maybePromisify(this.initialize);
    this.stop = commons.utils.maybePromisify(this.stop);
    if (opts && opts.logger) {
      this.log = opts.logger.createLogger('Cache');
    } else {
      let logger = require('happn-logger');
      logger.configure({
        logLevel: 'info',
      });
      this.log = logger.createLogger('Cache');
    }
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
      if (
        typeof this.#config.statisticsInterval === 'number' &&
        this.#config.statisticsInterval < 1e3
      ) {
        this.log.warn(`statisticsInterval smaller than a second, ignoring`);
      }
      if (this.#config.statisticsInterval >= 1e3) this.#startLoggingStatistics();
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
    const type = opts.type.toLowerCase();
    if (Object.values(commons.constants.CACHE_TYPES).indexOf(type) === -1) {
      throw new Error(`unknown cache type: ${type}`);
    }

    this.#caches[name] = { type };
    let instance;

    if (type === commons.constants.CACHE_TYPES.LRU) {
      instance = new LRUCache(name, opts.cache);
    } else if (type === commons.constants.CACHE_TYPES.PERSIST) {
      opts.cache.key_prefix = name;
      instance = new PersistedCache(name, opts.cache);
    } else {
      instance = new StaticCache(name, opts.cache);
    }
    this.#caches[name] = { type, instance };
    Object.defineProperty(this.#caches[name], 'utilities', {
      value: this.happn.services.utils,
    });
    return this.#caches[name].instance;
  }

  async clearAll(deleteOnClear) {
    for (const name of Object.keys(this.#caches)) {
      await this.clear(name, deleteOnClear);
    }
  }

  async clear(name, deleteOnClear = false) {
    let found = this.#caches[name];
    if (!found) return;
    await found.instance.clear();
    this.emit('cache-cleared', name);
    if (deleteOnClear) {
      // dont clear again, so clearOnDelete false
      this.delete(name, false);
    }
  }

  delete(name, clearOnDelete = true) {
    const toDelete = this.#caches[name];
    if (!toDelete) return;
    delete this.#caches[name];
    if (clearOnDelete) {
      toDelete.clear();
    }
    this.emit('cache-deleted', name);
  }

  stopAll() {
    Object.values(this.#caches).forEach((cache) => cache.instance.stop());
  }

  stop(options, callback) {
    if (typeof options === 'function') {
      callback = options;
    }
    this.stopAll();
    if (this.#statisticsInterval) this.#stopLoggingStatistics();
    if (typeof callback === 'function') {
      callback();
    }
  }

  getStats() {
    return Object.values(this.#caches).reduce((stats, cache) => {
      const cacheStats = commons._.merge(cache.instance.stats(), { type: cache.type });
      stats[cache.instance.name] = cacheStats;
      return stats;
    }, {});
  }

  getCache(name) {
    return this.#caches[name];
  }

  getOrCreate(name, opts) {
    const found = this.getCache(name);
    if (found) return found.instance;
    return this.create(name, opts);
  }

  #startLoggingStatistics() {
    this.#statisticsInterval = setInterval(() => {
      try {
        const stats = this.getStats();

        this.log.json.info(
          commons._.merge(this.#calculatePerSecond(stats), {
            timestamp: Date.now(),
            name: this.happn.name,
          }),
          'cache-service-statistics'
        );
        this.#lastStats = stats;
      } catch (e) {
        this.log.warn(`failure logging statistics: ${e.message}`);
      }
    }, this.#config.statisticsInterval);
  }

  #calculatePerSecond(stats) {
    return Object.keys(stats).reduce((calculated, statsKey) => {
      if (!this.#lastStats) {
        calculated[statsKey] = commons._.merge(stats[statsKey], {
          hitsPerSec: stats[statsKey].hits / (this.#config.statisticsInterval / 1e3),
          missesPerSec: stats[statsKey].misses / (this.#config.statisticsInterval / 1e3),
        });
        return calculated;
      }
      if (!this.#lastStats[statsKey]) {
        this.#lastStats[statsKey] = { hits: 0, misses: 0 };
      }
      calculated[statsKey] = commons._.merge(stats[statsKey], {
        hitsPerSec:
          (stats[statsKey].hits - this.#lastStats[statsKey].hits) /
          (this.#config.statisticsInterval / 1e3),
        missesPerSec:
          (stats[statsKey].misses - this.#lastStats[statsKey].misses) /
          (this.#config.statisticsInterval / 1e3),
      });
      return calculated;
    }, {});
  }

  #stopLoggingStatistics() {
    clearInterval(this.#statisticsInterval);
  }
};
