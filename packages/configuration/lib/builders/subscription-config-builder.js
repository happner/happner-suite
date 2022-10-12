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
    this.set('config.allowNestedPermissions', shouldAllow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withSubscriptionTreeSearchCacheSize(size) {
    this.set('config.subscriptionTree.searchCache', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreePermutationCacheSize(size) {
    this.set('config.subscriptionTree.permutationCache', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreeTimeout(size) {
    this.set('config.subscriptionTree.timeout', size, BaseBuilder.Types.INTEGER);
    return this;
  }

  withSubscriptionTreeFilterFunc(func) {
    this.set('config.subscriptionTree.filter', func, BaseBuilder.Types.FUNCTION);
    return this;
  }
};
