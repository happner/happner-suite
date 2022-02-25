var EventEmitter = require('events').EventEmitter,
  LRU = require('lru-cache'),
  redis_pubsub = require('node-redis-pubsub'),
  redis = require('redis'),
  async = require('async'),
  mongoFilter = require('happn-commons').mongoFilter,
  clone = require('clone'),
  hyperid = require('happner-hyperid').create({
    urlSafe: true,
  }),
  util = require('util');

function CacheError(message, cause) {
  this.name = 'CacheError';
  this.code = 500;
  this.message = message;
  if (cause) this.cause = cause;
}

CacheError.prototype = Error.prototype;

function InternalCache(opts) {
  try {
    if (opts == null) opts = {};
    if (!opts.cacheId)
      throw new CacheError(
        'invalid or no cache id specified - caches must be identified to ensure continuity'
      );
    if (!opts.redisExpire) opts.redisExpire = 1000 * 60 * 30; // redis values expire after 30 minutes

    this.__redisExpire = opts.redisExpire;
    this.__cacheNodeId = opts.cacheId + '_' + Date.now() + '_' + hyperid();
    this.__cacheId = opts.cacheId;
    this.__subscriptions = {};
    this.__systemSubscriptions = {};
    this.__connected = false;
    this.__stats = {
      memory: 0,
      subscriptions: 0,
      redis: 0,
    };

    this.__connectionQueue = async.queue((_task, callback) => {
      if (this.__connected) return callback();
      return this.__redisClient
        .connect()
        .then(() => {
          this.__connected = true;
          callback();
        })
        .catch(callback);
    }, 1);

    if (!opts.lru) opts.lru = {};

    //handles cases where
    opts.lru.dispose = function (key) {
      this.__removeSubscription(key);
    }.bind(this);

    if (!opts.lru.max) opts.lru.max = 5000; //caching 5000 data points in memory

    this.__cache = new LRU(opts.lru);
    this.__eventEmitter = new EventEmitter();
    this.__eventEmitter.setMaxListeners(100);

    if (!opts.redis) opts.redis = {};
    opts.redis.prefix = this.__cacheId;
    if (!opts.redis.port) opts.redis.port = 6379;

    var url = opts.redis.url || 'redis://127.0.0.1';
    delete opts.redis.url;
    var pubsubOpts; // for use with redis pubsub
    pubsubOpts = JSON.parse(JSON.stringify(opts.redis));
    if (opts.redis.password) pubsubOpts.auth = opts.redis.password;
    pubsubOpts.scope = this.__cacheId + '_pubsub'; //separate data-layer for pubsub
    delete pubsubOpts.password;
    delete pubsubOpts.prefix;
    pubsubOpts.url = url;
    this.__redisClient = redis.createClient(url, opts.redis);
    this.__redisPubsub = new redis_pubsub(pubsubOpts);
    this.__systemSubscriptions['system/cache-reset'] = this.__redisPubsub.on(
      'system/cache-reset',
      function (message) {
        if (message.origin !== this.cacheNodeId) this.__cache.reset();
      }.bind(this)
    );
    this.__systemSubscriptions['system/cache-reset'] = this.__redisPubsub.on(
      'system/cache-reset',
      function (message) {
        if (message.origin !== this.cacheNodeId) this.__cache.reset();
      }.bind(this)
    );
    this.__systemSubscriptions['system/redis-error'] = this.__redisClient.on(
      'error',
      function (error) {
        this.__emit('error', new CacheError('redis client error', error));
      }.bind(this)
    );
    this.__systemSubscriptions['system/redis-error'] = this.__redisPubsub.on(
      'error',
      function (error) {
        this.__emit('error', new CacheError('redis pubsub error', error));
      }.bind(this)
    );
    if (opts.clear)
      this.reset((e) => {
        if (e) return this.__emit('error', new CacheError('cache clear on startup failed', e));
      });
  } catch (e) {
    throw new CacheError('failed with cache initialization: ' + e.toString(), e);
  }
}

InternalCache.prototype.__removeSubscription = function (key, callback) {
  if (this.__subscriptions[key]) {
    this.__subscriptions[key]((e) => {
      if (e) {
        if (callback) callback(e);

        return this.__emit(
          'error',
          new CacheError('failure removing redis subscription, key: ' + key, e)
        );
      }

      delete this.__subscriptions[key];
      this.__stats.subscriptions--;
      this.__emit('item-disposed', key);
      if (callback) callback();
    });
  }
};

