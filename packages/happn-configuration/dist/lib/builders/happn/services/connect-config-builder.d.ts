declare const BaseBuilder: any;
export declare class ConnectConfigBuilder extends BaseBuilder {
    constructor();
    withSecurityExclusion(exclusion: string): ConnectConfigBuilder;
    withSecurityForbiddenResponsePath(path: string): ConnectConfigBuilder;
    withSecurityUnauthorizedResponsePath(path: string): ConnectConfigBuilder;
}
export {};
