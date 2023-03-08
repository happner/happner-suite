import { Constructor } from '../../types/mixin-types';
export declare function HappnerClusterCoreBuilder<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        withClusterRequestTimeout(timeout: number): any;
        withClusterResponseTimeout(timeout: number): any;
        withDomain(domain: string): any;
    };
} & TBase;
