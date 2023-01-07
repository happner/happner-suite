const _ = require('..')._;
module.exports = function (obj, ignoreList) {
  if (obj == null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return _.cloneDeep(obj);
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (!Array.isArray(ignoreList) || ignoreList.length === 0) {
    return _.cloneDeep(obj);
  }
  return ignoreList.reduce((cloned, ignoreListItemPath) => {
    const val = _.get(obj, ignoreListItemPath);
    if (val != null) {
      return _.set(cloned, ignoreListItemPath, val);
    }
    return cloned;
  }, _.cloneDeep(_.omit(obj, ignoreList)));
};
