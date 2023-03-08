declare const BaseBuilder: any;
export declare class ProxyConfigBuilder extends BaseBuilder {
    constructor();
    withProxyAllowSelfSignedCerts(allow: boolean): ProxyConfigBuilder;
    withProxyCertPath(path: string): ProxyConfigBuilder;
    withProxyHost(host: string): ProxyConfigBuilder;
    withProxyKeyPath(path: string): ProxyConfigBuilder;
    withProxyPort(port: number): ProxyConfigBuilder;
    withProxyTimeout(timeout: number): ProxyConfigBuilder;
}
export {};
