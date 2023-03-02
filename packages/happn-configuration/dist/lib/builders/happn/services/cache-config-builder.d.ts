declare const BaseBuilder: any;
export declare class CacheConfigBuilder extends BaseBuilder {
    constructor();
    withStatisticsInterval(interval: number): CacheConfigBuilder;
    withCheckoutPointCacheAuthOverride(max: number, maxAge: number): CacheConfigBuilder;
    withCheckoutPointCacheAuthTokenOverride(max: number, maxAge: number): CacheConfigBuilder;
    withCacheSecurityGroupsOverride(max: number, maxAge: number): CacheConfigBuilder;
    withCacheSecurityUsersOverride(max: number, maxAge: number): CacheConfigBuilder;
    withCacheSecurityGroupPermissionsOverride(max: number, maxAge: number): CacheConfigBuilder;
    withCacheSecurityUserPermissionsOverride(max: number, maxAge: number): CacheConfigBuilder;
    withCacheSecurityPasswordsOverride(max: number, maxAge: number): CacheConfigBuilder;
}
export {};
