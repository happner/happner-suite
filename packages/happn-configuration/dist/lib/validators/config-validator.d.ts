export declare class ConfigValidator {
    #private;
    constructor(log?: any);
    /*****************************************************
     HAPPN-SPECIFIC
     ****************************************************/
    validateCacheConfig(config: any): ValidationResult;
    validateConnectConfig(config: any): ValidationResult;
    validateDataConfig(config: any): ValidationResult;
    validateProtocolConfig(config: any): ValidationResult;
    validatePublisherConfig(config: any): ValidationResult;
    validateSecurityConfig(config: any): ValidationResult;
    validateSubscriptionConfig(config: any): ValidationResult;
    validateSystemConfig(config: any): ValidationResult;
    validateTransportConfig(config: any): ValidationResult;
    validateHappnConfig(config: any): ValidationResult;
    /*****************************************************
     HAPPN-CLUSTER-SPECIFIC
     ****************************************************/
    validateHealthConfig(config: any): ValidationResult;
    validateMembershipConfig(config: any): ValidationResult;
    validateOrchestratorConfig(config: any): ValidationResult;
    validateProxyConfig(config: any): ValidationResult;
    validateReplicatorConfig(config: any): ValidationResult;
    validateHappnClusterConfig(config: any): ValidationResult;
    /*****************************************************
     HAPPNER-SPECIFIC
     ****************************************************/
    validateComponentsConfig(config: any): ValidationResult;
    validateEndpointsConfig(config: any): ValidationResult;
    validateModulesConfig(config: any): ValidationResult;
    validateHappnerConfig(config: any): ValidationResult;
    /*****************************************************
     HAPPNER-CLUSTER-SPECIFIC
     ****************************************************/
    validateHappnerClusterConfig(config: any): ValidationResult;
}
export declare class ValidationResult {
    #private;
    set valid(isValid: boolean);
    get valid(): boolean;
    set result(obj: any);
    get result(): any;
    set errors(errors: any[]);
    get errors(): any[];
}
