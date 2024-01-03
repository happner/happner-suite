module.exports = class BaseConfigurator {
  constructor() {
    this.commons = require('happn-commons');
  }
  configure() {
    throw new Error('configure not implemented');
  }
};
