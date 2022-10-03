const BaseBuilder = require('happn-commons/lib/base-builder');
module.exports = class SubscriptionConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  /*
  "subscription:{
  allowNestedPermissions:[bool],
  subscriptionTree:{
    searchCache:[int],
    permutationCache:[int],
    timeout:[bool],
    filter:()=>{}
  }
}"
   */

  withAllowNestedPermissions(shouldAllow) {
    this.set('allowNestedPermissions', shouldAllow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withSubscriptionTreeSearchCacheSize(size) {
    this.set('subscriptionTree.searchCache', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreePermutationCacheSize(size) {
    this.set('subscriptionTree.permutationCache', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreeTimeout(size) {
    this.set('subscriptionTree.timeout', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreeFilterFunc(func) {
    this.set('subscriptionTree.filter', func, BaseBuilder.Types.FUNCTION);
    return this;
  }
};
