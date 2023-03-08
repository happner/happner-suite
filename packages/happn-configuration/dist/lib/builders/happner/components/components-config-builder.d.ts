declare const BaseBuilder: any;
export declare class ComponentsConfigBuilder extends BaseBuilder {
    constructor();
    beginComponent(): ComponentConfigBuilder;
}
export declare class ComponentConfigBuilder extends BaseBuilder {
    #private;
    constructor(parent: ComponentsConfigBuilder);
    withName(name: string): ComponentConfigBuilder;
    withModuleName(name: string): ComponentConfigBuilder;
    withSchemaExclusive(isExclusive: boolean): ComponentConfigBuilder;
    withWebRoute(name: string, value: string): ComponentConfigBuilder;
    withDataRoute(name: string, value: string): ComponentConfigBuilder;
    withEvent(name: string, value: unknown): ComponentConfigBuilder;
    beginFunction(): FunctionBuilder;
    endComponent(): any;
}
export declare class FunctionBuilder extends BaseBuilder {
    #private;
    constructor(parent: ComponentConfigBuilder);
    withName(name: string, lifeCycleType: string): FunctionBuilder;
    withModelType(type: string): FunctionBuilder;
    withAlias(alias: string): FunctionBuilder;
    withParameter(name: string, value: any, type?: string, required?: boolean): FunctionBuilder;
    withCallbackParameter(name: string, type: string): FunctionBuilder;
    endFunction(): any;
}
export {};
