const sift = require('sift').default;
module.exports = (schema, items) => {
  let filterItems = items;
  if (!Array.isArray(filterItems)) {
    filterItems = [filterItems];
  }
  return filterItems.filter(sift(schema, filterItems));
};
