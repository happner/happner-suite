import { ICoreBuilder } from './i-core-builder';
export interface IHappnerClusterConfigurationBuilder extends ICoreBuilder {
    withClusterRequestTimeout(timeout: number): any;
    withClusterResponseTimeout(timeout: number): any;
    withDomain(domain: string): any;
}
