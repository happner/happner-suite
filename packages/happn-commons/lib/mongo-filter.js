const sift = require('sift').default;
const clone = require('lodash').cloneDeep;
module.exports = (schema, items) => {
  let filterItems = clone(items);
  if (!Array.isArray(filterItems)) {
    filterItems = [filterItems];
  }
  let flattenedQuery = unflattenOperators(flatten(schema));
  let filtered = filterItems.filter(sift(flattenedQuery, filterItems));
  return filtered;
};

function unflattenOperators(query) {
  const unflattened = {};
  for (const key in query) {
    if (Array.isArray(query[key])) {
      unflattened[key] = query[key].map((item) => unflattenOperators(item));
      continue;
    }
    const keySplit = key.split('.');
    const lastKey = keySplit.pop();
    if (lastKey.startsWith('$')) {
      unflattened[keySplit.join('.')] = { [lastKey]: query[key] };
      continue;
    }
    unflattened[key] = query[key];
  }
  return unflattened;
}

function flatten(object) {
  const flattened = {};
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
