declare const BaseBuilder: any;
export declare class SubscriptionConfigBuilder extends BaseBuilder {
    constructor();
    withAllowNestedPermissions(shouldAllow: boolean): SubscriptionConfigBuilder;
    withSubscriptionTreeSearchCacheSize(size: number): SubscriptionConfigBuilder;
    withSubscriptionTreePermutationCacheSize(size: number): SubscriptionConfigBuilder;
    withSubscriptionTreeTimeout(size: number): SubscriptionConfigBuilder;
    withSubscriptionTreeFilterFunc(func: Function): SubscriptionConfigBuilder;
}
export {};
