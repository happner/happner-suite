/* eslint-disable @typescript-eslint/no-var-requires */
import Ajv from 'ajv';
import defaultLogger from '../log/default-logger';
import { SchemaFactory } from '../factories/schema-factory';
import { FieldTypeValidator } from './field-type-validator';

export class ConfigValidator {
  #ajv;
  #fieldTypeValidator;
  #log;

  #happnSchema;
  #happnerSchema;
  #happnClusterSchema;
  #happnerClusterSchema;
  #cacheSchema;
  #connectSchema;
  #dataSchema;
  #dataLazySchema;
  #protocolSchema;
  #publisherSchema;
  #securitySchema;
  #subscriptionSchema;
  #systemSchema;
  #transportSchema;
  #utilsSchema;
  #errorSchema;
  #logSchema;
  #cryptoSchema;
  #sessionSchema;
  #healthSchema;
  #membershipSchema;
  #orchestratorSchema;
  #proxySchema;
  #replicatorSchema;
  #profileSchema;
  #componentsSchema;
  #componentsLazySchema;
  #endpointsSchema;
  #modulesSchema;
  #middlewareSchema;
  #pluginsSchema;
  #clusterSchema;

  constructor(targetVersion, log?) {
    this.#log = log || defaultLogger;
    this.#fetchSchemas(targetVersion);

    this.#ajv = new Ajv({
      schemas: [
        this.#happnSchema,
        this.#happnerSchema,
        this.#happnClusterSchema,
        this.#happnerClusterSchema,
        this.#cacheSchema,
        this.#connectSchema,
        this.#dataSchema,
        this.#dataLazySchema,
        this.#protocolSchema,
        this.#publisherSchema,
        this.#securitySchema,
        this.#subscriptionSchema,
        this.#systemSchema,
        this.#transportSchema,
        this.#utilsSchema,
        this.#errorSchema,
        this.#logSchema,
        this.#cryptoSchema,
        this.#sessionSchema,
        this.#healthSchema,
        this.#membershipSchema,
        this.#orchestratorSchema,
        this.#proxySchema,
        this.#replicatorSchema,
        this.#profileSchema,
        this.#componentsSchema,
        this.#componentsLazySchema,
        this.#endpointsSchema,
        this.#modulesSchema,
        this.#middlewareSchema,
        this.#pluginsSchema,
        this.#clusterSchema,
      ],
      strictNumbers: false, // to handle Infinity types
      allowUnionTypes: true, // handle multiple allowed types, eg: string,object
      allowMatchingProperties: true, // allow overlap between properties and patternProperties
    });

    this.#fieldTypeValidator = new FieldTypeValidator();
  }

  #fetchSchemas(targetVersion) {
    const schemaFactory = new SchemaFactory(targetVersion);

    this.#happnSchema = schemaFactory.getSchema('happn');
    this.#happnerSchema = schemaFactory.getSchema('happner');
    this.#happnClusterSchema = schemaFactory.getSchema('happn-cluster');
    this.#happnerClusterSchema = schemaFactory.getSchema('happner-cluster');
    this.#cacheSchema = schemaFactory.getSchema('cache');
    this.#connectSchema = schemaFactory.getSchema('connect');
    this.#dataSchema = schemaFactory.getSchema('data');
    this.#dataLazySchema = schemaFactory.getSchema('data-lazy');
    this.#protocolSchema = schemaFactory.getSchema('protocol');
    this.#publisherSchema = schemaFactory.getSchema('publisher');
    this.#securitySchema = schemaFactory.getSchema('security');
    this.#subscriptionSchema = schemaFactory.getSchema('subscription');
    this.#systemSchema = schemaFactory.getSchema('system');
    this.#transportSchema = schemaFactory.getSchema('transport');
    this.#utilsSchema = schemaFactory.getSchema('utils');
    this.#errorSchema = schemaFactory.getSchema('error');
    this.#logSchema = schemaFactory.getSchema('log');
    this.#cryptoSchema = schemaFactory.getSchema('crypto');
    this.#sessionSchema = schemaFactory.getSchema('session');
    this.#healthSchema = schemaFactory.getSchema('health');
    this.#membershipSchema = schemaFactory.getSchema('membership');
    this.#orchestratorSchema = schemaFactory.getSchema('orchestrator');
    this.#proxySchema = schemaFactory.getSchema('proxy');
    this.#replicatorSchema = schemaFactory.getSchema('replicator');
    this.#profileSchema = schemaFactory.getSchema('profile');
    this.#componentsSchema = schemaFactory.getSchema('components');
    this.#componentsLazySchema = schemaFactory.getSchema('components-lazy');
    this.#endpointsSchema = schemaFactory.getSchema('endpoints');
    this.#modulesSchema = schemaFactory.getSchema('modules');
    this.#middlewareSchema = schemaFactory.getSchema('middleware');
    this.#pluginsSchema = schemaFactory.getSchema('plugins');
    this.#clusterSchema = schemaFactory.getSchema('cluster');
  }

  /*****************************************************
   HAPPN-SPECIFIC
   ****************************************************/

  validateCacheConfig(config: any): ValidationResult {
    return this.#validate(config, this.#cacheSchema);
  }

  validateConnectConfig(config: any): ValidationResult {
    return this.#validate(config, this.#connectSchema);
  }

  validateDataConfig(config: any): ValidationResult {
    return this.#validate(config, this.#dataSchema);
  }

  validateProtocolConfig(config: any): ValidationResult {
    const result = this.#validate(config, this.#protocolSchema);

    if (config.config.inboundLayers !== null) {
      config.config.inboundLayers.forEach((layer) => {
        const inboundResult = this.#fieldTypeValidator.validateFunctionArgs(layer, 2);
        if (!inboundResult.isValid) {
          if (result.valid) result.valid = false;
          result.errors.push(inboundResult.error);
        }
      });
    }

    if (config.config.outboundLayers !== null) {
      config.config.outboundLayers.forEach((layer) => {
        const outboundResult = this.#fieldTypeValidator.validateFunctionArgs(layer, 2);
        if (!outboundResult.isValid) {
          if (result.valid) result.valid = false;
          result.errors.push(outboundResult.error);
        }
      });
    }

    return result;
  }

  validatePublisherConfig(config: any): ValidationResult {
    return this.#validate(config, this.#publisherSchema);
  }

  validateSecurityConfig(config: any): ValidationResult {
    return this.#validate(config, this.#securitySchema);
  }

  validateSubscriptionConfig(config: any): ValidationResult {
    return this.#validate(config, this.#subscriptionSchema);
  }

  validateSystemConfig(config: any): ValidationResult {
    return this.#validate(config, this.#systemSchema);
  }

  validateTransportConfig(config: any): ValidationResult {
    return this.#validate(config, this.#transportSchema);
  }

  validateHappnConfig(config: any): ValidationResult {
    return this.#validate(config, this.#happnSchema);
  }

  /*****************************************************
   HAPPN-CLUSTER-SPECIFIC
   ****************************************************/

  validateHealthConfig(config: any): ValidationResult {
    return this.#validate(config, this.#healthSchema);
  }

  validateMembershipConfig(config: any): ValidationResult {
    return this.#validate(config, this.#membershipSchema);
  }

  validateOrchestratorConfig(config: any): ValidationResult {
    return this.#validate(config, this.#orchestratorSchema);
  }

  validateProxyConfig(config: any): ValidationResult {
    return this.#validate(config, this.#proxySchema);
  }

  validateReplicatorConfig(config: any): ValidationResult {
    return this.#validate(config, this.#replicatorSchema);
  }

  validateHappnClusterConfig(config: any) {
    return this.#validate(config, this.#happnClusterSchema);
  }

  /*****************************************************
   HAPPNER-SPECIFIC
   ****************************************************/

  validateComponentsConfig(config: any): ValidationResult {
    return this.#validate(config, this.#componentsSchema);
  }

  validateEndpointsConfig(config: any): ValidationResult {
    return this.#validate(config, this.#endpointsSchema);
  }

  validateModulesConfig(config: any): ValidationResult {
    return this.#validate(config, this.#modulesSchema);
  }

  validateHappnerConfig(config: any) {
    return this.#validate(config, this.#happnerSchema);
  }

  /*****************************************************
   HAPPNER-CLUSTER-SPECIFIC
   ****************************************************/

  validateHappnerClusterConfig(config: any) {
    return this.#validate(config, this.#happnerClusterSchema);
  }

  /*
  HELPERS
   */

  #validate(config: any, schema: string): ValidationResult {
    try {
      const result = new ValidationResult();

      const validate = this.#ajv.compile(schema);
      result.valid = validate(config);

      if (!result.valid) {
        result.errors = validate.errors;
      }
      return result;
    } catch (err) {
      this.#log.error(err);
      throw err;
    }
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
