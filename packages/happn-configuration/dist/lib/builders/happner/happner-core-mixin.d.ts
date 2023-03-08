import { Constructor } from '../../types/mixin-types';
import { ComponentsConfigBuilder } from './components/components-config-builder';
import { EndpointsConfigBuilder } from './endpoints/endpoints-config-builder';
import { ModulesConfigBuilder } from './modules/modules-config-builder';
export declare function HappnerCoreBuilder<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        "__#10@#componentsConfigBuilder": ComponentsConfigBuilder;
        "__#10@#endpointsConfigBuilder": EndpointsConfigBuilder;
        "__#10@#modulesConfigBuilder": ModulesConfigBuilder;
        withDeferListen(defer: boolean): any;
        withListenFirst(listenFirst: boolean): any;
        beginComponent(): import("./components/components-config-builder").ComponentConfigBuilder;
        beginEndpoint(): import("./endpoints/endpoints-config-builder").EndpointConfigBuilder;
        beginModule(): import("./modules/modules-config-builder").ModuleConfigBuilder;
    };
} & TBase;
