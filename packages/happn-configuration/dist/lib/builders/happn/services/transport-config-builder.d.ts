declare const BaseBuilder: any;
export declare class TransportConfigBuilder extends BaseBuilder {
    constructor();
    withCert(cert: string): TransportConfigBuilder;
    withCertPath(certPath: string): TransportConfigBuilder;
    withKeepAliveTimeout(timeout: number): TransportConfigBuilder;
    withKey(key: string): TransportConfigBuilder;
    withKeyPath(keyPath: string): TransportConfigBuilder;
    withMode(mode: string): TransportConfigBuilder;
}
export {};
