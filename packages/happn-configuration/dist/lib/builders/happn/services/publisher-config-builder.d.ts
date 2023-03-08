declare const BaseBuilder: any;
export declare class PublisherConfigBuilder extends BaseBuilder {
    constructor();
    withAcknowledgeTimeout(acknowledge: number): PublisherConfigBuilder;
    withTimeout(timeout: number): PublisherConfigBuilder;
}
export {};