InternalCache.prototype.__updateLRUCache = function (key, item, callback) {
  //update our LRU cache
  this.__cache.set(key, item);

  if (this.__subscriptions[key]) {
    return callback(null, item); //we already have a change listener
  }

  //create a subscription to changes, gets whacked on the opts.dispose method
  this.__subscriptions[key] = this.__redisPubsub.on(
    key,
    (message) => {
      //item has changed on a different node, we delete it from our cache, so the latest version can be re-fetched if necessary

      //origin introduced to alleviate tail chasing
      if (message.origin !== this.__cacheNodeId)
        return this.del(
          key,
          (e) => {
            if (e)
              this.__emit(
                'error',
                new CacheError(
                  'unable to clear cache after item was updated elsewhere, key: ' + key,
                  e
                )
              );
          },
          true
        ); //noRedis is true, as this has been removed elsewhere
    },
    (e) => {
      if (e) return callback(e);
      this.__stats.subscriptions++;
      callback(null, item);
    }
  );
};

InternalCache.prototype.__updateRedisCache = function (key, item, callback) {
  this.connect((e) => {
    if (e) return callback(e);
    this.__redisClient
      .set(key, JSON.stringify(item))
      .then(() => {
        return this.__redisClient.expire(key, this.__redisExpire);
      })
      .then(() => {
        callback();
      })
      .catch(callback);
  });
};

InternalCache.prototype.__getFromRedisCache = function (key, callback) {
  this.connect((e) => {
    if (e) return callback(e);
    this.__redisClient
      .get(key)
      .then((found) => {
        if (found) return callback(null, JSON.parse(found));
        callback(null, null);
      })
      .catch(callback);
  });
};

InternalCache.prototype.__redisDel = function (key, callback) {
  this.connect((e) => {
    if (e) return callback(e);
    this.__redisClient
      .del(key)
      .then(() => {
        callback();
      })
      .catch(callback);
  });
};

InternalCache.prototype.__publishChange = function (key, val, callback) {
  try {
    this.__redisPubsub.emit(key, { data: val, origin: this.__cacheNodeId });
    callback();
  } catch (e) {
    callback(e);
  }
};

InternalCache.prototype.get = function (key, callback) {
  try {
    var returnValue = this.__cache.get(key);
    //found something in memory
    if (returnValue) return callback(null, returnValue);
    //maybe in redis, but no longer in LRU
    this.__getFromRedisCache(key, (e, found) => {
      if (e) return callback(e);
      //exists in redis, so we update LRU
      if (found) {
        return this.__updateLRUCache(key, found, (e, updated) => {
          if (e) return callback(e);
          callback(null, updated);
        });
      }
      return callback(null, null);
    });
  } catch (e) {
    callback(e);
  }
};

InternalCache.prototype.set = function (key, val, callback) {
  this.__updateRedisCache(key, val, (e) => {
    if (e) return callback(e);
    this.__updateLRUCache(key, val, (e) => {
      if (e) return callback(e);
      this.__publishChange(key, val, callback);
    });
  });
};

InternalCache.prototype.values = function () {
  return this.__cache.values();
};

InternalCache.prototype.del = function (key, callback, noRedis) {
  if (!this.__cache.has(key)) {
    return this.__redisDel(key, (e) => {
      if (e) return callback(e);
      this.__publishChange(key, null, callback);
    });
  }

  var disposedTimeout;
  var disposedHandler = function (disposedKey) {
    if (disposedKey === key) {
      clearTimeout(disposedTimeout);

      this.off('item-disposed', disposedHandler);

      if (noRedis) return callback();

      this.__redisDel(key, callback);
    }
  }.bind(this);
  //wait 5 seconds, then call back with a failure
  disposedTimeout = setTimeout(() => {
    clearTimeout(disposedTimeout);
    this.off('item-disposed', disposedHandler);
    callback(new CacheError('failed to remove item from the LRU cache'));
  }, 5000);

  this.on('item-disposed', disposedHandler);
  this.__cache.del(key);
};

InternalCache.prototype.__emit = function (key, data) {
  return this.__eventEmitter.emit(key, data);
};

InternalCache.prototype.on = function (key, handler) {
  return this.__eventEmitter.on(key, handler);
};

InternalCache.prototype.off = InternalCache.prototype.removeListener = function (key, handler) {
  return this.__eventEmitter.removeListener(key, handler);
};

InternalCache.prototype.size = function () {
  return this.__cache.length;
};

InternalCache.prototype.disconnect = util.promisify(function (callback) {
  this.__redisClient.quit();
  this.__redisPubsub.quit();
  this.__connected = false;
  callback();
});

InternalCache.prototype.connect = function (callback) {
  this.__connectionQueue.push(null, callback);
};

InternalCache.prototype.reset = function (callback) {
  this.connect((e) => {
    if (e) return callback(e);
    this.__redisClient
      .keys('*')
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            return this.__redisClient.del(key);
          })
        );
      })
      .then(() => {
        this.__redisPubsub.emit('system/cache-reset', { origin: this.__cacheNodeId });
        this.__cache.reset();
        callback();
      })
      .catch(callback);
  });
};

