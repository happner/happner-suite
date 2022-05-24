const lt = require('long-timeout');
module.exports = class CacheBase extends require('events').EventEmitter {
  #stats = {
    hits: 0,
    misses: 0,
  };
  #timeouts = {};
  #name;
  #opts;
  constructor(name, opts) {
    super();
    if (typeof name !== 'string') throw new Error(`invalid name for cache: ${name}`);
    this.commons = require('happn-commons');
    this.utils = this.commons.utils;
    this.#name = name;
    this.#opts = opts;
  }

  get name() {
    return this.#name;
  }

  get opts() {
    return this.#opts;
  }

  get(key, opts = {}) {
    let cached = this.getInternal(key, opts);
    if (cached == null) {
      this.#stats.misses++;
      if (opts.default) {
        this.set(key, opts.default.value, opts.default.opts);
        cached = { data: opts.default.value, noclone: opts.default?.opts?.noclone };
      } else {
        return null;
      }
    } else {
      this.#stats.hits++;
    }

    // the item was stored with the noclone flag, and the clone option is not explicitly set to true
    if (cached.noclone && opts.clone !== true) {
      return cached.data;
    }
    return this.utils.clone(cached.data);
  }

  set(key, data, opts = {}) {
    const cacheItem = {
      data: opts.clone === false ? data : this.utils.clone(data),
      key: key,
      ttl: opts.ttl,
      noclone: opts.clone === false,
    };
    this.setInternal(key, cacheItem, opts);
    return cacheItem;
  }

  increment(key, by = 1, opts = {}) {
    let currentValue = this.getInternal(key)?.data;
    if (typeof currentValue !== 'number') {
      currentValue = opts.initial || 0;
    }
    currentValue += by;
    this.set(key, currentValue, opts);
    return currentValue;
  }

  remove(key, opts) {
    const existing = this.get(key, opts);
    if (existing) {
      this.removeInternal(key);
    }
    return existing;
  }

  size() {
    if (typeof this.sizeInternal === 'function') {
      return this.sizeInternal();
    }
    return this.keys().length;
  }

  has(key) {
    return this.hasInternal(key);
  }

  keys() {
    return this.keysInternal();
  }

  values() {
    return this.valuesInternal();
  }

  all(filter) {
    let all = this.values();
    if (!filter) return all;
    return this.commons.mongoFilter(
      {
        $and: [filter],
      },
      all
    );
  }

  clear() {
    const cleared = this.clearInternal();
    this.stop();
    return cleared;
  }

  stats() {
    console.log(`size of ${this.#name}: ${this.size()}`);
    return this.utils.clone(this.commons._.merge(this.#stats, { size: this.size() }));
  }

  stop() {
    Object.keys(this.#timeouts).forEach((key) => {
      this.clearTimeout(key);
    });
  }

  clearTimeout(key) {
    if (!this.#timeouts[key]) return;
    lt.clearTimeout(this.#timeouts[key]);
    delete this.#timeouts[key];
  }

  appendTimeout(key, ttl) {
    this.clearTimeout(key);
    this.#timeouts[key] = lt.setTimeout(() => {
      this.remove(key);
    }, ttl);
  }

  createCacheItem(key, data, opts = {}) {
    return {
      data: opts.clone === false ? data : this.utils.clone(data),
      key,
      ttl: opts.ttl,
      noclone: opts.clone === false,
    };
  }
};
