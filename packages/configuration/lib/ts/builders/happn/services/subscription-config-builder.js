"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class SubscriptionConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
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
}
exports.SubscriptionConfigBuilder = SubscriptionConfigBuilder;
