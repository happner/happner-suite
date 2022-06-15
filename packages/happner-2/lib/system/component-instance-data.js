module.exports = class SecureMeshData {
  #meshData;
  #componentName;
  #persistedPath;
  #origin;
  constructor(meshData, componentName, origin) {
    this.#meshData = meshData;
    this.#componentName = componentName;
    this.#persistedPath = '/_data/' + this.#componentName;
    this.#origin = origin;
  }
  static create(meshData, componentName, origin) {
    return new SecureMeshData(meshData, componentName, origin);
  }
  noConnection() {
    return [1, 6].indexOf(this.#meshData.status) === -1;
  }
  #connectionValid(path, action, callback) {
    if (this.noConnection()) {
      callback(
        new Error(
          `client state not active or connected, action: ${action}, path: ${path}, component: ${
            this.#componentName
          }`
        )
      );
      return false;
    }
    return true;
  }
  #getPath(path) {
    if (typeof path !== 'string' || path.length === 0) {
      return `[bad path]:${path}`;
    }
    if (path[0] !== '/') path = '/' + path;
    return this.#persistedPath + path;
  }

  on(path, options, handler, callback) {
    if (typeof options === 'function') {
      callback = handler;
      handler = options;
      options = {};
    }

    if (!options) options = {};
    if (this.#origin) options.onBehalfOf = this.#origin.username;

    if (!this.#connectionValid(path, 'on', callback)) {
      return;
    }

    let componentPath;
    if (path === '*') path = '**';
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    this.#meshData.on(componentPath, options, handler, callback);
  }

  off(listenerRef, callback) {
    if (!this.#connectionValid(listenerRef, 'off', callback)) {
      return;
    }
    if (typeof listenerRef === 'number') {
      return this.#meshData.off(listenerRef, callback);
    }
    let componentPath;
    if ((componentPath = this.#getPath(listenerRef)) === `bad path: ${listenerRef}`) {
      return callback(new Error(componentPath));
    }
    this.#meshData.off(componentPath, callback);
  }

  offAll(callback) {
    if (!this.#connectionValid('*', 'offAll', callback)) {
      return;
    }
    //we cannot do a true offAll, otherwise we get no message back
    this.#meshData.offPath(this.#getPath('*'), callback);
  }

  offPath(path, callback) {
    if (!this.#connectionValid(path, 'offPath', callback)) {
      return;
    }
    let componentPath;
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    this.#meshData.offPath(componentPath, callback);
  }

  get(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (!this.#connectionValid(path, 'get', callback)) {
      return;
    }

    if (!options) options = {};
    if (this.#origin) options.onBehalfOf = this.#origin.username;

    let componentPath;
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    return this.#meshData.get(componentPath, options, callback);
  }

  count(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (!this.#connectionValid(path, 'count', callback)) {
      return;
    }
    if (!options) options = {};
    if (this.#origin) options.onBehalfOf = this.#origin.username;
    let componentPath;
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    return this.#meshData.count(componentPath, options, callback);
  }

  getPaths(path, callback) {
    if (!this.#connectionValid(path, 'getPaths', callback)) {
      return;
    }
    let options = {};
    if (this.#origin) options.onBehalfOf = this.#origin.username;
    let componentPath;
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    return this.#meshData.getPaths(componentPath, options, callback);
  }

  set(path, data, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (!this.#connectionValid(path, 'set', callback)) {
      return;
    }

    if (!options) options = {};
    if (this.#origin) options.onBehalfOf = this.#origin.username;

    let componentPath;
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    return this.#meshData.set(componentPath, data, options, callback);
  }

  increment(path, gauge, increment, callback) {
    if (typeof increment === 'function') {
      callback = increment;
      increment = gauge;
      gauge = 'counter';
    }

    if (typeof gauge === 'function') {
      callback = gauge;
      increment = 1;
      gauge = 'counter';
    }

    if (!this.#connectionValid(path, 'increment', callback)) {
      return;
    }
    let options = {};
    if (this.#origin) options.onBehalfOf = this.#origin.username;
    let componentPath;
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    return this.#meshData.increment(componentPath, gauge, increment, options, callback);
  }

  remove(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (!this.#connectionValid(path, 'remove', callback)) {
      return;
    }
    if (!options) options = {};
    if (this.#origin) options.onBehalfOf = this.#origin.username;
    let componentPath;
    if ((componentPath = this.#getPath(path)) === `bad path: ${path}`) {
      return callback(new Error(componentPath));
    }
    return this.#meshData.remove(componentPath, options, callback);
  }
};
