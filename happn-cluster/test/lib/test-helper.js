const BaseTestHelper = require('happn-commons-test');
class TestHelper extends BaseTestHelper {
  constructor() {
    super();
    this.package = require('../../package.json');
  }

  static create() {
    return new TestHelper();
  }

  static describe(options, handler) {
    return BaseTestHelper.extend(TestHelper).describe(options, handler);
  }
}

module.exports = TestHelper;
