module.exports = class BaseDataProvider extends require('events').EventEmitter {
  constructor(settings, logger) {
    super();
    this.settings = settings || {};
    this.logger = logger;
  }
  transform(document) {
    return {
      data: document.data,
      _meta: {
        path: document.path,
        created: document.created,
        modified: document.modified,
        modifiedBy: document.modifiedBy
      }
    };
  }
  getMeta(document) {
    return {
      created: document.created,
      modified: document.modified,
      modifiedBy: document.modifiedBy,
      path: document.path
    };
  }
  addCriteria(pathObject, criteria) {
    return { $and: [pathObject, criteria] };
  }
  getPathCriteria(path) {
    if (path.indexOf('*') === -1) {
      return { path };
    }
    return {
      path: { $regex: '^' + this.escapeRegex(this.preparePath(path)).replace(/\\\*/g, '.*') + '$' }
    };
  }
  preparePath(path) {
    return path.replace(/(\*)\1+/g, '$1');
  }
  escapeRegex(str) {
    if (typeof str !== 'string') throw new TypeError('Expected a string');
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  }
};
