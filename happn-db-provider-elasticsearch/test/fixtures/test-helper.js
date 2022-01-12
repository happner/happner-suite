require('custom-env').env('test');
const commons = require('happn-commons');
const BaseTestHelper = require('happn-commons-test');
class TestHelper extends BaseTestHelper {
  constructor() {
    super();
    this.package = require('../../../package.json');
    this.utils = commons.utils;
    this.async = commons.async;
  }

  static create() {
    return new TestHelper();
  }

  static describe(options, handler) {
    return BaseTestHelper.extend(TestHelper).describe(options, handler);
  }

  getEndpoint() {
    return process.env.ENDPOINT || 'http://localhost:9200';
  }
}

module.exports = TestHelper;
