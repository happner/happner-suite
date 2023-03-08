import { ICoreBuilder } from './i-core-builder';
export interface IHappnerConfigurationBuilder extends ICoreBuilder {
    withDeferListen(defer: boolean): any;
    withListenFirst(listenFirst: boolean): any;
    beginComponent(): any;
    beginEndpoint(): any;
    beginModule(): any;
}
