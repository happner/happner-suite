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
const FieldTypeValidator = require('../validators/field-type-validator');

module.exports = class ConfigValidator {
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
      ],
      strictNumbers: false, // to handle Infinity types
    });

    this.#fieldTypeValidator = new FieldTypeValidator();
  }

  validateCacheConfig(config) {
    return this.#validate(config, cacheSchema);
  }

  validateConnectConfig(config) {
    return this.#validate(config, connectSchema);
  }

  validateDataConfig(config) {
    return this.#validate(config, dataSchema);
  }

  validateProtocolConfig(config) {
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

  validatePublisherConfig(config) {
    return this.#validate(config, publisherSchema);
  }

  validateSecurityConfig(config) {
    return this.#validate(config, securitySchema);
  }

  validateSubscriptionConfig(config) {
    return this.#validate(config, subscriptionSchema);
  }

  validateSystemConfig(config) {
    return this.#validate(config, systemSchema);
  }

  validateTransportConfig(config) {
    return this.#validate(config, transportSchema);
  }

  validateHealthConfig(config) {
    return this.#validate(config, healthSchema);
  }

  validateMembershipConfig(config) {
    return this.#validate(config, membershipSchema);
  }

  validateOrchestratorConfig(config) {
    return this.#validate(config, orchestratorSchema);
  }

  validateProxyConfig(config) {
    return this.#validate(config, proxySchema);
  }

  validateReplicatorConfig(config) {
    return this.#validate(config, replicatorSchema);
  }

  validateHappnConfig(config) {
    return this.#validate(config, happnSchema);
  }

  #validate(config, schema) {
    const result = { valid: false, errors: [] };
    const validate = this.#ajv.compile(schema);
    result.valid = validate(config);

    if (!result.valid) {
      result.errors = validate.errors;
    }
    return result;
  }
};
