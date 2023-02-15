declare const BaseBuilder: any;
export declare class DataConfigBuilder extends BaseBuilder {
    constructor();
    withDataStore(name: string, provider: string, isDefault: boolean, isFsync: boolean, dbFile: string, fileName: string): DataConfigBuilder;
    withSecure(secure: boolean): this;
}
export {};
