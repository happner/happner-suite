module.exports = class CachePersist extends require('./cache-static') {
  #synced = false;
  #syncing = false;
  #dataStore;
  #basePath;
  constructor(name, opts) {
    super(name, opts);
    this.get = this.utils.maybePromisify(this.get);
    this.set = this.utils.maybePromisify(this.set);
    this.increment = this.utils.maybePromisify(this.increment);
    this.remove = this.utils.maybePromisify(this.remove);
    this.clear = this.utils.maybePromisify(this.clear);
    this.sync = this.utils.maybePromisify(this.sync);
    this.#basePath = `/_SYSTEM/_CACHE/${opts.key_prefix || 'default'}`;
    if (!opts.dataStore) {
      throw new Error(`no dataStore defined for persisted cache on path: ${this.#basePath}`);
    }
    this.#dataStore = opts.dataStore;
  }

  get isSynced() {
    return this.#synced;
  }

  get isSyncing() {
    return this.#syncing;
  }

  get(key, opts = {}, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!this.#checkSynced(callback)) {
      return;
    }
    let found = super.get(key, this.commons._.omit(opts, 'default'));
    if (found != null) {
      return callback(null, found);
    }
    if (opts.default == null) {
      return callback(null, null);
    }
    this.set(key, opts.default.value, opts.default.opts, (e, item) => {
      if (e) return callback(e);
      if (item.noclone && opts.clone === false) {
        return callback(null, item.data);
      }
      return callback(null, this.utils.clone(item.data));
    });
  }

  set(key, data, opts = {}, transformedAlready, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (typeof transformedAlready === 'function') {
      callback = transformedAlready;
      transformedAlready = false;
    }

    if (!this.#syncing && !this.#checkSynced(callback)) {
      return;
    }

    if (!opts) opts = {};
    if (!opts.ttl) opts.ttl = this.opts.defaultTTL;
    if (opts.noPersist) {
      const result = super.set(key, data, opts, transformedAlready);
      return callback(null, result);
    }

    this.#persistData(key, this.createCacheItem(key, data, opts), (e) => {
      if (e) return callback(e);
      const result = super.set(key, data, opts, transformedAlready);
      callback(null, result);
    });
  }

  increment(key, by = 1, opts = {}, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (typeof by === 'function') {
      callback = by;
      opts = {};
      by = 1;
    }
    if (!this.#checkSynced(callback)) {
      return;
    }
    const incremented = super.increment(key, by, opts);
    this.#persistData(key, this.createCacheItem(key, incremented, opts), (e) => {
      if (e) return callback(e);
      callback(null, incremented);
    });
  }

  remove(key, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    // ttl remove wont pass in a callback
    callback =
      callback ||
      function (e) {
        //system must break here
        throw e;
      };
    if (!this.#checkSynced(callback)) {
      return;
    }
    const existing = this.get(key);
    if (!existing) {
      return callback(null, null);
    }
    if (opts.noPersist) {
      super.removeInternal(key);
      return callback(null, existing);
    }
    this.#removeData(key, (e) => {
      if (e) return callback(e);
      super.removeInternal(key);
      callback(null, existing);
    });
  }

  clear(callback) {
    if (!this.#checkSynced(callback)) {
      return;
    }
    this.#removeData('*', (e) => {
      if (e) return callback(e);
      super.clearInternal();
      callback();
    });
  }

  sync(callback) {
    this.#syncing = true;
    this.#dataStore.get(`${this.#basePath}/*`, (e, items) => {
      if (e) {
        this.#syncing = false;
        return callback(e);
      }

      if (!items || items.length === 0) {
        this.#synced = true;
        this.#syncing = false;
        return callback(null);
      }

      this.commons.async.eachSeries(
        items,
        (item, itemCB) => {
          if (item.data.ttl > 0) {
            if (Date.now() - item._meta.modified > item.data.ttl) {
              return this.#removeData(item.data.key, itemCB);
            }
          }
          this.set(
            item.data.key,
            item.data.data,
            {
              ttl: item.data.ttl,
              noPersist: true,
            },
            itemCB
          );
        },
        (e) => {
          this.#syncing = false;
          if (e) return callback(e);
          this.#synced = true;
          callback();
        }
      );
    });
  }

  #removeData(key, callback) {
    this.#dataStore.remove(`${this.#basePath}/${key}`, callback);
  }

  #persistData(key, data, callback) {
    this.#dataStore.upsert(
      `${this.#basePath}/${key}`,
      data,
      {
        merge: true,
      },
      callback
    );
  }

  #checkSynced(callback) {
    if (!this.#synced) {
      const unsyncedError = new Error(
        `attempt to operate on unsynced persisted cache on path: ${this.#basePath}`
      );
      if (typeof callback !== 'function') {
        throw unsyncedError;
      }
      callback(unsyncedError);
      return false; // indicates that the callback was called with an error, so don't continue in caller
    }
    return true;
  }
};
