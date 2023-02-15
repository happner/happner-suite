declare const BaseBuilder: any;
export declare class CacheConfigBuilder extends BaseBuilder {
    constructor();
    withStatisticsInterval(interval: number): CacheConfigBuilder;
    withStatisticsCheckoutPointCacheAuthOverride(max: number, maxAge: number): CacheConfigBuilder;
    withStatisticsCheckoutPointCacheAuthTokenOverride(max: number, maxAge: number): CacheConfigBuilder;
    withStatisticsCacheSecurityGroupsOverride(max: number, maxAge: number): CacheConfigBuilder;
    withStatisticsCacheSecurityUsersOverride(max: number, maxAge: number): CacheConfigBuilder;
    withStatisticsCacheSecurityGroupPermissionsOverride(max: number, maxAge: number): CacheConfigBuilder;
    withStatisticsCacheSecurityUserPermissionsOverride(max: number, maxAge: number): CacheConfigBuilder;
    withStatisticsCacheSecurityPasswordsOverride(max: number, maxAge: number): CacheConfigBuilder;
}
export {};
