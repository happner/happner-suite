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

  #transform(key) {
    if (!this.#opts?.keyTransformers) {
      return key;
    }
    let match;
    const transformerFound = this.#opts.keyTransformers.find((transformer) => {
      match = key.match(transformer.regex);
      return match !== null;
    });
    if (!transformerFound) {
      return key;
    }
    const transformedKey = transformerFound.transform
      ? transformerFound.transform(key)
      : match.groups.keyMask;
    return transformedKey;
  }

  get(key, opts = {}) {
    let transformedKey = this.#transform(key);
    let cached = this.getInternal(transformedKey, opts);
    if (cached == null) {
      this.#stats.misses++;
      if (opts.default) {
        this.set(transformedKey, opts.default.value, opts.default.opts, true);
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

  set(key, data, opts = {}, transformedAlready) {
    let transformedKey = transformedAlready ? key : this.#transform(key);
    const cacheItem = {
      data: opts.clone === false ? data : this.utils.clone(data),
      key: transformedKey,
      ttl: opts.ttl,
      noclone: opts.clone === false,
    };
    this.setInternal(transformedKey, cacheItem, opts);
    return cacheItem;
  }

  increment(key, by = 1, opts = {}) {
    let transformedKey = this.#transform(key);
    let currentValue = this.getInternal(transformedKey)?.data;
    if (typeof currentValue !== 'number') {
      currentValue = opts.initial || 0;
    }
    currentValue += by;
    this.set(transformedKey, currentValue, opts, true);
    return currentValue;
  }

  remove(key, opts) {
    let transformedKey = this.#transform(key);
    const existing = this.get(transformedKey, opts);
    if (existing) {
      this.removeInternal(transformedKey);
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
