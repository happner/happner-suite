/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const SubscriptionConfigBuilder = require('../../../lib/builders/subscription-config-builder');

describe(helper.testName(), function () {
  it('builds a subscription config object', () => {
    const mockAllowNestedPermissions = true;
    const mockFilterFunc = () => {};
    const mockPermutationCacheSize = 5000;
    const mockSearchCacheSize = 10000;
    const mockTimeout = 20000;

    const builder = new SubscriptionConfigBuilder();
    const result = builder
      .withAllowNestedPermissions(mockAllowNestedPermissions)
      .withSubscriptionTreeFilterFunc(mockFilterFunc)
      .withSubscriptionTreePermutationCacheSize(mockPermutationCacheSize)
      .withSubscriptionTreeSearchCacheSize(mockSearchCacheSize)
      .withSubscriptionTreeTimeout(mockTimeout)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.config.allowNestedPermissions).to.equal(mockAllowNestedPermissions);
    helper.expect(result.config.subscriptionTree.filter).to.equal(mockFilterFunc);
    helper.expect(result.config.subscriptionTree.permutationCache).to.equal(mockPermutationCacheSize);
    helper.expect(result.config.subscriptionTree.searchCache).to.equal(mockSearchCacheSize);
    helper.expect(result.config.subscriptionTree.timeout).to.equal(mockTimeout);
  });
});