function RedisLRUCache(opts) {
  this.__cache = new InternalCache(opts);
  this.__eventEmitter = new EventEmitter();

  if (opts.clear) {
    this.clear((e) => {
      if (e) return this.__emit('error', new CacheError('failed clearing cache on startup', e));
      this.__emit('cleared-on-startup', opts);
    });
  }
}

RedisLRUCache.prototype.__emit = function (key, data) {
  return this.__eventEmitter.emit(key, data);
};

RedisLRUCache.prototype.on = function (key, handler) {
  return this.__eventEmitter.on(key, handler);
};

RedisLRUCache.prototype.off = RedisLRUCache.prototype.removeListener = function (key, handler) {
  return this.__eventEmitter.removeListener(key, handler);
};

RedisLRUCache.prototype.__tryCallback = function (callback, data, e, doClone) {
  var callbackData = data;
  if (data && doClone) callbackData = clone(data);
  if (e) {
    if (callback) return callback(e);
    else throw e;
  }
  if (callback) return callback(null, callbackData);
  return callbackData;
};

RedisLRUCache.prototype.update = util.promisify(function (key, data, callback) {
  try {
    var result = this.__cache.get(key);
    if (result != null) {
      result.data = data;
      this.__cache.set(key, result, result.ttl);
      return this.__tryCallback(callback, this.__cache.get(key), null);
    }
    this.__tryCallback(callback, null, null);
  } catch (e) {
    return this.__tryCallback(callback, null, e);
  }
});

RedisLRUCache.prototype.increment = util.promisify(function (key, by, callback) {
  try {
    var result = this.__cache.get(key);

    if (typeof result.data === 'number') {
      result.data += by;
      this.__cache.set(key, result);
      return this.__tryCallback(callback, result.data, null);
    }
    return this.__tryCallback(callback, null, null);
  } catch (e) {
    return this.__tryCallback(callback, null, e);
  }
});

RedisLRUCache.prototype.get = util.promisify(function (key, opts, callback) {
  try {
    if (key == null) return callback(new CacheError('invalid key'));
    if (typeof opts === 'function') {
      callback = opts;
      opts = null;
    }

    if (!opts) opts = {};
    this.__cache.get(key, (e, cached) => {
      if (e) return callback(e);
      if (cached) return this.__tryCallback(callback, cached.data, null, true);
      else {
        if (opts.retrieveMethod) {
          opts.retrieveMethod.call(opts.retrieveMethod, (e, result) => {
            if (e) return callback(e);

            // -1 and 0 are perfectly viable things to cache
            if (result == null) return this.__tryCallback(callback, null, null);

            this.set(key, result, function (e, value) {
              return this.__tryCallback(callback, value, e, true);
            });
          });
        } else if (opts.default) {
          this.set(key, opts.default, function (e, value) {
            return this.__tryCallback(callback, value, e, true);
          });
        } else return this.__tryCallback(callback, null, null);
      }
    });
  } catch (e) {
    this.__tryCallback(callback, null, e);
  }
});

RedisLRUCache.prototype.clear = util.promisify(function (callback) {
  if (this.__cache) this.__cache.reset(callback);
  else callback(new Error('no cache available for reset'));
});

RedisLRUCache.prototype.set = util.promisify(function (key, val, callback) {
  try {
    if (key == null) return callback(new CacheError('invalid key'));
    var cacheItem = { data: clone(val), key: key };
    this.__cache.set(key, cacheItem, (e) => {
      if (e) return callback(e);
      callback(null, cacheItem);
    });
  } catch (e) {
    callback(e);
  }
});

RedisLRUCache.prototype.remove = util.promisify(function (key, callback) {
  try {
    if (key == null || key === undefined) return callback(new CacheError('invalid key'));
    this.__cache.del(key, callback);
  } catch (e) {
    callback(e);
  }
});

RedisLRUCache.prototype.__all = function () {
  var returnItems = [];
  var values = this.__cache.values();
  values.forEach(function (value) {
    returnItems.push(value.data);
  });
  return returnItems;
};

RedisLRUCache.prototype.all = util.promisify(function (filter, callback) {
  try {
    if (typeof filter === 'function') {
      callback = filter;
      filter = null;
    }

    try {
      if (filter) return callback(null, mongoFilter({ $and: [filter] }, this.__all()));
      else return callback(null, this.__all());
    } catch (e) {
      return callback(e);
    }
  } catch (e) {
    callback(e);
  }
});

RedisLRUCache.prototype.disconnect = util.promisify(function (callback) {
  return this.__cache.disconnect(callback);
});

module.exports = RedisLRUCache;
