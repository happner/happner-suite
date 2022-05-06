module.exports = class LRUCache extends require('./cache-base') {
  #cache;
  constructor(opts) {
    super();
    if (opts == null) opts = {};
    if (!opts.max) opts.max = 1e3;
    this.#cache = new this.commons.lruCache(opts);
  }

  getInternal(key, opts) {
    if (!opts) opts = {};
    var explicitClone = opts.clone === true; //explicitly clone result, even if it was set with clone:false
    var cached = this.#cache.get(key);
    if (cached.noclone && !explicitClone) return cached.data;
    return this.utils.clone(cached.data);
  }

  setInternal(key, data, opts) {
    if (!opts) opts = {};
    const cacheItem = {
      data: opts.clone === false ? data : this.utils.clone(data),
      key: key,
      ttl: opts.ttl,
      noclone: opts.clone === false,
    };
    this.#cache.set(key, cacheItem, opts);
    return cacheItem;
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
