import { Constructor } from '../../types/mixin-types';
export declare function HappnCoreBuilder<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        /***
         * This function takes the container (which cascades through all constructors in the mixin chain)
         * and extracts the relevant child builders for this specific builder. It then exposes the child
         * builders as properties on this class, to enable dot-notation invocation.
         * @param container
         * @private
         */
        "__#14@#initialiseChildBuilders"(container: any): void;
        withName(name: string): any;
        withHost(host: string): any;
        withPort(port: number): any;
        withSecure(isSecure: boolean): any;
        withAllowNestedPermissions(allow: boolean): any;
    };
} & TBase;
