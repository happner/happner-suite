/* eslint-disable no-console */
import { SubscriptionConfigBuilder } from '../../../../lib/builders/happn/services/subscription-config-builder';
import { expect } from 'chai';

describe('subscription configuration builder tests', function () {
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

    expect(result.config.allowNestedPermissions).to.equal(mockAllowNestedPermissions);
    expect(result.config.subscriptionTree.filter).to.equal(mockFilterFunc);
    expect(result.config.subscriptionTree.permutationCache).to.equal(mockPermutationCacheSize);
    expect(result.config.subscriptionTree.searchCache).to.equal(mockSearchCacheSize);
    expect(result.config.subscriptionTree.timeout).to.equal(mockTimeout);
  });
});
