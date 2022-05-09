module.exports = class LRUCache extends require('./cache-base') {
  #cache;
  constructor(opts) {
    super();
    if (opts == null) opts = {};
    if (!opts.max) opts.max = 1e3;
    this.#cache = new this.commons.lruCache(opts);
  }

  getInternal(key, opts) {
    return this.#cache.get(key, opts);
  }

  setInternal(key, data, opts) {
    this.#cache.set(key, data, opts);
  }

  removeInternal(key) {
    this.#cache.delete(key);
  }

  valuesInternal() {
    return this.#cache.values();
  }
  
  keysInternal() {
    return Array.from(this.#cache.keyMap.keys());
  }
  
  sizeInternal() {
    return this.#cache.size
  }

  hasInternal(key) {
    return this.#cache.has(key);
  }

  clearInternal() {
    this.#cache.clear();
  }

  allInternal() {
    return this.#cache.valList.slice(0, this.#cache.size).map((value) => value.data );
  }
}
