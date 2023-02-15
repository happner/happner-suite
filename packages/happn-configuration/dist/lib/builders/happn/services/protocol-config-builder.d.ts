declare const BaseBuilder: any;
import { FieldTypeValidator } from '../../../validators/field-type-validator.js';
export declare class ProtocolConfigBuilder extends BaseBuilder {
    #private;
    constructor(fieldTypeValidator: FieldTypeValidator);
    withSecure(isSecure: boolean): ProtocolConfigBuilder;
    withAllowNestedPermissions(isAllowed: boolean): ProtocolConfigBuilder;
    withInboundLayer(layerFunc: Function): ProtocolConfigBuilder;
    withOutboundLayer(layerFunc: Function): ProtocolConfigBuilder;
}
export {};
