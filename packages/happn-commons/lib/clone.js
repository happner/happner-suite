const commons = require('..');
module.exports = function (obj) {
  if (obj == null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return commons._.cloneDeep(obj);
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  return Object.keys(commons.flat(obj))
    .map((key) => {
      return [key, commons._.get(obj, key)];
    })
    .reduce((cloned, keyVal) => {
      return commons._.set(
        cloned,
        keyVal[0],
        keyVal[1] instanceof commons.directives.NotCloneable
          ? keyVal[1]
          : commons._.cloneDeep(keyVal[1])
      );
    }, {});
};
