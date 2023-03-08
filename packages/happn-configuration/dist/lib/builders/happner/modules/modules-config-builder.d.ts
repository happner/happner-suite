declare const BaseBuilder: any;
export declare class ModulesConfigBuilder extends BaseBuilder {
    constructor();
    beginModule(): ModuleConfigBuilder;
}
export declare class ModuleConfigBuilder extends BaseBuilder {
    #private;
    constructor(parent: ModulesConfigBuilder);
    withName(name: string): ModuleConfigBuilder;
    withPath(path: string): ModuleConfigBuilder;
    beginConstruct(): ModuleCreationBuilder;
    beginCreate(): ModuleCreationBuilder;
    endModule(): ModulesConfigBuilder;
}
export declare class ModuleCreationBuilder extends BaseBuilder {
    #private;
    constructor(parent: ModuleConfigBuilder, type: string);
    withName(name: string): ModuleCreationBuilder;
    withParameter(name: string, value: any, type?: string): ModuleCreationBuilder;
    withCallbackParameter(name: string, type: string): ModuleCreationBuilder;
    endConstruct(): ModuleConfigBuilder;
    endCreate(): ModuleConfigBuilder;
}
export {};
