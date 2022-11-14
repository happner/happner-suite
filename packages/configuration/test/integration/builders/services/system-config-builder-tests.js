/* eslint-disable no-console */
const { SystemConfigBuilder } = require('../../../../lib/ts/builders/happn/services/system-config-builder');
const helper = require('happn-commons-test/lib/base-test-helper').create();

describe(helper.testName(), function () {
  it('builds a subscription config object', () => {
    const mockName = 'testName';

    const builder = new SystemConfigBuilder();
    const result = builder.withName(mockName).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.config.name).to.equal(mockName);
  });
});
