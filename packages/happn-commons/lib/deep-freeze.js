module.exports = function deepFreeze(obj) {
  if (obj instanceof Map) {
    obj.clear =
      obj.delete =
      obj.set =
        function () {
          throw new Error('map is read-only');
        };
  } else if (obj instanceof Set) {
    obj.add =
      obj.clear =
      obj.delete =
        function () {
          throw new Error('set is read-only');
        };
  }

  // Freeze self
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((name) => {
    try {
      if (!obj) return;
      const prop = obj[name];
      const type = typeof prop;

      // Freeze prop if it is an object or function and also not already frozen
      if (prop != null && (type === 'object' || type === 'function') && !Object.isFrozen(prop)) {
        deepFreeze(prop);
      }
    } catch (e) {
      // tried our best
    }
  });

  return obj;
};
