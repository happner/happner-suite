const helper = require('../../lib/base-test-helper').create();
describe(helper.testName(), function () {
  it('can get nanoid', () => {
    const nanoid = helper.commons.nanoid();
    helper.expect(nanoid).to.exist;
  });
});
