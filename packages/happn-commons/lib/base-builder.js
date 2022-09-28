const _ = require('lodash');
module.exports = class BaseBuilder {
  constructor(options) {
    this.options = options;
    this.__data = {};
    this.__typeKeys = Object.keys(BaseBuilder.Types);
  }

  static get Types() {
    return {
      STRING: 0,
      NUMERIC: 1,
      OBJECT: 2,
      DATE: 3,
      INTEGER: 4,
      ARRAY: 5,
      BOOLEAN: 6,
      FUNCTION: 7,
    };
  }

  buildValue(prop) {
    if (prop == null) return prop;
    if (Array.isArray(prop))
      return prop.map((value) => {
        return this.buildValue(value);
      });
    if (typeof prop === 'function') return prop;
    return typeof prop.build === 'function' ? prop.build() : prop;
  }

  build() {
    const fieldNames = Object.keys(this.__data);
    if (this.__required) this.checkRequired();
    return fieldNames.reduce((json, key) => {
      return _.set(json, key, this.buildValue(this.__data[key]));
    }, {});
  }

  push(fieldName, value, type, max) {
    if (type != null) this.checkType(value, type, fieldName);
    if (!Array.isArray(this.__data[fieldName])) this.__data[fieldName] = [];
    if (this.__data[fieldName].length === max)
      throw new Error(`maximum allowed items for field[${fieldName}]`);
    this.__data[fieldName].push(value);
    return this;
  }

  set(fieldName, value, type) {
    if (type != null) this.checkType(value, type, fieldName);
    this.__data[fieldName] = value;
    return this;
  }

  required(arrPropertyNames) {
    if (!Array.isArray(arrPropertyNames))
      throw new Error(`argument [arrPropertyNames] at position 0 must be a string array`);
    this.__required = arrPropertyNames;
  }

  checkRequired() {
    for (let fieldName of this.__required) {
      if (_.get(this.__data, fieldName) == null)
        throw new Error(`required field [${fieldName}] cannot be null`);
    }
  }

  checkType(value, type, fieldName) {
    const typeName = this.__typeKeys.find((typeKey) => {
      return BaseBuilder.Types[typeKey] === type;
    });
    if (!typeName) throw new Error(`unknown type [${type}] specified for field [${fieldName}]`);
    const errMsg = `[${fieldName}] must be of type [${typeName}]`;
    switch (type) {
      case BaseBuilder.Types.ARRAY:
        if (!Array.isArray(value)) throw new Error(errMsg);
        break;
      case BaseBuilder.Types.OBJECT:
        if (typeof value !== 'object') throw new Error(errMsg);
        break;
      case BaseBuilder.Types.STRING:
        if (typeof value !== 'string') throw new Error(errMsg);
        break;
      case BaseBuilder.Types.NUMERIC:
        if (typeof this.tryParseFloat(value) !== 'number') throw new Error(errMsg);
        break;
      case BaseBuilder.Types.NUMBER:
        if (!Number.isInteger(this.tryParseFloat(value))) throw new Error(errMsg);
        break;
      case BaseBuilder.Types.DATE:
        if (!this.tryParseDate(value)) throw new Error(errMsg);
        break;
      case BaseBuilder.Types.BOOLEAN:
        if (value !== true && value !== false) throw new Error(errMsg);
        break;
      case BaseBuilder.Types.FUNCTION:
        if (typeof value !== 'function') throw new Error(errMsg);
        break;
      default:
        break;
    }
  }

  tryParseFloat(value) {
    try {
      return parseFloat(value);
    } catch (e) {
      return value;
    }
  }

  tryParseDate(value) {
    try {
      return new Date(value);
    } catch (e) {
      return false;
    }
  }
};
