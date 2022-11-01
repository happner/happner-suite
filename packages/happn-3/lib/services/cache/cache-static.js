module.exports = class StaticCache extends require('./cache-base') {
  #cache;
  constructor(name, opts) {
    super(name, opts);
    this.#cache = {};
  }

  getInternal(key) {
    return this.#cache[key];
  }

  setInternal(key, data) {
    this.#cache[key] = data;
    if (typeof data.ttl === 'number' && data.ttl !== Infinity) {
      this.appendTimeout(key, data.ttl);
    }
  }

  removeInternal(key) {
    this.clearTimeout(key);
    delete this.#cache[key];
  }

  valuesInternal() {
    return Object.values(this.#cache).map((item) => item.data);
  }

  keysInternal() {
    return Object.keys(this.#cache);
  }

  hasInternal(key) {
    return this.#cache[key] != null;
  }

  clearInternal() {
    this.#cache = {};
  }
};
