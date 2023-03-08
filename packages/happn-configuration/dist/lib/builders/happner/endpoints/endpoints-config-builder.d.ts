declare const BaseBuilder: any;
export declare class EndpointsConfigBuilder extends BaseBuilder {
    constructor();
    beginEndpoint(): EndpointConfigBuilder;
}
export declare class EndpointConfigBuilder extends BaseBuilder {
    #private;
    constructor(parent: EndpointsConfigBuilder);
    withName(name: string): EndpointConfigBuilder;
    withAllowSelfSignedCerts(allow: boolean): EndpointConfigBuilder;
    withHost(host: string): EndpointConfigBuilder;
    withPassword(password: string): EndpointConfigBuilder;
    withPort(port: number): EndpointConfigBuilder;
    withReconnect(max: number, retries: number): EndpointConfigBuilder;
    withUrl(url: string): EndpointConfigBuilder;
    withUsername(username: string): EndpointConfigBuilder;
    endEndpoint(): EndpointsConfigBuilder;
}
export {};
