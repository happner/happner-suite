module.exports = LRUCache;

var EventEmitter = require('events').EventEmitter;
const commons = require('happn-commons');
const LRU = commons.lruCache;
const util = commons.utils;

LRUCache.prototype.setSync = setSync;
LRUCache.prototype.getSync = getSync;
LRUCache.prototype.removeSync = removeSync;

LRUCache.prototype.values = values;
LRUCache.prototype.keys = keys;

LRUCache.prototype.set = util.maybePromisify(set);
LRUCache.prototype.has = has;
LRUCache.prototype.get = util.maybePromisify(get);
LRUCache.prototype.increment = util.maybePromisify(increment);
LRUCache.prototype.update = util.maybePromisify(update);
LRUCache.prototype.remove = util.maybePromisify(remove);
LRUCache.prototype.clear = util.maybePromisify(clear);
LRUCache.prototype.all = util.maybePromisify(all);
LRUCache.prototype.stop = stop;
LRUCache.prototype.on = on;
LRUCache.prototype.off = off;

LRUCache.prototype.__emit = __emit;
LRUCache.prototype.__tryCallback = __tryCallback;
LRUCache.prototype.__all = _all;
LRUCache.prototype.size = size;

function LRUCache(opts) {
  if (opts == null) opts = {};

  if (!opts.max) opts.max = 1000;

  this.__cache = new LRU(opts);
  this.__eventEmitter = new EventEmitter();
}

function setSync(key, data, opts) {
  if (!opts) opts = {};

  var cacheItem = {
    data: opts.clone === false ? data : this.utilities.clone(data),
    key: key,
    ttl: opts.ttl,
    noclone: opts.clone === false,
  };

  this.__cache.set(key, cacheItem, opts);
  return cacheItem;
}

function getSync(key, opts) {
  if (this.__cache.has(key)) {
    if (!opts) opts = {};
    var explicitClone = opts.clone === true; //explicitly clone result, even if it was set with clone:false
    var cached = this.__cache.get(key);
    if (cached.noclone && !explicitClone) return cached.data;
    return this.utilities.clone(cached.data);
  }

  return null;
}

function set(key, data, opts, callback) {
  if (key == null || key === undefined) return callback(new Error('invalid key'));

  if (typeof opts === 'function') {
    callback = opts;
    opts = null;
  }
  let cacheItem;
  try {
    cacheItem = this.setSync(key, data, opts);
  } catch (e) {
    return callback(e);
  }
  callback(null, cacheItem);
}

function get(key, opts, callback) {
  if (key == null || key === undefined) return this.__tryCallback(callback, null, null);

  if (typeof opts === 'function') {
    callback = opts;
    opts = null;
  }

  if (!opts) opts = {};
  let found;
  try {
    found = this.getSync(key, opts);
  } catch (e) {
    return this.__tryCallback(callback, null, e);
  }
  if (found != null) {
    return this.__tryCallback(callback, found);
  }

  if (opts.retrieveMethod) {
    return opts.retrieveMethod.call(opts.retrieveMethod, (e, result) => {
      if (e) return callback(e);
      // -1 and 0 are perfectly viable things to cache
      if (result == null) return this.__tryCallback(callback, null, null);
      this.set(key, result, opts, (e) => {
        return this.__tryCallback(callback, result, e, opts.clone);
      });
    });
  }

  if (opts.default) {
    var value = opts.default.value;
    delete opts.default.value;
    return this.set(key, value, opts.default, (e) => {
      return this.__tryCallback(callback, value, e, opts.clone);
    });
  }

  return this.__tryCallback(callback, null, null);
}

function values() {
  return this.__cache.values();
}

function keys() {
  return Array.from(this.__cache.keyMap.keys());
}

function size() {
  return this.__cache.size
}

function increment(key, by, callback) {
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
}

function update(key, data, callback) {
  try {
    var result = this.__cache.get(key);
    if (result != null && result !== undefined) {
      result.data = data;
      this.__cache.set(key, result, { ttl: result.ttl });
      this.__tryCallback(callback, this.__cache.get(key), null);
    } else this.__tryCallback(callback, null, null);
  } catch (e) {
    return this.__tryCallback(callback, null, e);
  }
}

function has(key) {
  return this.__cache.has(key);
}

function removeSync(key) {
  if (key == null || key === undefined) throw new Error('invalid key');
  var existing = this.__cache.get(key);
  this.__cache.delete(key);
  return existing;
}

function remove(key, opts, callback) {
  if (key == null || key === undefined) return callback(new Error('invalid key'));

  if (typeof opts === 'function') {
    callback = opts;
    opts = null;
  }

  var existed = this.__cache.get(key);
  var removed = existed != null && existed !== undefined;
  this.__cache.delete(key);
  callback(null, removed);
}

function stop() {
  //do nothing
}

function clear(callback) {
  if (this.__cache) this.__cache.clear();
  if (callback) callback();
}

function all(filter, callback) {
  try {
    if (typeof filter === 'function') {
      callback = filter;
      filter = null;
    }

    try {
      if (filter)
        return callback(
          null,
          commons.mongoFilter(
            {
              $and: [filter],
            },
            this.__all()
          )
        );
      else return callback(null, this.__all());
    } catch (e) {
      return callback(e);
    }
  } catch (e) {
    callback(e);
  }
}

function on(key, handler) {
  return this.__eventEmitter.on(key, handler);
}

function off(key, handler) {
  return this.__eventEmitter.removeListener(key, handler);
}

function __emit(key, data) {
  return this.__eventEmitter.emit(key, data);
}

function __tryCallback(callback, data, e, clone) {
  var callbackData = data;

  if (data && clone) callbackData = this.utilities.clone(data);

  if (e) {
    if (callback) return callback(e);
    else throw e;
  }

  if (callback) callback(null, callbackData);
  else return callbackData;
}

function _all() {
  return this.__cache.valList.slice(0, this.__cache.size).map(function (value) {
    //dont clone as these may not be POJOS, and may hold volatile state
    return value.data;
  });
}
