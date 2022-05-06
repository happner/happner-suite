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

  get(key, opts) {
    if (!this.has(key)) {
      this.#stats.misses++;
      return null;
    }
    this.#stats.hits++;
    return this.getInternal(key, opts);
  }

  set(key, data, opts) {
    return this.setInternal(key, data, opts);
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
