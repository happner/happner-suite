"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ConfigValidator_instances, _ConfigValidator_ajv, _ConfigValidator_fieldTypeValidator, _ConfigValidator_log, _ConfigValidator_happnSchema, _ConfigValidator_happnerSchema, _ConfigValidator_happnClusterSchema, _ConfigValidator_happnerClusterSchema, _ConfigValidator_cacheSchema, _ConfigValidator_connectSchema, _ConfigValidator_dataSchema, _ConfigValidator_dataLazySchema, _ConfigValidator_protocolSchema, _ConfigValidator_publisherSchema, _ConfigValidator_securitySchema, _ConfigValidator_subscriptionSchema, _ConfigValidator_systemSchema, _ConfigValidator_transportSchema, _ConfigValidator_utilsSchema, _ConfigValidator_errorSchema, _ConfigValidator_logSchema, _ConfigValidator_cryptoSchema, _ConfigValidator_sessionSchema, _ConfigValidator_healthSchema, _ConfigValidator_membershipSchema, _ConfigValidator_orchestratorSchema, _ConfigValidator_proxySchema, _ConfigValidator_replicatorSchema, _ConfigValidator_profileSchema, _ConfigValidator_componentsSchema, _ConfigValidator_componentsLazySchema, _ConfigValidator_endpointsSchema, _ConfigValidator_modulesSchema, _ConfigValidator_middlewareSchema, _ConfigValidator_pluginsSchema, _ConfigValidator_clusterSchema, _ConfigValidator_fetchSchemas, _ConfigValidator_validate, _ValidationResult_isValid, _ValidationResult_result, _ValidationResult_errors;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationResult = exports.ConfigValidator = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const ajv_1 = __importDefault(require("ajv"));
const default_logger_1 = __importDefault(require("../log/default-logger"));
const schema_factory_1 = require("../factories/schema-factory");
const field_type_validator_1 = require("./field-type-validator");
class ConfigValidator {
    constructor(log) {
        _ConfigValidator_instances.add(this);
        _ConfigValidator_ajv.set(this, void 0);
        _ConfigValidator_fieldTypeValidator.set(this, void 0);
        _ConfigValidator_log.set(this, void 0);
        _ConfigValidator_happnSchema.set(this, void 0);
        _ConfigValidator_happnerSchema.set(this, void 0);
        _ConfigValidator_happnClusterSchema.set(this, void 0);
        _ConfigValidator_happnerClusterSchema.set(this, void 0);
        _ConfigValidator_cacheSchema.set(this, void 0);
        _ConfigValidator_connectSchema.set(this, void 0);
        _ConfigValidator_dataSchema.set(this, void 0);
        _ConfigValidator_dataLazySchema.set(this, void 0);
        _ConfigValidator_protocolSchema.set(this, void 0);
        _ConfigValidator_publisherSchema.set(this, void 0);
        _ConfigValidator_securitySchema.set(this, void 0);
        _ConfigValidator_subscriptionSchema.set(this, void 0);
        _ConfigValidator_systemSchema.set(this, void 0);
        _ConfigValidator_transportSchema.set(this, void 0);
        _ConfigValidator_utilsSchema.set(this, void 0);
        _ConfigValidator_errorSchema.set(this, void 0);
        _ConfigValidator_logSchema.set(this, void 0);
        _ConfigValidator_cryptoSchema.set(this, void 0);
        _ConfigValidator_sessionSchema.set(this, void 0);
        _ConfigValidator_healthSchema.set(this, void 0);
        _ConfigValidator_membershipSchema.set(this, void 0);
        _ConfigValidator_orchestratorSchema.set(this, void 0);
        _ConfigValidator_proxySchema.set(this, void 0);
        _ConfigValidator_replicatorSchema.set(this, void 0);
        _ConfigValidator_profileSchema.set(this, void 0);
        _ConfigValidator_componentsSchema.set(this, void 0);
        _ConfigValidator_componentsLazySchema.set(this, void 0);
        _ConfigValidator_endpointsSchema.set(this, void 0);
        _ConfigValidator_modulesSchema.set(this, void 0);
        _ConfigValidator_middlewareSchema.set(this, void 0);
        _ConfigValidator_pluginsSchema.set(this, void 0);
        _ConfigValidator_clusterSchema.set(this, void 0);
        __classPrivateFieldSet(this, _ConfigValidator_log, log || default_logger_1.default, "f");
        __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_fetchSchemas).call(this);
        __classPrivateFieldSet(this, _ConfigValidator_ajv, new ajv_1.default({
            schemas: [
                __classPrivateFieldGet(this, _ConfigValidator_happnSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_happnerSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_happnClusterSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_happnerClusterSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_cacheSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_connectSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_dataSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_dataLazySchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_protocolSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_publisherSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_securitySchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_subscriptionSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_systemSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_transportSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_utilsSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_errorSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_logSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_cryptoSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_sessionSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_healthSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_membershipSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_orchestratorSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_proxySchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_replicatorSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_profileSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_componentsSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_componentsLazySchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_endpointsSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_modulesSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_middlewareSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_pluginsSchema, "f"),
                __classPrivateFieldGet(this, _ConfigValidator_clusterSchema, "f"),
            ],
            strictNumbers: false,
            allowUnionTypes: true,
            allowMatchingProperties: true, // allow overlap between properties and patternProperties
        }), "f");
        __classPrivateFieldSet(this, _ConfigValidator_fieldTypeValidator, new field_type_validator_1.FieldTypeValidator(), "f");
    }
    /*****************************************************
     HAPPN-SPECIFIC
     ****************************************************/
    validateCacheConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_cacheSchema, "f"));
    }
    validateConnectConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_connectSchema, "f"));
    }
    validateDataConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_dataSchema, "f"));
    }
    validateProtocolConfig(config) {
        const result = __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_protocolSchema, "f"));
        if (config.config.inboundLayers !== null) {
            config.config.inboundLayers.forEach((layer) => {
                const inboundResult = __classPrivateFieldGet(this, _ConfigValidator_fieldTypeValidator, "f").validateFunctionArgs(layer, 2);
                if (!inboundResult.isValid) {
                    if (result.valid)
                        result.valid = false;
                    result.errors.push(inboundResult.error);
                }
            });
        }
        if (config.config.outboundLayers !== null) {
            config.config.outboundLayers.forEach((layer) => {
                const outboundResult = __classPrivateFieldGet(this, _ConfigValidator_fieldTypeValidator, "f").validateFunctionArgs(layer, 2);
                if (!outboundResult.isValid) {
                    if (result.valid)
                        result.valid = false;
                    result.errors.push(outboundResult.error);
                }
            });
        }
        return result;
    }
    validatePublisherConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_publisherSchema, "f"));
    }
    validateSecurityConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_securitySchema, "f"));
    }
    validateSubscriptionConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_subscriptionSchema, "f"));
    }
    validateSystemConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_systemSchema, "f"));
    }
    validateTransportConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_transportSchema, "f"));
    }
    validateHappnConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_happnSchema, "f"));
    }
    /*****************************************************
     HAPPN-CLUSTER-SPECIFIC
     ****************************************************/
    validateHealthConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_healthSchema, "f"));
    }
    validateMembershipConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_membershipSchema, "f"));
    }
    validateOrchestratorConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_orchestratorSchema, "f"));
    }
    validateProxyConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_proxySchema, "f"));
    }
    validateReplicatorConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_replicatorSchema, "f"));
    }
    validateHappnClusterConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_happnClusterSchema, "f"));
    }
    /*****************************************************
     HAPPNER-SPECIFIC
     ****************************************************/
    validateComponentsConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_componentsSchema, "f"));
    }
    validateEndpointsConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_endpointsSchema, "f"));
    }
    validateModulesConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_modulesSchema, "f"));
    }
    validateHappnerConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_happnerSchema, "f"));
    }
    /*****************************************************
     HAPPNER-CLUSTER-SPECIFIC
     ****************************************************/
    validateHappnerClusterConfig(config) {
        return __classPrivateFieldGet(this, _ConfigValidator_instances, "m", _ConfigValidator_validate).call(this, config, __classPrivateFieldGet(this, _ConfigValidator_happnerClusterSchema, "f"));
    }
}
exports.ConfigValidator = ConfigValidator;
_ConfigValidator_ajv = new WeakMap(), _ConfigValidator_fieldTypeValidator = new WeakMap(), _ConfigValidator_log = new WeakMap(), _ConfigValidator_happnSchema = new WeakMap(), _ConfigValidator_happnerSchema = new WeakMap(), _ConfigValidator_happnClusterSchema = new WeakMap(), _ConfigValidator_happnerClusterSchema = new WeakMap(), _ConfigValidator_cacheSchema = new WeakMap(), _ConfigValidator_connectSchema = new WeakMap(), _ConfigValidator_dataSchema = new WeakMap(), _ConfigValidator_dataLazySchema = new WeakMap(), _ConfigValidator_protocolSchema = new WeakMap(), _ConfigValidator_publisherSchema = new WeakMap(), _ConfigValidator_securitySchema = new WeakMap(), _ConfigValidator_subscriptionSchema = new WeakMap(), _ConfigValidator_systemSchema = new WeakMap(), _ConfigValidator_transportSchema = new WeakMap(), _ConfigValidator_utilsSchema = new WeakMap(), _ConfigValidator_errorSchema = new WeakMap(), _ConfigValidator_logSchema = new WeakMap(), _ConfigValidator_cryptoSchema = new WeakMap(), _ConfigValidator_sessionSchema = new WeakMap(), _ConfigValidator_healthSchema = new WeakMap(), _ConfigValidator_membershipSchema = new WeakMap(), _ConfigValidator_orchestratorSchema = new WeakMap(), _ConfigValidator_proxySchema = new WeakMap(), _ConfigValidator_replicatorSchema = new WeakMap(), _ConfigValidator_profileSchema = new WeakMap(), _ConfigValidator_componentsSchema = new WeakMap(), _ConfigValidator_componentsLazySchema = new WeakMap(), _ConfigValidator_endpointsSchema = new WeakMap(), _ConfigValidator_modulesSchema = new WeakMap(), _ConfigValidator_middlewareSchema = new WeakMap(), _ConfigValidator_pluginsSchema = new WeakMap(), _ConfigValidator_clusterSchema = new WeakMap(), _ConfigValidator_instances = new WeakSet(), _ConfigValidator_fetchSchemas = function _ConfigValidator_fetchSchemas() {
    const schemaFactory = new schema_factory_1.SchemaFactory();
    __classPrivateFieldSet(this, _ConfigValidator_happnSchema, schemaFactory.getSchema('happn'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_happnerSchema, schemaFactory.getSchema('happner'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_happnClusterSchema, schemaFactory.getSchema('happn-cluster'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_happnerClusterSchema, schemaFactory.getSchema('happner-cluster'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_cacheSchema, schemaFactory.getSchema('cache'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_connectSchema, schemaFactory.getSchema('connect'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_dataSchema, schemaFactory.getSchema('data'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_dataLazySchema, schemaFactory.getSchema('data-lazy'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_protocolSchema, schemaFactory.getSchema('protocol'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_publisherSchema, schemaFactory.getSchema('publisher'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_securitySchema, schemaFactory.getSchema('security'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_subscriptionSchema, schemaFactory.getSchema('subscription'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_systemSchema, schemaFactory.getSchema('system'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_transportSchema, schemaFactory.getSchema('transport'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_utilsSchema, schemaFactory.getSchema('utils'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_errorSchema, schemaFactory.getSchema('error'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_logSchema, schemaFactory.getSchema('log'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_cryptoSchema, schemaFactory.getSchema('crypto'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_sessionSchema, schemaFactory.getSchema('session'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_healthSchema, schemaFactory.getSchema('health'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_membershipSchema, schemaFactory.getSchema('membership'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_orchestratorSchema, schemaFactory.getSchema('orchestrator'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_proxySchema, schemaFactory.getSchema('proxy'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_replicatorSchema, schemaFactory.getSchema('replicator'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_profileSchema, schemaFactory.getSchema('profile'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_componentsSchema, schemaFactory.getSchema('components'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_componentsLazySchema, schemaFactory.getSchema('components-lazy'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_endpointsSchema, schemaFactory.getSchema('endpoints'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_modulesSchema, schemaFactory.getSchema('modules'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_middlewareSchema, schemaFactory.getSchema('middleware'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_pluginsSchema, schemaFactory.getSchema('plugins'), "f");
    __classPrivateFieldSet(this, _ConfigValidator_clusterSchema, schemaFactory.getSchema('cluster'), "f");
}, _ConfigValidator_validate = function _ConfigValidator_validate(config, schema) {
    try {
        const result = new ValidationResult();
        const validate = __classPrivateFieldGet(this, _ConfigValidator_ajv, "f").compile(schema);
        result.valid = validate(config);
        if (!result.valid) {
            result.errors = validate.errors;
        }
        return result;
    }
    catch (err) {
        __classPrivateFieldGet(this, _ConfigValidator_log, "f").error(err);
        throw err;
    }
};
class ValidationResult {
    constructor() {
        _ValidationResult_isValid.set(this, void 0);
        _ValidationResult_result.set(this, void 0);
        _ValidationResult_errors.set(this, []);
    }
    set valid(isValid) {
        __classPrivateFieldSet(this, _ValidationResult_isValid, isValid, "f");
    }
    get valid() {
        return __classPrivateFieldGet(this, _ValidationResult_isValid, "f");
    }
    set result(obj) {
        __classPrivateFieldSet(this, _ValidationResult_result, obj, "f");
    }
    get result() {
        return __classPrivateFieldGet(this, _ValidationResult_result, "f");
    }
    set errors(errors) {
        __classPrivateFieldSet(this, _ValidationResult_errors, errors, "f");
    }
    get errors() {
        return __classPrivateFieldGet(this, _ValidationResult_errors, "f");
    }
}
exports.ValidationResult = ValidationResult;
_ValidationResult_isValid = new WeakMap(), _ValidationResult_result = new WeakMap(), _ValidationResult_errors = new WeakMap();
