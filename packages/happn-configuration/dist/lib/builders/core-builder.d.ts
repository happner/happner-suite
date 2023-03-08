import { ICoreBuilder } from './interfaces/i-core-builder';
import BaseBuilder from 'happn-commons/lib/base-builder';
export declare class CoreBuilder extends BaseBuilder implements ICoreBuilder {
    #private;
    constructor(container: any);
    set builderType(type: any);
    get builderType(): any;
    build(): any;
}
