declare const BaseBuilder: any;
export declare class HealthConfigBuilder extends BaseBuilder {
    constructor();
    withHealthWarmupLimit(limit: number): HealthConfigBuilder;
    withHealthInterval(interval: number): HealthConfigBuilder;
}
export {};
