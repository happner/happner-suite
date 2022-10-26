const { add } = require('lodash');

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
        modifiedBy: document.modifiedBy,
      },
    };
  }
  transformAll(items, fields) {
    return items.map((item) => {
      return this.transform(item, null, fields);
    });
  }
  getMeta(document, pathKey = 'path') {
    return {
      created: document.created,
      modified: document.modified,
      modifiedBy: document.modifiedBy,
      path: document[pathKey],
    };
  }
  addCriteria(pathObject, criteria) {
    return { $and: [pathObject, criteria] };
  }
  getPathCriteria(path, pathKey = 'path', additionalCriteria) {
    if (path.indexOf('*') === -1) {
      return { [pathKey]: path };
    }
    const pathCriteria = {
      [pathKey]: {
        $regex: new RegExp(
          '^' + this.escapeRegex(this.preparePath(path)).replace(/\\\*/g, '.*') + '$'
        ),
      },
    };
    if (additionalCriteria != null) {
      return this.addCriteria(pathCriteria, additionalCriteria);
    }
    return pathCriteria;
  }
  preparePath(path) {
    return path.replace(/(\*)\1+/g, '$1');
  }
  escapeRegex(str) {
    if (typeof str !== 'string') throw new TypeError('Expected a string');
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  }
};
