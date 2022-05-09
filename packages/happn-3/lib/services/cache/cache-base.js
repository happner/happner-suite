module.exports = class CacheBase extends require('events').EventEmitter {
  #stats = {
    hits: 0,
    misses: 0,
  };
  constructor() {
    super();
    this.commons = require('happn-commons');
    this.utils = this.commons.utils;
  }

  get(key, opts = {}) {
    let cached = this.getInternal(key, opts);
    if (cached == null) {
      this.#stats.misses++;
      if (opts.default) {
        this.set(key, opts.default.value, opts.default.opts);
        cached = { data: opts.default.value, noclone: opts?.default?.opts?.noclone};
      } else {
        return null;
      }
    } else {
      this.#stats.hits++;
    }
    //explicitly clone result, even if it was set with clone:false
    if (cached.noclone && opts.clone === false) {
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
    let currentValue = this.get(key);
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
    const all = this.allInternal();
    if (!filter) return all;
    return commons.mongoFilter(
      {
        $and: [filter],
      },
      all
    );
  }

  clear() {
    return this.clearInternal();
  }

  stats() {
    return this.utils.clone(this.commons._.merge(this.#stats, { size: this.size() }));
  }

  stop() {
    if (this.stopInternal) return this.stopInternal();
  }
};
