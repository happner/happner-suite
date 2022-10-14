/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const SystemConfigBuilder = require('../../../lib/builders/system-config-builder');

describe(helper.testName(), function () {
  it('builds a subscription config object', () => {
    const mockName = 'testName';

    const builder = new SystemConfigBuilder();
    const result = builder.withName(mockName).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.config.name).to.equal(mockName);
  });
});
