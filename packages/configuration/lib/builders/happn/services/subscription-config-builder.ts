const BaseBuilder = require('happn-commons/lib/base-builder');

export class SubscriptionConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withAllowNestedPermissions(shouldAllow: boolean): SubscriptionConfigBuilder {
    this.set('config.allowNestedPermissions', shouldAllow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withSubscriptionTreeSearchCacheSize(size: number): SubscriptionConfigBuilder {
    this.set('config.subscriptionTree.searchCache', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreePermutationCacheSize(size: number): SubscriptionConfigBuilder {
    this.set('config.subscriptionTree.permutationCache', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreeTimeout(size: number): SubscriptionConfigBuilder {
    this.set('config.subscriptionTree.timeout', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreeFilterFunc(func: Function): SubscriptionConfigBuilder {
    this.set('config.subscriptionTree.filter', func, BaseBuilder.Types.FUNCTION);
    return this;
  }
}
