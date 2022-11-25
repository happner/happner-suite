const { Op } = require('sequelize');

const opList = new Map([
  ['$eq', Op.eq],
  ['$lt', Op.lt],
  ['$gt', Op.gt],
  ['$lte', Op.lte],
  ['$gte', Op.gte],
  ['$eq', Op.eq],
  ['$in', Op.in],
  ['$nin', Op.notIn],
  ['$ne', Op.ne],
  ['$like', Op.like],
]);

const arrayExpectantOpList = new Set(['$nin', '$in']);

class SqlizeQueryBuilder {
  static build(delimiter, query) {
    const sqb = new SqlizeQueryBuilder();
    sqb.#delimiter = delimiter;
    return sqb.#buildQuery(query);
  }

  #delimiter;

  #flatten(query, prefix = '') {
    return Object.keys(query).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (
        typeof query[k] === 'object' &&
        Object.prototype.toString.call(query[k]) !== '[object RegExp]'
      )
        Object.assign(acc, this.#flatten(query[k], pre + k));
      else acc[pre + k] = query[k];
      return acc;
    }, {});
  }

  #buildQuery(rawQuery) {
    const flatQuery = this.#flatten(rawQuery);

    let query = {};
    for (const objectKey of Object.keys(flatQuery)) {
      const splitKey = objectKey.split('.');

      if (['$and', '$or'].includes(splitKey[0])) {
        this.#handleAndOr(splitKey, flatQuery[objectKey], query);
        continue;
      }

      this.#handleKey(splitKey, flatQuery[objectKey], query);
    }

    return query;
  }

  #handleAndOr(splitKey, value, query) {
    const op = splitKey.at(0) === '$and' ? Op.and : Op.or;
    const position = parseInt(splitKey.at(1));
    const key = splitKey.slice(2);
    if (!query[op]) {
      query[op] = [];
    }

    if (!query[op].at(position)) {
      query[op].push({});
    }

    this.#handleKey(key, value, query[op].at(position));

    return query;
  }

  #handleKey(dataKey, value, query) {
    const { op, key } = this.#parseKey(dataKey);

    if (op && opList.has(op)) {
      let q = query[key.join(this.#delimiter)];
      if (!q) {
        q = query[key.join(this.#delimiter)] = {};
      }

      if (arrayExpectantOpList.has(op)) {
        if (!q[opList.get(op)]) {
          q[opList.get(op)] = [];
        }

        query[key.join(this.#delimiter)][opList.get(op)].push(value);
      } else {
        query[key.join(this.#delimiter)] = {
          [opList.get(op)]: value,
        };
      }
    } else {
      query[key.join(this.#delimiter)] = value;
    }
  }

  #parseKey(key) {
    if (key.at(-1).startsWith('$')) {
      return {
        op: key.at(-1),
        key: key.slice(0, -1),
      };
    }

    if (key.at(-2).startsWith('$') && !isNaN(key.at(-1))) {
      return {
        op: key.at(-2),
        key: key.slice(0, -2),
      };
    }

    return {
      key,
    };
  }
}

module.exports = SqlizeQueryBuilder;
