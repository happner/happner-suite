const Ajv = require('ajv');
const happnSchema = require('../schemas/happn-schema.json');
const cacheSchema = require('../schemas/services/cache-schema.json');
const connectSchema = require('../schemas/services/connect-schema.json');
const dataSchema = require('../schemas/services/data-schema.json');
const protocolSchema = require('../schemas/services/protocol-schema.json');
const publisherSchema = require('../schemas/services/publisher-schema.json');
const securitySchema = require('../schemas/services/services-security-schema.json');
const subscriptionSchema = require('../schemas/services/subscription-schema.json');
const systemSchema = require('../schemas/services/system-schema.json');
const transportSchema = require('../schemas/services/transport-schema.json');
const healthSchema = require('../schemas/services/health-schema.json');
const membershipSchema = require('../schemas/services/membership-schema.json');
const orchestratorSchema = require('../schemas/services/orchestrator-schema.json');
const proxySchema = require('../schemas/services/proxy-schema.json');
const replicatorSchema = require('../schemas/services/replicator-schema.json');
const componentsSchema = require('../schemas/components/components-schema.json');
const endpointsSchema = require('../schemas/endpoints/endpoints-schema.json');
const modulesSchema = require('../schemas/modules/modules-schema.json');
import { FieldTypeValidator } from './field-type-validator';

export class ConfigValidator {
  #ajv;
  #fieldTypeValidator;

  constructor() {
    this.#ajv = new Ajv({
      schemas: [
        cacheSchema,
        connectSchema,
        dataSchema,
        protocolSchema,
        publisherSchema,
        securitySchema,
        subscriptionSchema,
        systemSchema,
        transportSchema,
        healthSchema,
        membershipSchema,
        orchestratorSchema,
        proxySchema,
        replicatorSchema,
        componentsSchema,
        endpointsSchema,
        modulesSchema,
      ],
      strictNumbers: false, // to handle Infinity types
      allowUnionTypes: true, // handle multiple allowed types, eg: string,object
    });

    this.#fieldTypeValidator = new FieldTypeValidator();
  }

  validateCacheConfig(config: any): ValidationResult {
    return this.#validate(config, cacheSchema);
  }

  validateConnectConfig(config: any): ValidationResult {
    return this.#validate(config, connectSchema);
  }

  validateDataConfig(config: any): ValidationResult {
    return this.#validate(config, dataSchema);
  }

  validateProtocolConfig(config: any): ValidationResult {
    let result = this.#validate(config, protocolSchema);

    if (config.config.inboundLayers !== null) {
      config.config.inboundLayers.forEach((layer) => {
        let inboundResult = this.#fieldTypeValidator.validateFunctionArgs(layer, 2);
        if (!inboundResult.isValid) {
          if (result.valid) result.valid = false;
          result.errors.push(inboundResult.error);
        }
      });
    }

    if (config.config.outboundLayers !== null) {
      config.config.outboundLayers.forEach((layer) => {
        let outboundResult = this.#fieldTypeValidator.validateFunctionArgs(layer, 2);
        if (!outboundResult.isValid) {
          if (result.valid) result.valid = false;
          result.errors.push(outboundResult.error);
        }
      });
    }

    return result;
  }

  validatePublisherConfig(config: any): ValidationResult {
    return this.#validate(config, publisherSchema);
  }

  validateSecurityConfig(config: any): ValidationResult {
    return this.#validate(config, securitySchema);
  }

  validateSubscriptionConfig(config: any): ValidationResult {
    return this.#validate(config, subscriptionSchema);
  }

  validateSystemConfig(config: any): ValidationResult {
    return this.#validate(config, systemSchema);
  }

  validateTransportConfig(config: any): ValidationResult {
    return this.#validate(config, transportSchema);
  }

  validateHealthConfig(config: any): ValidationResult {
    return this.#validate(config, healthSchema);
  }

  validateMembershipConfig(config: any): ValidationResult {
    return this.#validate(config, membershipSchema);
  }

  validateOrchestratorConfig(config: any): ValidationResult {
    return this.#validate(config, orchestratorSchema);
  }

  validateProxyConfig(config: any): ValidationResult {
    return this.#validate(config, proxySchema);
  }

  validateReplicatorConfig(config: any): ValidationResult {
    return this.#validate(config, replicatorSchema);
  }

  validateHappnConfig(config: any): ValidationResult {
    return this.#validate(config, happnSchema);
  }

  /*****************************************************
   HAPPNER-SPECIFIC
   ****************************************************/

  validateComponentsConfig(config: any): ValidationResult {
    return this.#validate(config, componentsSchema);
  }

  validateEndpointsConfig(config: any): ValidationResult {
    return this.#validate(config, endpointsSchema);
  }

  validateModulesConfig(config: any): ValidationResult {
    return this.#validate(config, modulesSchema);
  }

  /*
  HELPERS
   */

  #validate(config: any, schema: string): ValidationResult {
    // const result = { valid: false, errors: [] };
    const result = new ValidationResult();

    const validate = this.#ajv.compile(schema);
    result.valid = validate(config);

    if (!result.valid) {
      result.errors = validate.errors;
    }
    return result;
  }
}

export class ValidationResult {
  #isValid: boolean;
  #result: any;
  #errors: any[] = [];

  set valid(isValid: boolean) {
    this.#isValid = isValid;
  }

  get valid(): boolean {
    return this.#isValid;
  }

  set result(obj: any) {
    this.#result = obj;
  }

  get result(): any {
    return this.#result;
  }

  set errors(errors: any[]) {
    this.#errors = errors;
  }

  get errors(): any[] {
    return this.#errors;
  }
}
