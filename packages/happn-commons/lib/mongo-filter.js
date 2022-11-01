const sift = require('sift').default;
module.exports = (schema, items) => {
  let filterItems = Array.isArray(items) ? items : [items];
  return filterItems.filter(sift(unflattenOperators(flatten(schema)), filterItems));
};

function unflattenOperators(query) {
  const unflattened = {};
  if (typeof query !== 'object' || query == null) {
    return query;
  }
  for (const key in query) {
    let value = Array.isArray(query[key])
      ? query[key].map((item) => unflattenOperators(item))
      : query[key];

    if (key.indexOf('.') > -1 && key.indexOf('$') > -1) {
      let keySplit = key.split('.');
      let lastKey = keySplit.pop();
      if (lastKey.startsWith('$')) {
        if (unflattened[keySplit.join('.')] == null) {
          unflattened[keySplit.join('.')] = {};
        }
        unflattened[keySplit.join('.')][lastKey] = value;
        continue;
      }
    }
    unflattened[key] = value;
  }
  return unflattened;
}

function flatten(object) {
  const flattened = {};
  if (typeof object !== 'object' || object == null) {
    return object;
  }
  for (const key in object) {
    if (!Object.hasOwnProperty.call(object, key)) {
      continue;
    }
    if (Array.isArray(object[key])) {
      flattened[key] = object[key].map((item) => flatten(item));
      continue;
    }
    if (key.startsWith('$')) {
      flattened[key] = object[key];
      continue;
    }
    if (typeof object[key] === 'object' && object[key] !== null) {
      const flatObject = flatten(object[key]);
      for (const flatObjectKey in flatObject) {
        if (!Object.hasOwnProperty.call(flatObject, flatObjectKey)) {
          continue;
        }
        flattened[key + '.' + flatObjectKey] = flatObject[flatObjectKey];
      }
    } else {
      flattened[key] = object[key];
    }
  }

  return flattened;
}
